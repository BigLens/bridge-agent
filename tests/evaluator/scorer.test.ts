import assert from "node:assert/strict";
import test from "node:test";
import { classifyAction, meaningfulActionRatio, reportScore } from "../../src/evaluator/scorer.js";
import type { ReportAction } from "../../src/iag/types.js";

test("classifyAction follows Phase 1 score thresholds", () => {
  assert.equal(classifyAction(0.8, "low"), "clear");
  assert.equal(classifyAction(0.79, "medium"), "unclear");
  assert.equal(classifyAction(0.4, "high"), "critical");
  assert.equal(classifyAction(0.4, "low"), "unclear");
});

test("meaningfulActionRatio protects against division by zero", () => {
  assert.equal(meaningfulActionRatio(0, 10), 0);
  assert.equal(meaningfulActionRatio(10, 5), 0.5);
});

test("reportScore returns a bounded score", () => {
  const actions = [action(0.9, "clear"), action(0.5, "critical")];
  const score = reportScore(actions);

  assert.equal(score >= 0, true);
  assert.equal(score <= 100, true);
});

function action(clarityScore: number, status: "clear" | "unclear" | "critical"): ReportAction {
  return {
    node: {
      action_id: "id",
      intent: "Action",
      description: "Description",
      clarity_score: clarityScore,
      business_impact: status === "critical" ? "high" : "medium",
      selector: "#action",
      selector_chain: ["#action"],
      trigger_method: "click",
      status,
      created_at: new Date().toISOString(),
      last_validated: new Date().toISOString()
    },
    reason: "",
    impact_reason: "Impact",
    fix_suggestion: "Fix"
  };
}
