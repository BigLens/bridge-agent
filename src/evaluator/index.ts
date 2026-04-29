import type { ReportAction } from "../iag/types.js";
import { classifyAction, reportScore } from "./scorer.js";

export interface EvaluationResult {
  actions: ReportAction[];
  score: number;
}

export function evaluateActions(actions: ReportAction[]): EvaluationResult {
  const evaluated = actions.map((action) => {
    const status = classifyAction(action.node.clarity_score, action.node.business_impact);
    return {
      ...action,
      node: {
        ...action.node,
        status
      }
    };
  });

  return {
    actions: sortActions(evaluated),
    score: reportScore(evaluated)
  };
}

function sortActions(actions: ReportAction[]): ReportAction[] {
  const order = { critical: 0, unclear: 1, clear: 2 };
  return [...actions].sort((left, right) => {
    const statusDelta = order[left.node.status] - order[right.node.status];
    if (statusDelta !== 0) {
      return statusDelta;
    }
    return right.node.clarity_score - left.node.clarity_score;
  });
}
