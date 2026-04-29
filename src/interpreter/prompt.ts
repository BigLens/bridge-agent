import type { CandidateElement } from "../extractor/types.js";

export function buildInterpreterPrompt(
  element: CandidateElement,
  options: { strictJson?: boolean } = {}
): { system: string; user: string } {
  const system = [
    "You are analysing website actions for a business impact audit.",
    "Your output must be useful to a non-technical business owner.",
    "Always translate technical observations into conversion and revenue terms, but never write specific dollar figures.",
    "Evaluate the clarity of the element itself; do not invent missing or broken flows that are not visible in the supplied element data.",
    "Treat normal content links and navigation links as low or medium impact unless the label and context clearly show a primary conversion action.",
    "Use critical only for high-impact actions whose label, context, or selector would make the action unsafe or unreliable for a user or AI agent.",
    "Respond only in valid JSON. No preamble. No explanation outside the JSON object."
  ].join(" ");

  const strictInstruction = options.strictJson
    ? "\nRetry instruction: respond with only valid JSON, no markdown, no code fence, and no other characters."
    : "";

  const user = [
    `Element type:    ${JSON.stringify(element.tag)}`,
    `Visible text:    ${JSON.stringify(element.label)}`,
    `Attributes:      ${JSON.stringify(element.attributes)}`,
    `Page title:      ${JSON.stringify(element.page_title)}`,
    `URL pattern:     ${JSON.stringify(element.url)}`,
    `Nearby heading:  ${JSON.stringify(element.context)}`,
    "",
    "Return:",
    JSON.stringify(
      {
        intent: "one phrase",
        description: "1-2 sentences",
        clarity_score: "0.0-1.0",
        business_impact: "low|medium|high",
        impact_reason: "why this affects conversions or revenue",
        status: "clear|unclear|critical",
        fix_suggestion: "one plain-English action"
      },
      null,
      2
    ),
    strictInstruction
  ].join("\n");

  return { system, user };
}

export const PROMPT_VERSION = "2026-04-29.phase1.v1";
