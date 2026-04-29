import { randomUUID } from "node:crypto";
import { DEFAULT_LLM_TIMEOUT_MS } from "../config.js";
import type { CandidateElement } from "../extractor/types.js";
import type { ActionStatus, BusinessImpact, IAGNode, ReportAction, UnresolvedElement } from "../iag/types.js";
import { buildInterpreterPrompt } from "./prompt.js";
import { LlmTimeoutError, RateLimitError, RetryableProviderError, type LlmProvider } from "./provider.js";

export interface InterpretationRun {
  actions: ReportAction[];
  unresolved: UnresolvedElement[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function interpretCandidates(
  candidates: CandidateElement[],
  provider: LlmProvider
): Promise<InterpretationRun> {
  const actions: ReportAction[] = [];
  const unresolved: UnresolvedElement[] = [];
  const usage = { inputTokens: 0, outputTokens: 0 };

  for (const candidate of candidates) {
    const result = await interpretCandidate(candidate, provider);
    usage.inputTokens += result.inputTokens;
    usage.outputTokens += result.outputTokens;

    if (result.action) {
      actions.push(result.action);
    } else {
      unresolved.push({
        selector: candidate.selector,
        label: candidate.label,
        reason: result.reason
      });
    }
  }

  return { actions, unresolved, usage };
}

async function interpretCandidate(
  candidate: CandidateElement,
  provider: LlmProvider
): Promise<{ action?: ReportAction; reason: string; inputTokens: number; outputTokens: number }> {
  let malformedAttempts = 0;
  let rateLimitRetries = 0;
  let providerRetries = 0;
  let strictJson = false;
  let inputTokens = 0;
  let outputTokens = 0;

  while (true) {
    const prompt = buildInterpreterPrompt(candidate, { strictJson });

    try {
      const response = await provider.complete({
        ...prompt,
        timeoutMs: DEFAULT_LLM_TIMEOUT_MS
      });
      inputTokens += response.inputTokens ?? estimateTokens(prompt.system) + estimateTokens(prompt.user);
      outputTokens += response.outputTokens ?? estimateTokens(response.text);

      if (!response.text.trim()) {
        return { reason: "empty_response", inputTokens, outputTokens };
      }

      const parsed = parseInterpretation(response.text);
      if (!parsed) {
        malformedAttempts += 1;
        if (malformedAttempts > 1) {
          return { reason: "malformed_json", inputTokens, outputTokens };
        }
        strictJson = true;
        continue;
      }

      return {
        action: toReportAction(candidate, parsed),
        reason: "ok",
        inputTokens,
        outputTokens
      };
    } catch (error) {
      if (error instanceof RateLimitError) {
        if (rateLimitRetries >= 3) {
          return { reason: `rate_limit:${error.message}`, inputTokens, outputTokens };
        }
        await sleep(500 * 2 ** rateLimitRetries);
        rateLimitRetries += 1;
        continue;
      }

      if (error instanceof RetryableProviderError) {
        if (providerRetries >= 3) {
          return { reason: `provider_unavailable:${error.message}`, inputTokens, outputTokens };
        }
        await sleep(750 * 2 ** providerRetries);
        providerRetries += 1;
        continue;
      }

      if (error instanceof LlmTimeoutError) {
        return { reason: "timeout", inputTokens, outputTokens };
      }

      return { reason: `provider_error:${(error as Error).message}`, inputTokens, outputTokens };
    }
  }
}

function parseInterpretation(text: string): InterpreterJson | null {
  try {
    const parsed = JSON.parse(extractJsonObject(text)) as Partial<InterpreterJson>;
    const clarityScore = coerceNumber(parsed.clarity_score);
    const businessImpact = coerceBusinessImpact(parsed.business_impact);
    const status = coerceActionStatus(parsed.status);

    if (
      typeof parsed.intent !== "string" ||
      typeof parsed.description !== "string" ||
      clarityScore === null ||
      businessImpact === null ||
      typeof parsed.impact_reason !== "string" ||
      status === null ||
      typeof parsed.fix_suggestion !== "string"
    ) {
      return null;
    }
    return {
      intent: parsed.intent,
      description: parsed.description,
      clarity_score: clamp(clarityScore, 0, 1),
      business_impact: businessImpact,
      impact_reason: parsed.impact_reason,
      status,
      fix_suggestion: parsed.fix_suggestion
    };
  } catch {
    return null;
  }
}

function toReportAction(candidate: CandidateElement, parsed: InterpreterJson): ReportAction {
  const now = new Date().toISOString();
  const node: IAGNode = {
    action_id: randomUUID(),
    intent: parsed.intent.trim(),
    description: sanitizeNoDollarFigures(parsed.description.trim()),
    clarity_score: parsed.clarity_score,
    business_impact: parsed.business_impact,
    selector: candidate.selector,
    selector_chain: candidate.selector_chain,
    trigger_method: candidate.trigger_method,
    status: parsed.status,
    created_at: now,
    last_validated: now
  };

  return {
    node,
    reason: "",
    impact_reason: sanitizeNoDollarFigures(parsed.impact_reason.trim()),
    fix_suggestion: sanitizeNoDollarFigures(parsed.fix_suggestion.trim())
  };
}

function stripCodeFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function extractJsonObject(text: string): string {
  const stripped = stripCodeFence(text);
  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return stripped;
  }

  return stripped.slice(firstBrace, lastBrace + 1);
}

export function sanitizeNoDollarFigures(text: string): string {
  return text.replace(/\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:k|m|bn|million|billion))?/gi, "specific revenue impact");
}

function isBusinessImpact(value: unknown): value is BusinessImpact {
  return value === "low" || value === "medium" || value === "high";
}

function isActionStatus(value: unknown): value is ActionStatus {
  return value === "clear" || value === "unclear" || value === "critical";
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function coerceBusinessImpact(value: unknown): BusinessImpact | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.toLowerCase();
  return isBusinessImpact(normalized) ? normalized : null;
}

function coerceActionStatus(value: unknown): ActionStatus | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.toLowerCase();
  return isActionStatus(normalized) ? normalized : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

interface InterpreterJson {
  intent: string;
  description: string;
  clarity_score: number;
  business_impact: BusinessImpact;
  impact_reason: string;
  status: ActionStatus;
  fix_suggestion: string;
}
