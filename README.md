<div align="center">

```
██████╗ ██████╗ ██╗██████╗  ██████╗ ███████╗
██╔══██╗██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝
██████╔╝██████╔╝██║██║  ██║██║  ███╗█████╗
██╔══██╗██╔══██╗██║██║  ██║██║   ██║██╔══╝
██████╔╝██║  ██║██║██████╔╝╚██████╔╝███████╗
╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝ ╚══════╝
          A G E N T
```

**AI Interaction Audit → WebMCP Compliance Layer**

*See what AI agents can and cannot do on your website — and fix what's costing you revenue.*

<br/>

[![Phase](https://img.shields.io/badge/Phase-1%20%E2%80%94%20Proof-0EA5E9?style=for-the-badge&logo=target&logoColor=white)](./AGENTS.md)
[![Gate](https://img.shields.io/badge/Gate-In%20Progress-F59E0B?style=for-the-badge&logo=shield&logoColor=white)](./AGENTS.md#phase-1-gate--proof)
[![Stack](https://img.shields.io/badge/Stack-Playwright%20%7C%20Gemini%20%7C%20NestJS-0F3460?style=for-the-badge)](./docs/architecture.md)
[![License](https://img.shields.io/badge/License-Proprietary-1A1A2E?style=for-the-badge)](./LICENSE)

<br/>

---

</div>

## The Problem

Shopify stores and WordPress sites will become WebMCP-compliant with a single plugin update.

The businesses that cannot do that — the mid-size e-commerce store on custom Magento, the insurance broker on a legacy Java stack, the SaaS company whose frontend was hand-built five years ago — have two options: pay an agency thousands of dollars to implement WebMCP manually, or stay non-compliant while AI agents route traffic to competitors who aren't.

Bridge Agent is the third option.

---

## What Bridge Agent Is

At its simplest, Bridge Agent answers one question about any website:

> **What can an AI agent do here — and what is it failing to do?**

It analyses a site's DOM, identifies every meaningful action a user or agent could take, scores each one for clarity and business impact, and produces a plain-English report. No developer required. No codebase access needed.

That report is Phase 1. What it becomes over five phases is a full WebMCP compliance engine — the same structured action data that powers the audit becomes the WebMCP tool contract, registered natively in the browser, without any rebuild.

---

## The Five Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   PHASE 1 ──── PHASE 2 ──── PHASE 3 ──── PHASE 4 ──── PHASE 5             │
│                                                                             │
│   PROOF        SIGNAL       PRODUCT      SAAS         SWITCH               │
│   Weeks 1–3    Weeks 3–6    Weeks 6–12   Months 4–8   Months 8–18          │
│                                                                             │
│   Does the     Will anyone  Can it run   Can it       Can we activate       │
│   engine       pay for it?  without      scale and    WebMCP with no        │
│   work?                     us?          retain?      rebuild?              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**One engine. Five stages of value delivery. No rebuilds.**

The code written in Week 1 is extended — not replaced — in every subsequent phase. This is not a pivot strategy. It is a progressive activation strategy.

---

## The Core Engine

Every phase runs the same four-step pipeline:

```
  URL
   │
   ▼
┌──────────────────────────────┐
│  STEP 1 — EXTRACTOR          │
│  Playwright headless browser │
│  Allow-list DOM pruning      │
│  Candidate element output    │
└──────────────┬───────────────┘
               │  JSON element array
               ▼
┌──────────────────────────────┐
│  STEP 2 — INTERPRETER        │
│  LLM via abstraction layer   │
│  Intent + description        │
│  Clarity score               │
│  Business impact             │
└──────────────┬───────────────┘
               │  IAG nodes (raw)
               ▼
┌──────────────────────────────┐
│  STEP 3 — EVALUATOR          │
│  Scoring model               │
│  clear / unclear / critical  │
│  Business translation        │
└──────────────┬───────────────┘
               │  Classified IAG nodes
               ▼
┌──────────────────────────────┐
│  STEP 4 — OUTPUT LAYER       │
│                              │
│  Phase 1–4: Audit Report     │
│  Phase 5:   WebMCP Contract  │
└──────────────────────────────┘
```

---

## The Internal Action Graph (IAG)

The IAG is the system's memory. Every action identified on every site is stored as an IAG node. It is the data structure that makes the Phase 5 pivot instant — the audit data **is** the WebMCP tool contract data.

```typescript
interface IAGNode {
  action_id:       string;          // UUID v4. Permanent. Never changes.
  intent:          string;          // e.g. "Add to Cart"
  description:     string;          // Plain English. What agents read.
  clarity_score:   number;          // 0.0–1.0
  business_impact: 'low' | 'medium' | 'high';
  selector:        string;
  selector_chain:  string[];
  trigger_method:  'click' | 'type' | 'submit';
  status:          'clear' | 'unclear' | 'critical';
  staleness_hash?: string;          // Phase 3+
  avl_level?:      1 | 2 | 3;       // Phase 4+
  approved?:       boolean;         // Phase 5+
  created_at:      string;
  last_validated:  string;
}
```

The IAG is **append-only**. Nodes are never deleted. When an action becomes invalid, it is marked `inactive` with a reason and timestamp. The history of every action on every site is data.

---

## Confidence Scoring

```
clarity_score = (intent_clarity × 0.45)
              + (context_alignment × 0.30)
              + (selector_stability × 0.25)
```

| Score | Status | What Happens |
|-------|--------|-------------|
| ≥ 0.80 | ✅ clear | Confirmed action. Phase 5: auto-approve at AVL-1. |
| 0.60–0.79 | ⚠️ unclear | Flagged as issue. Phase 5: mandatory owner review. |
| < 0.60 | ❌ critical/discard | Flag if high business impact. Discard if low. |

---

## Audit Report Format

```markdown
# AI Interaction Audit — example.com
Generated: 2026-04-23  |  Actions analysed: 41  |  Score: 63/100

## ✅ Clear Actions (18)
Actions AI agents and users can understand and complete reliably.

- **Add to Cart**: Adds the currently selected product to the shopping cart.
- **Search Products**: Searches the product catalogue with the provided query.
  ...

## ⚠️ Unclear Actions (14)
Actions that exist but are ambiguous. Likely causing friction.

- **Continue**: Unclear purpose — could advance checkout, sign up, or confirm.
  Why unclear: No surrounding context. Same label used in 3 different flows.
  Business impact: Users abandoning at this step cannot tell where they're going.
  Fix: Label specifically — "Continue to Payment" or "Continue to Shipping".
  ...

## ❌ Critical Issues (9)
High-impact actions that are missing or broken. Revenue risk.

- **Checkout Trigger**: No clear, discoverable path from cart to payment.
  Why critical: AI agents and users cannot reliably initiate checkout.
  Business impact: Likely causing significant cart abandonment.
  Fix: Add a prominent, consistently labelled "Proceed to Checkout" button.
  ...

## 💸 Estimated Business Impact
The checkout flow and primary product filters are the most significant issues.
AI agents attempting to complete purchases on this site will likely fail or
abandon at the cart stage. Fixing the three Critical Issues should be
prioritised before any other optimisation work.
```

---

## What Bridge Agent Never Does

Bridge Agent stops at **declaration**. It describes what a site can do. It never does it.

```
❌  Simulates clicks
❌  Submits forms
❌  Automates user interactions
❌  Acts on behalf of agents on third-party sites
❌  Touches the site's source code or codebase
```

This boundary is architectural, legal, and permanent. In Phase 5, the WebMCP tool contract tells agents what to do. The browser and the site's own JavaScript handle execution. Bridge Agent's role ends at registration.

---

## Phase 5 — WebMCP Activation

When Phase 5 unlocks, the messaging changes. The engine does not.

```javascript
// The IAG node that powered the audit report...
const node = {
  action_id:    "a1b2c3d4",
  intent:       "Add to Cart",
  description:  "Adds the selected product to the shopping cart.",
  clarity_score: 0.94,
  avl_level:    2,
  approved:     true,
  ...
};

// ...becomes a live WebMCP tool contract.
navigator.modelContext.registerTool({
  name:        "add_to_cart",
  description: "Adds the selected product to the shopping cart.",
  inputSchema: { type: "object", properties: { product_id: { type: "string" } } },
  execute: async (args) => ({
    selector: node.selector,
    trigger:  node.trigger_method,
    args,
    avl:      node.avl_level,
  })
});
```

No re-analysis. No new data collection. The IAG **is** the tool contract.

---

## Installation (Phase 5 — No-Code Onboarding)

Bridge Agent detects the best installation path automatically when you enter your URL.

### Path A — Cloudflare Workers
For sites behind Cloudflare's proxy. A Worker injects the Sentry script at the edge. The server is never touched.

**Owner effort:** ~5 minutes in the Cloudflare dashboard. No developer needed.

### Path B — Google Tag Manager
For sites with GTM installed. Download the Bridge Agent GTM Container JSON and import it in three clicks.

**Owner effort:** ~3 clicks in GTM. No developer needed.

### Path C — Script Handoff
For all other sites. Copy a pre-written message and send it to whoever manages the site.

```html
<script
  src="https://cdn.bridge-agent.io/sentry.js"
  data-site-key="YOUR_SITE_KEY"
  integrity="sha384-HASH"
  crossorigin="anonymous"
  async
></script>
```

**Owner effort:** Forward one message. No developer project needed.

---

## Repository Structure

```
bridge-agent/
│
├── AGENTS.md               ← Agent instructions (read this first)
├── CLAUDE.md               ← Claude-specific instructions
├── README.md               ← This file
│
├── src/
│   ├── extractor/          ← Playwright DOM extraction
│   │   ├── index.ts
│   │   ├── allowlist.ts
│   │   └── pruner.ts
│   │
│   ├── interpreter/        ← LLM abstraction + prompt
│   │   ├── index.ts
│   │   ├── prompt.ts       ← Most important file in the codebase
│   │   └── provider.ts     ← LLM abstraction layer
│   │
│   ├── evaluator/          ← Scoring model + classification
│   │   ├── index.ts
│   │   ├── scorer.ts
│   │   └── translator.ts   ← Business impact translation
│   │
│   ├── output/             ← Output layer (phase-aware)
│   │   ├── report.ts       ← Phase 1–4: markdown report
│   │   └── renderer.ts     ← Phase 5: WebMCP registration
│   │
│   ├── iag/                ← Internal Action Graph
│   │   ├── types.ts        ← IAGNode interface
│   │   ├── store.ts        ← Storage (JSON Phase 1–2, PostgreSQL Phase 3+)
│   │   └── hasher.ts       ← Staleness detection (Phase 3+)
│   │
│   └── api/                ← NestJS API (Phase 3+)
│       ├── sites/
│       ├── graph/
│       └── health/
│
├── scripts/
│   └── poc.ts              ← Phase 1 standalone script (URL → report)
│
├── tests/
│   ├── phase1/             ← Phase gate validation tests
│   ├── interpreter/        ← Prompt quality tests
│   └── extractor/          ← Allow-list accuracy tests
│
└── docs/
    ├── architecture.md
    ├── iag-schema.md
    ├── interpreter-prompt-history.md  ← Every prompt version + results
    └── phase-gates.md
```

---

## Getting Started (Phase 1)

Phase 1 is a single script. No server. No database. No UI.

### Prerequisites

```bash
node >= 18
npm >= 9
A Gemini API key (or equivalent LLM provider key)
```

### Install

```bash
git clone https://github.com/your-org/bridge-agent.git
cd bridge-agent
npm install
```

### Configure

```bash
cp .env.example .env
# Add your LLM API key to .env
```

### Run an Audit

```bash
npm run poc -- --url https://example.com
```

This outputs a markdown report to `./output/[domain]-[timestamp].md`.

### Run the Phase 1 Gate Check

```bash
npm run gate:phase1
```

This runs the extractor on 5 pre-configured test sites and reports whether all four Phase 1 gate items pass. Do not proceed to Phase 2 until this command reports all items as passing.

---

## Phase Gate Status

| Phase | Name | Status | Gate |
|-------|------|--------|------|
| 1 | Proof | 🟡 In Progress | [View gate](./AGENTS.md#phase-1-gate--proof) |
| 2 | Signal | ⬜ Blocked | [View gate](./AGENTS.md#phase-2-gate--signal) |
| 3 | Product | ⬜ Blocked | [View gate](./AGENTS.md#phase-3-gate--product) |
| 4 | SaaS | ⬜ Blocked | [View gate](./AGENTS.md#phase-4-gate--saas) |
| 5 | Switch | ⬜ Blocked | [View gate](./AGENTS.md#phase-5-gate--switch-webmcp-activation) |

> **Update this table when gate items pass. A phase is complete only when all its gate items are confirmed.**

---

## Open Questions

These are the unresolved decisions that block specific phases. They are in priority order.

| # | Question | Blocks |
|---|----------|--------|
| 1 | What is the real confidence distribution on 20 real target sites? | Phase 2 |
| 2 | Which Interpreter prompt version produces the best business-impact descriptions? | Phase 2 outreach quality |
| 3 | Which outreach message framing produces the highest reply rate? | Phase 2 revenue |
| 4 | Pricing model: per report, per site/month, or per agent invocation? | Phase 3 architecture |
| 5 | Signed channel architecture between Sentry and Brain: HMAC, JWT, or rotating token? | Phase 5 security |
| 6 | Who tracks W3C WebMCP Community Group draft changes weekly? | Phase 5 Renderer stability |

---

## Key Constraints

```
✅  Declaration only — always
✅  IAG append-only — always
✅  LLM calls through abstraction layer — always
✅  Phase gates sequential — always
✅  User-Agent identifies as research bot — always
✅  No dollar figures in report output — always

❌  Execution on third-party sites — never
❌  Skipping phase gates — never
❌  Direct LLM provider calls in business logic — never
❌  Deleting IAG nodes — never
❌  Dollar figures in business impact output — never
```

---

## Contributing

This is a private repository. Before contributing:

1. Read `AGENTS.md` fully
2. Check the current phase and gate status
3. Only work on tasks that belong to the current phase
4. Test all changes against the phase gate criteria before opening a PR

---

## The Three Things This Product Lives or Dies On

**1. Synthesis quality on real sites.**
If the Interpreter cannot produce descriptions that a business owner reads and immediately understands, no amount of architecture saves it. Phase 1 answers this. Run it on real sites before anything else.

**2. Messaging that lands.**
The outreach message is the product's first impression. It must mention a specific finding, anchor to drop-offs and revenue, and create curiosity without being pushy. Iterate until it reliably produces replies.

**3. Declaration only. Forever.**
Bridge Agent stops at declaration in every phase. This is the legal foundation, the security posture, and the architectural moat. It does not move.

---

<div align="center">

**Bridge Agent** — *Execute like you need money today. Build like you're going to own the market tomorrow.*

V5.0 — April 2026 — Proprietary

</div>