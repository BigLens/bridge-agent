import assert from "node:assert/strict";
import test from "node:test";
import { pruneCandidates } from "../../src/extractor/pruner.js";
import type { CandidateElement } from "../../src/extractor/types.js";

test("pruneCandidates removes pure navigation noise but keeps conversion links", () => {
  const candidates = [
    candidate({ label: "Home", tag: "a", href: "/", in_navigation: true }),
    candidate({ label: "Checkout", tag: "a", href: "/checkout", in_navigation: true }),
    candidate({ label: "Add to cart", tag: "button", in_navigation: false })
  ];

  const pruned = pruneCandidates(candidates, 10);

  assert.deepEqual(
    pruned.map((item) => item.label),
    ["Checkout", "Add to cart"]
  );
});

test("pruneCandidates deduplicates equivalent selector-label pairs", () => {
  const candidates = [
    candidate({ label: "Search", selector: "#search" }),
    candidate({ label: "Search", selector: "#search" })
  ];

  assert.equal(pruneCandidates(candidates, 10).length, 1);
});

test("pruneCandidates removes accessibility skip links", () => {
  const candidates = [
    candidate({ label: "Skip to Content", tag: "a", href: "#main", in_navigation: false }),
    candidate({ label: "Start free trial", tag: "a", href: "/trial", in_navigation: false })
  ];

  assert.deepEqual(
    pruneCandidates(candidates, 10).map((item) => item.label),
    ["Start free trial"]
  );
});

test("pruneCandidates removes generic content links outside navigation", () => {
  const candidates = [
    candidate({ label: "Read more", tag: "a", href: "/blog", in_navigation: false }),
    candidate({ label: "Proceed to checkout", tag: "a", href: "/checkout", in_navigation: false })
  ];

  assert.deepEqual(
    pruneCandidates(candidates, 10).map((item) => item.label),
    ["Proceed to checkout"]
  );
});

test("pruneCandidates removes legal and subordinate app-store links", () => {
  const candidates = [
    candidate({ label: "Privacy Policy", tag: "a", href: "/privacy", in_footer: true }),
    candidate({ label: "Google Play Store", tag: "a", href: "https://play.google.com/store/apps/example" }),
    candidate({ label: "Download app", tag: "a", href: "/download" })
  ];

  assert.deepEqual(
    pruneCandidates(candidates, 10).map((item) => item.label),
    ["Download app"]
  );
});

test("pruneCandidates skips submit/select controls inside an accepted form", () => {
  const candidates = [
    candidate({ label: "Search products Search", tag: "form", selector: "#search-form", trigger_method: "submit" }),
    candidate({
      label: "Search",
      tag: "button",
      selector: "#search-form > button",
      trigger_method: "click",
      attributes: { type: "submit" },
      form_selector: "#search-form"
    }),
    candidate({
      label: "Language",
      tag: "select",
      selector: "#search-form > select",
      trigger_method: "type",
      form_selector: "#search-form"
    })
  ];

  assert.deepEqual(
    pruneCandidates(candidates, 10).map((item) => item.selector),
    ["#search-form"]
  );
});

function candidate(overrides: Partial<CandidateElement>): CandidateElement {
  return {
    tag: "button",
    label: "Action",
    attributes: {},
    selector: overrides.selector ?? "#action",
    selector_chain: [overrides.selector ?? "#action"],
    trigger_method: "click",
    context: "",
    page_title: "Test",
    url: "https://example.com",
    href: undefined,
    in_navigation: false,
    ...overrides
  };
}
