# Data Retention

Agentlit's durable value is normalized action intelligence.

## Phase 1

`output/` is disposable local working data. It is ignored by git and can be deleted between tuning runs.

Keep only selected Phase 1 evidence:
- final reports used for gate review
- matching IAG JSON
- run summary metrics
- prompt and extractor versions
- notes on why the output passed or failed

## Production Direction

Store compact records:
- site record: domain, canonical URL, first seen, last reviewed
- run record: timestamp, phase, prompt version, extractor version, cost, provider status
- IAG node: normalized action data
- unresolved summary: reason counts and representative examples
- report snapshot: only when customer-facing or selected as evidence

Avoid storing by default:
- raw HTML for every page
- screenshots for every page
- every generated markdown report
- repeated candidate dumps
- repeated provider failure payloads

Use object storage with explicit retention windows for heavy evidence when needed. The database should hold queryable summaries and normalized action records.
