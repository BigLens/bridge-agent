# Operating Boundary

Agentlit is a read-only interaction clarity review system.

It may:
- render public pages with the identified Agentlit research-bot User-Agent
- extract visible candidate elements from the DOM
- describe what each visible element appears to let a user or agent do
- classify clarity and business impact
- produce normalized IAG data and customer-facing reports

It must not:
- click, submit, type into, or automate third-party sites
- read private pages
- use non-public credentials
- alter website state
- send synthetic form submissions

Use this wording in product, engineering, and agent work:
- read-only interaction clarity review
- visible action discovery
- candidate element analysis
- declaration-only audit
- business-impact report

Keep routine work framed around visible website interactions and customer-facing clarity.

The business goal is a durable data asset: normalized action intelligence at web scale. The storage goal is compact, queryable IAG data and run summaries, not unbounded folders of raw generated artifacts.
