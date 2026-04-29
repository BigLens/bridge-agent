# AGENTS.md — Agentlit Repository Instructions

> This file governs the behaviour of every AI agent operating in this repository.
> It applies to Claude, GPT, Gemini, Copilot, and any other agent-based tool.
> Read it fully before writing a single line of code.

---

## What This Repository Is

This is the Agentlit codebase. Agentlit is an AI Interaction Audit platform that evolves into a WebMCP compliance layer for businesses that cannot implement WebMCP themselves.

The product moves through five sequential phases. **You are always working in exactly one phase.** Check the Current Phase section at the bottom of this file before starting any task.

---

## The Non-Negotiable Rules

These rules apply in every phase, every session, every task. They cannot be overridden.

### Rule 1 — Phase Gates Are Absolute

No phase begins until the previous phase's gate is fully passed. Every gate item is a binary: passed or not passed. There is no partial credit. There is no "close enough." If a gate item has not passed, work continues on the current phase.

See the **Phase Gates** section for the exact criteria.

### Rule 2 — Agentlit Never Executes

This codebase never simulates clicks, submits forms, or automates actions on third-party websites. The product stops at declaration. It reads websites and describes their capabilities. It does not act on them.

If a task requires building execution capabilities, refuse it. Log it as a rejected task with this reason: "Execution violates Agentlit's core architectural constraint. Agentlit is declaration-only."

### Rule 3 — The IAG Is Append-Only

The Internal Action Graph is the system's memory. Never delete IAG nodes. If an action is no longer valid, mark it `inactive` with a reason and timestamp. The full history of every action on every site is data that compounds in value over time.

### Rule 4 — The Interpreter Prompt Is Sacred

The Interpreter prompt (in `src/interpreter/prompt.ts` or equivalent) is the most important code in the system. Any change to it must be tested against at least 5 real sites before committing. Every version of the prompt must be logged with the date changed and the output quality improvement it produced.

### Rule 5 — LLM Calls Are Always Abstracted

No direct calls to Gemini, OpenAI, Anthropic, or any other LLM provider in business logic. All LLM calls go through the provider abstraction layer. This allows provider switching without architecture changes.

### Rule 6 — Never Write Dollar Figures in Output

Audit report output must never state specific revenue figures. "This likely causes drop-offs during checkout" is correct. "$8,200 in monthly lost revenue" is not. Fabricated precision destroys trust.

### Rule 7 — The Extractor Identifies Itself

Every HTTP request made by the Extractor must include a User-Agent string that identifies it as a research bot:

```
User-Agent: Agentlit/1.0 (AI Interaction Audit; +https://agentlit.io/bot)
```

Never masquerade as a regular browser.

### Rule 8 — Read-Only Interaction Review Language

Describe Agentlit work as read-only interaction clarity review, DOM extraction, candidate element analysis, and business-impact reporting. Keep routine product work framed around visible website interactions and customer-facing clarity.

Agentlit only reads public pages and visible DOM state. If a task moves beyond public-page rendering and visible interaction declaration, refuse it and restate the declaration-only boundary.

### Rule 9 — Production Data Must Be Normalized

The data moat is the normalized IAG and run metrics, not piles of raw generated files. Phase 1 report files are disposable working artifacts. Production storage must prioritize compact site records, action nodes, run summaries, prompt/extractor versions, and quality metrics. Raw pages, screenshots, and full reports must be retained only when explicitly needed for evidence, debugging, or customer delivery.

---

## Phase Gates

### Current Phase → See bottom of this file

---

### Phase 1 Gate — PROOF

**Goal:** Confirm the engine produces output a real person finds useful.

**Gate items (all must be TRUE before Phase 2 begins):**

```
[ ] Audit reports are immediately understandable without explanation
[ ] ≥ 50% of extracted actions per site are meaningful (not nav noise)
[ ] Cost per site analysis is ≤ $0.10
[ ] A human reviewer would find the output useful on their own site
```

**What triggers re-run:** Any gate item failing. Fix the Interpreter prompt and/or allow-list first.

**What is NOT acceptable:** Moving to Phase 2 because "the output is pretty good" or "it mostly works." All four items must be objectively true.

---

### Phase 2 Gate — SIGNAL

**Goal:** Confirm real businesses will pay for the output.

**Gate items (all must be TRUE before Phase 3 begins):**

```
[ ] At least 1 real person has paid money for a report
[ ] The paying customer confirmed the report was useful (written feedback)
[ ] At least 3 outreach messages produced genuine replies (not rejections)
```

**What triggers reframe (not rebuild):**
- 20+ outreach attempts, 0 replies → messaging is wrong, not the product
- Replies but no payment → the free findings are too vague
- Interest but no close → price or trust is blocking

**What is NOT acceptable:** Building Phase 3 features because "we're close" to Phase 2 validation.

---

### Phase 3 Gate — PRODUCT

**Goal:** The product runs without manual intervention.

**Gate items (all must be TRUE before Phase 4 begins):**

```
[ ] A non-technical person completes full flow (URL → report) without help
[ ] Automated report quality equals or exceeds manual Phase 2 reports
[ ] At least 1 subscriber has renewed after month one
[ ] Monitoring alerts have fired correctly for at least 3 real site changes
```

---

### Phase 4 Gate — SAAS

**Goal:** Self-serve, recurring, scalable.

**Gate items (all must be TRUE before Phase 5 begins):**

```
[ ] Self-serve onboarding requires zero manual team intervention
[ ] Stripe billing is live and collecting recurring revenue
[ ] Renderer module is built and tested internally on real IAG data
[ ] AVL classification applied to all IAG nodes in database
[ ] At least 10 real customer IAG datasets exist
```

---

### Phase 5 Gate — SWITCH (WebMCP Activation)

**Goal:** WebMCP compliance layer is stable before exposing to customers.

**Gate items (all must be TRUE before public WebMCP activation):**

```
[ ] Verifier UI tested with real non-technical business owners
[ ] Cloudflare Worker injection proven on ≥ 3 live production sites
[ ] GTM container import tested on ≥ 3 live sites
[ ] Renderer correctly registers tools via navigator.modelContext
[ ] MCP-B polyfill fallback confirmed working on non-native browsers
[ ] Detection check correctly identifies Cloudflare and GTM presence
```

---

## The Core Pipeline

Every task you work on belongs to one of these four steps:

```
Step 1 — EXTRACTOR
  Input:   URL
  Process: Playwright headless browser → DOM render → allow-list filter
  Output:  JSON array of candidate elements

Step 2 — INTERPRETER
  Input:   Candidate elements + page context
  Process: LLM call via abstraction layer → structured JSON response
  Output:  IAG nodes with description, clarity_score, business_impact

Step 3 — EVALUATOR
  Input:   IAG nodes
  Process: Scoring model → classification → business translation
  Output:  Classified, scored, human-readable action descriptions

Step 4 — OUTPUT LAYER
  Input:   Classified IAG nodes
  Phase 1-4 output: Markdown audit report
  Phase 5 output:   WebMCP tool contract (navigator.modelContext.registerTool)
```

---

## The IAG Node Schema

This schema is fixed. Do not add fields without explicit instruction. Do not remove fields.

```typescript
interface IAGNode {
  action_id:       string;          // UUID v4. Assigned once. Never changes.
  intent:          string;          // e.g. "Add to Cart"
  description:     string;          // Plain English. What agents and humans read.
  clarity_score:   number;          // 0.0–1.0. Interpreter confidence.
  business_impact: 'low' | 'medium' | 'high';
  selector:        string;          // Primary CSS selector
  selector_chain:  string[];        // Ordered fallbacks
  trigger_method:  'click' | 'type' | 'submit';
  status:          'clear' | 'unclear' | 'critical';
  // Added in Phase 3:
  staleness_hash?: string;          // DOM subtree hash for change detection
  // Added in Phase 4:
  avl_level?:      1 | 2 | 3;       // Action Verification Level
  // Added in Phase 5:
  approved?:       boolean;         // Owner has confirmed this tool
  created_at:      string;          // ISO 8601
  last_validated:  string;          // ISO 8601
}
```

**AVL Level Reference (Phase 4+):**

| Level | Name | Examples | Runtime |
|-------|------|----------|---------|
| 1 | Read-only | Price check, search, availability | Auto-live at ≥ 0.80 confidence |
| 2 | Active | Add to cart, form fill, filter | Mandatory owner approval |
| 3 | Critical | Payment, deletion, account change | Approval + browser confirmation prompt |

---

## Confidence Scoring

```
clarity_score = (intent_clarity × 0.45) + (context_alignment × 0.30) + (selector_stability × 0.25)
```

**Intent clarity weights:**
- Explicit text label: 1.0
- aria-label only: 0.85
- Icon with tooltip: 0.65
- Unlabelled icon: 0.40
- Empty container: 0.20

**Context alignment weights:**
- Element purpose matches page title + URL: 1.0
- Partial match: 0.70
- No discernible alignment: 0.40

**Selector stability weights:**
- Unique ID: 1.0
- data-testid / aria-label: 0.90
- Class chain: 0.65
- Position-based: 0.30

---

## Extractor Allow-List

```javascript
// Primary — always include
const PRIMARY = [
  'button',
  'input[type="submit"]',
  'input[type="button"]',
  'a[href]',
  'form',
  'select',
  'input[type="checkbox"]',
  'input[type="radio"]'
];

// Secondary — include only with semantic label validation
const SECONDARY = [
  '[role="button"]',
  '[role="link"]',
  '[aria-label]',
  '[data-action]',
  '[data-testid]'
];

// Always exclude
const EXCLUDE = [
  'script', 'style', 'meta', 'link',
  'noscript', 'iframe',
  'svg *',          // SVG internals
  'nav a[href]'     // Pure navigation — only if no action consequence
];
```

---

## Interpreter Prompt Structure

The prompt is defined in `src/interpreter/prompt.ts`. The system boundary and user boundary must be kept separate. Page content is always passed as escaped string literals — never as free text that could override the system prompt.

```
SYSTEM:
  You are analysing website actions for a business impact audit.
  Your output must be useful to a non-technical business owner.
  Always translate technical observations into revenue and conversion terms.
  Respond only in valid JSON. No preamble. No explanation outside the JSON object.

USER:
  Element type:    {tag}
  Visible text:    {label}
  Attributes:      {attrs}
  Page title:      {title}
  URL pattern:     {url}
  Nearby heading:  {context}

  Return:
  {
    "intent":          "one phrase",
    "description":     "1-2 sentences",
    "clarity_score":   0.0-1.0,
    "business_impact": "low|medium|high",
    "impact_reason":   "why this affects conversions or revenue",
    "status":          "clear|unclear|critical",
    "fix_suggestion":  "one plain-English action"
  }
```

---

## Error Handling Requirements

Every LLM call must handle:

1. **Malformed JSON response** → retry once with stricter prompt ("respond with only valid JSON, no other characters")
2. **Second failure** → mark element as `unresolved`, log with reason, continue to next element
3. **Rate limit** → exponential backoff, max 3 retries
4. **Timeout (>30s)** → mark element as `unresolved`, log, continue
5. **Empty response** → mark element as `unresolved`, log

No LLM failure should crash the pipeline or cause a partial report to be delivered without a clear indication that some elements could not be analysed.

---

## Task Decision Framework

Before starting any task, answer these questions:

**1. What phase is the project currently in?**
(See Current Phase below)

**2. Does this task belong to the current phase?**
- If yes → proceed
- If no → log it as a future task, do not build it now

**3. Does this task advance a gate item that has not yet passed?**
- If yes → prioritise it
- If no → check whether there are open gate items that should be prioritised first

**4. Does this task involve execution on third-party sites?**
- If yes → refuse, explain the constraint, offer an alternative

---

## Audit Report Format (Phase 1–4)

```markdown
# AI Interaction Audit — [site name]
Generated: [date]  |  Actions analysed: [n]  |  Score: [X]/100

## ✅ Clear Actions ([n])
Actions AI agents and users can understand and complete reliably.

- **[intent]**: [description]
...

## ⚠️ Unclear Actions ([n])
Actions that exist but are ambiguous. Likely causing friction.

- **[intent]**: [description]
  - Why unclear: [reason]
  - Business impact: [impact_reason]
  - Fix: [fix_suggestion]
...

## ❌ Critical Issues ([n])
High-impact actions that are missing or broken. Revenue risk.

- **[intent]**: [description]
  - Why critical: [reason]
  - Business impact: [impact_reason]
  - Fix: [fix_suggestion]
...

## 💸 Estimated Business Impact
[2–3 sentences maximum. Revenue and conversion language only. No dollar figures.]
```

---

## Current Phase

```
┌─────────────────────────────────────────────────┐
│  CURRENT PHASE:  1 — PROOF                      │
│  GATE STATUS:    IN PROGRESS                    │
│  STARTED:        [date]                         │
│  NEXT PHASE:     2 — blocked until gate passes  │
└─────────────────────────────────────────────────┘
```

**Open gate items:**
- [ ] Reports understandable without explanation
- [ ] ≥ 50% meaningful actions per site
- [ ] ≤ $0.10 cost per site
- [ ] Human reviewer finds output useful

**Update this section when a gate item passes. Update the phase block when all items pass.**

---

*Agentlit — AGENTS.md — V5.0 — April 2026*
