# Agentlit Architecture

Agentlit Phase 1 is a standalone TypeScript pipeline:

1. Extractor: Playwright renders a URL with the Agentlit research-bot User-Agent and returns allow-listed candidate elements.
2. Interpreter: each candidate is analysed through an LLM provider abstraction.
3. Evaluator: clarity score and business impact classify each action as clear, unclear, or critical.
4. Output layer: evaluated actions are rendered into a markdown audit report and fixed-schema IAG JSON.

Phase 1 intentionally has no server, database, queue, billing, or UI.

## Operating Boundary

Agentlit is read-only. It renders public pages, extracts visible candidate elements, and describes interaction clarity. It does not click, submit, type into, or automate third-party sites.

Use neutral product language when discussing work:

- read-only interaction clarity review
- DOM extraction
- candidate element analysis
- business-impact reporting
- IAG normalization

Keep routine product work framed around visible website interactions and customer-facing clarity.

## Data Strategy

The long-term moat is normalized action intelligence, not raw output files.

Persist:
- site identity and crawl/run metadata
- normalized IAG nodes
- prompt and extractor versions
- quality metrics, costs, and unresolved provider reasons
- selected customer-facing reports or gate evidence

Do not persist by default:
- every generated markdown report
- every raw candidate dump
- raw HTML snapshots
- screenshots
- repeated failed-run artifacts

Phase 1 keeps generated files under `output/` as disposable local artifacts. Later production phases should store compact run summaries and IAG records in the database, with raw evidence retained only by explicit retention policy.
