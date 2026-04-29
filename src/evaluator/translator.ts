import type { ReportAction } from "../iag/types.js";

export function reasonForStatus(action: ReportAction): string {
  if (action.node.status === "clear") {
    return "The label, page context, and selector are clear enough to describe the action reliably.";
  }
  if (action.node.status === "critical") {
    return action.reason || "A high-impact action is not clear enough for an agent or user to trust.";
  }
  return action.reason || "The action exists, but the label or surrounding context does not make the outcome obvious.";
}

export function businessImpactSummary(actions: ReportAction[], unresolvedCount: number): string {
  const critical = actions.filter((action) => action.node.status === "critical");
  const unclear = actions.filter((action) => action.node.status === "unclear");
  const highImpact = actions.filter((action) => action.node.business_impact === "high");

  if (actions.length === 0) {
    return unresolvedCount > 0
      ? "No actions could be analysed reliably in this run. The site needs another pass before conversion risks can be assessed."
      : "No meaningful actions were found on this page. If this is a commercial page, the lack of clear actions may create avoidable drop-offs.";
  }

  if (critical.length > 0) {
    return `The highest-risk issues are concentrated around ${describeTopIntents(critical)}. These unclear high-impact actions can create drop-offs at the exact points where visitors are trying to convert.`;
  }

  if (unclear.length > 0) {
    return `The site has useful actions, but ${unclear.length} need clearer labels or nearby context. Tightening these actions should make important paths easier for both users and AI agents to understand.`;
  }

  if (highImpact.length > 0) {
    return "The main conversion actions are clear and discoverable. The next priority is checking whether this clarity holds across deeper product, checkout, or lead-capture pages.";
  }

  return "The visible actions are mostly clear, but this page does not expose many high-impact conversion paths. Review deeper funnel pages before treating the site as agent-ready.";
}

function describeTopIntents(actions: ReportAction[]): string {
  return actions
    .slice(0, 3)
    .map((action) => action.node.intent)
    .join(", ");
}
