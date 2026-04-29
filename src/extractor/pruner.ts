import type { CandidateElement } from "./types.js";

const GENERIC_LABELS = new Set([
  "",
  "home",
  "menu",
  "close",
  "open",
  "next",
  "previous",
  "prev",
  "back",
  "learn more",
  "read more",
  "click here",
  "more",
  "skip to content",
  "skip to main content"
]);

const LEGAL_LABELS = new Set([
  "terms",
  "terms of use",
  "privacy",
  "privacy policy",
  "cookie policy",
  "license",
  "creative commons attribution-sharealike license"
]);

const SUBORDINATE_PLATFORM_LABELS = new Set(["google play store", "apple app store", "app store"]);

export function pruneCandidates(candidates: CandidateElement[], maxCandidates: number): CandidateElement[] {
  const seen = new Set<string>();
  const acceptedForms = new Set<string>();
  const pruned: CandidateElement[] = [];

  for (const candidate of candidates) {
    const label = normalizeLabel(candidate.label);
    const lower = label.toLowerCase();

    if (!label) {
      continue;
    }

    if (GENERIC_LABELS.has(lower)) {
      continue;
    }

    if (isLegalOrPolicyLink(candidate, lower) || SUBORDINATE_PLATFORM_LABELS.has(lower)) {
      continue;
    }

    if (isPureNavigation(candidate, label)) {
      continue;
    }

    if (isDuplicateFormControl(candidate, acceptedForms)) {
      continue;
    }

    const key = `${candidate.selector}|${label}|${candidate.trigger_method}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    pruned.push({ ...candidate, label });
    if (candidate.tag === "form") {
      acceptedForms.add(candidate.selector);
    }

    if (pruned.length >= maxCandidates) {
      break;
    }
  }

  return pruned;
}

function normalizeLabel(label: string): string {
  return label.replace(/\s+/g, " ").trim();
}

function isPureNavigation(candidate: CandidateElement, label: string): boolean {
  const lower = label.toLowerCase();

  if (lower.startsWith("skip to ")) {
    return true;
  }

  if (!candidate.in_navigation || candidate.tag !== "a") {
    return false;
  }

  const href = candidate.href ?? "";
  const actionish = /(cart|checkout|quote|book|demo|contact|signup|sign up|subscribe|login|log in|search|account|apply|buy|pricing)/i;

  if (actionish.test(lower) || actionish.test(href)) {
    return false;
  }

  return GENERIC_LABELS.has(lower) || href.startsWith("/") || href.startsWith("#");
}

function isLegalOrPolicyLink(candidate: CandidateElement, lowerLabel: string): boolean {
  if (candidate.tag !== "a") {
    return false;
  }

  const href = candidate.href ?? "";
  return (
    LEGAL_LABELS.has(lowerLabel) ||
    /terms|privacy|license|cookie|legal/i.test(href) ||
    (candidate.in_footer === true && /terms|privacy|license|cookie|legal/i.test(lowerLabel))
  );
}

function isDuplicateFormControl(candidate: CandidateElement, acceptedForms: Set<string>): boolean {
  if (!candidate.form_selector || candidate.tag === "form") {
    return false;
  }

  if (!acceptedForms.has(candidate.form_selector)) {
    return false;
  }

  return candidate.trigger_method === "submit" || candidate.tag === "select" || candidate.attributes.type === "submit";
}
