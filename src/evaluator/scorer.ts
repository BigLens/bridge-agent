import type { ActionStatus, BusinessImpact, ReportAction } from "../iag/types.js";

export function classifyAction(clarityScore: number, businessImpact: BusinessImpact): ActionStatus {
  if (clarityScore >= 0.8) {
    return "clear";
  }
  if (clarityScore >= 0.6) {
    return "unclear";
  }
  return businessImpact === "high" ? "critical" : "unclear";
}

export function reportScore(actions: ReportAction[]): number {
  if (actions.length === 0) {
    return 0;
  }

  const clarityAverage =
    actions.reduce((sum, action) => sum + action.node.clarity_score, 0) / actions.length;
  const criticalPenalty = actions.filter((action) => action.node.status === "critical").length * 4;
  const unclearPenalty = actions.filter((action) => action.node.status === "unclear").length * 1.5;

  return Math.max(0, Math.min(100, Math.round(clarityAverage * 100 - criticalPenalty - unclearPenalty)));
}

export function meaningfulActionRatio(rawCandidateCount: number, interpretedActionCount: number): number {
  if (rawCandidateCount === 0) {
    return 0;
  }
  return interpretedActionCount / rawCandidateCount;
}
