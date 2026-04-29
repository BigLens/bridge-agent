export const PRIMARY_SELECTORS = [
  "button",
  'input[type="submit"]',
  'input[type="button"]',
  "a[href]",
  "form",
  "select",
  'input[type="checkbox"]',
  'input[type="radio"]'
] as const;

export const SECONDARY_SELECTORS = [
  '[role="button"]',
  '[role="link"]',
  "[aria-label]",
  "[data-action]",
  "[data-testid]"
] as const;

export const EXCLUDE_SELECTORS = [
  "script",
  "style",
  "meta",
  "link",
  "noscript",
  "iframe",
  "svg *"
] as const;

export function isPrimarySelector(selector: string): boolean {
  return PRIMARY_SELECTORS.includes(selector as (typeof PRIMARY_SELECTORS)[number]);
}

export function candidateSelector(): string {
  return [...PRIMARY_SELECTORS, ...SECONDARY_SELECTORS].join(",");
}
