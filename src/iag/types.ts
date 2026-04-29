export type BusinessImpact = "low" | "medium" | "high";
export type TriggerMethod = "click" | "type" | "submit";
export type ActionStatus = "clear" | "unclear" | "critical";

export interface IAGNode {
  action_id: string;
  intent: string;
  description: string;
  clarity_score: number;
  business_impact: BusinessImpact;
  selector: string;
  selector_chain: string[];
  trigger_method: TriggerMethod;
  status: ActionStatus;
  created_at: string;
  last_validated: string;
}

export interface ReportAction {
  node: IAGNode;
  reason: string;
  impact_reason: string;
  fix_suggestion: string;
}

export interface UnresolvedElement {
  selector: string;
  label: string;
  reason: string;
}
