import { chromium } from "playwright";
import {
  DEFAULT_MAX_CANDIDATES,
  DEFAULT_NAVIGATION_TIMEOUT_MS,
  EXTRACTOR_USER_AGENT
} from "../config.js";
import { candidateSelector, EXCLUDE_SELECTORS } from "./allowlist.js";
import { pruneCandidates } from "./pruner.js";
import type { CandidateElement, ExtractionResult, ExtractorOptions } from "./types.js";

export async function extractCandidates(
  url: string,
  options: ExtractorOptions = {}
): Promise<ExtractionResult> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: EXTRACTOR_USER_AGENT
  });
  const page = await context.newPage();
  const timeoutMs = options.timeoutMs ?? DEFAULT_NAVIGATION_TIMEOUT_MS;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);

    const title = await page.title();
    const candidates = (await page.evaluate(
      browserExtractionScript(candidateSelector(), EXCLUDE_SELECTORS)
    )) as CandidateElement[];

    return {
      url: page.url(),
      title,
      rawCandidateCount: candidates.length,
      candidates: pruneCandidates(candidates as CandidateElement[], options.maxCandidates ?? DEFAULT_MAX_CANDIDATES)
    };
  } finally {
    await browser.close();
  }
}

function browserExtractionScript(selector: string, excludeSelectors: readonly string[]): string {
  return `
(() => {
  const selector = ${JSON.stringify(selector)};
  const excludeSelectors = ${JSON.stringify(excludeSelectors)};
  const nodes = Array.from(document.querySelectorAll(selector));

  const isExcluded = (element) =>
    excludeSelectors.some((exclude) => element.matches(exclude) || Boolean(element.closest(exclude)));

  const isVisible = (element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };

  const isActionableCandidate = (element) => {
    const tag = element.tagName.toLowerCase();
    const type = element.getAttribute("type");
    const role = element.getAttribute("role");

    if (
      tag === "button" ||
      tag === "a" ||
      tag === "form" ||
      tag === "select" ||
      (tag === "input" && ["submit", "button", "checkbox", "radio"].includes(type || ""))
    ) {
      return true;
    }

    if (role === "button" || role === "link") {
      return true;
    }

    if (element.hasAttribute("data-action")) {
      return true;
    }

    const dataTestId = element.getAttribute("data-testid") || "";
    return /(button|link|submit|search|filter|cart|checkout|login|signup|subscribe|contact|demo|quote|buy|apply)/i.test(
      dataTestId
    );
  };

  const labelFor = (element) => {
    const aria = element.getAttribute("aria-label");
    const titleAttr = element.getAttribute("title");
    const placeholder = element.getAttribute("placeholder");
    const value = element.getAttribute("value");
    const dataAction = element.getAttribute("data-action");
    const dataTestId = element.getAttribute("data-testid");
    const text = element.innerText || element.textContent || "";
    return aria || titleAttr || placeholder || value || text || dataAction || dataTestId || "";
  };

  const triggerFor = (element) => {
    const tag = element.tagName.toLowerCase();
    if (tag === "form" || (tag === "input" && element.getAttribute("type") === "submit")) {
      return "submit";
    }
    if (tag === "select") {
      return "type";
    }
    return "click";
  };

  const attrsFor = (element) => {
    const names = ["id", "class", "name", "type", "role", "aria-label", "data-action", "data-testid", "href"];
    const attrs = {};
    for (const name of names) {
      const value = element.getAttribute(name);
      if (value) {
        attrs[name] = value;
      }
    }
    return attrs;
  };

  const stableSelectorFor = (element) => {
    if (element.id) {
      return "#" + CSS.escape(element.id);
    }
    const dataTestId = element.getAttribute("data-testid");
    if (dataTestId) {
      return '[data-testid="' + dataTestId.replace(/"/g, '\\\\"') + '"]';
    }
    const aria = element.getAttribute("aria-label");
    if (aria) {
      return element.tagName.toLowerCase() + '[aria-label="' + aria.replace(/"/g, '\\\\"') + '"]';
    }
    const name = element.getAttribute("name");
    if (name) {
      return element.tagName.toLowerCase() + '[name="' + name.replace(/"/g, '\\\\"') + '"]';
    }
    return "";
  };

  const selectorFor = (element) => {
    const stable = stableSelectorFor(element);
    if (stable) {
      return stable;
    }
    const parts = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      const currentStable = stableSelectorFor(current);
      if (currentStable) {
        parts.unshift(currentStable);
        break;
      }
      const tag = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (!parent) {
        parts.unshift(tag);
        break;
      }
      const siblings = Array.from(parent.children).filter((sibling) => sibling.tagName === current.tagName);
      const index = siblings.indexOf(current) + 1;
      parts.unshift(tag + ":nth-of-type(" + index + ")");
      current = parent;
    }
    if (parts.length > 0) {
      return parts.join(" > ");
    }
    const parent = element.parentElement;
    if (!parent) {
      return element.tagName.toLowerCase();
    }
    const siblings = Array.from(parent.children).filter((sibling) => sibling.tagName === element.tagName);
    const index = siblings.indexOf(element) + 1;
    return element.tagName.toLowerCase() + ":nth-of-type(" + index + ")";
  };

  const selectorChainFor = (element) => {
    const chain = [selectorFor(element)];
    const role = element.getAttribute("role");
    const tag = element.tagName.toLowerCase();
    if (role) {
      chain.push(tag + '[role="' + role + '"]');
    }
    chain.push(tag);
    return Array.from(new Set(chain));
  };

  const formSelectorFor = (element) => {
    const form = element.closest("form");
    return form ? selectorFor(form) : undefined;
  };

  const findPreviousHeading = (element) => {
    let current = element;
    while (current && current.previousElementSibling) {
      current = current.previousElementSibling;
      if (/^H[1-6]$/.test(current.tagName)) {
        return current;
      }
      const nested = current.querySelector("h1,h2,h3,h4,h5,h6");
      if (nested) {
        return nested;
      }
    }
    return null;
  };

  const contextFor = (element) => {
    const section = element.closest("section, article, main, aside, form, [role='main']");
    const heading = section?.querySelector("h1,h2,h3,h4,h5,h6")?.textContent;
    if (heading) {
      return heading.replace(/\\s+/g, " ").trim();
    }
    const previousHeading = findPreviousHeading(element);
    return previousHeading?.textContent?.replace(/\\s+/g, " ").trim() ?? "";
  };

  return nodes
    .filter((element) => isActionableCandidate(element) && !isExcluded(element) && isVisible(element))
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      label: labelFor(element),
      attributes: attrsFor(element),
      selector: selectorFor(element),
      selector_chain: selectorChainFor(element),
      trigger_method: triggerFor(element),
      context: contextFor(element),
      page_title: document.title,
      url: window.location.href,
      href: element.getAttribute("href") ?? undefined,
      in_navigation: Boolean(element.closest("nav")),
      in_footer: Boolean(element.closest("footer")),
      form_selector: formSelectorFor(element)
    }));
})()
`;
}
