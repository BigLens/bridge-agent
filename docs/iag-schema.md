# IAG Schema

Phase 1 IAG nodes use only the fixed core fields:

```ts
interface IAGNode {
  action_id: string;
  intent: string;
  description: string;
  clarity_score: number;
  business_impact: "low" | "medium" | "high";
  selector: string;
  selector_chain: string[];
  trigger_method: "click" | "type" | "submit";
  status: "clear" | "unclear" | "critical";
  created_at: string;
  last_validated: string;
}
```

Phase 3+ fields are not implemented in Phase 1.
