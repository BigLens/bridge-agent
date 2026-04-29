# Interpreter Prompt History

## 2026-04-29.phase1.v1

Initial Agentlit Phase 1 prompt.

Purpose:
- Keep system and user boundaries separate.
- Pass page content as escaped string literals.
- Require valid JSON only.
- Ask for business-owner language without specific dollar figures.

Quality result:
- Pending validation against 5 real sites before any gate item can be marked complete.

## 2026-04-29.phase1.v2

Tuned after the first Shopify real-site sample.

Change:
- Clarified that the model must judge the supplied element itself.
- Prevented over-escalating ordinary content/navigation links into critical conversion failures.
- Reserved critical status for high-impact actions that are genuinely unsafe or unreliable from the supplied element data.

Quality result:
- Pending rerun on Shopify and the 5-site Phase 1 sample.
