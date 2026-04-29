import { DEFAULT_LLM_TIMEOUT_MS, requiredEnv } from "../config.js";

export interface LlmCompleteRequest {
  system: string;
  user: string;
  timeoutMs?: number;
}

export interface LlmCompleteResponse {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface LlmProvider {
  complete(request: LlmCompleteRequest): Promise<LlmCompleteResponse>;
}

export class RateLimitError extends Error {
  constructor(message = "LLM provider rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

export class LlmTimeoutError extends Error {
  constructor(message = "LLM provider request timed out") {
    super(message);
    this.name = "LlmTimeoutError";
  }
}

export class RetryableProviderError extends Error {
  constructor(message = "LLM provider is temporarily unavailable") {
    super(message);
    this.name = "RetryableProviderError";
  }
}

export class GeminiProvider implements LlmProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(options: { apiKey: string; model?: string }) {
    this.apiKey = options.apiKey;
    this.model = options.model ?? "gemini-2.0-flash";
  }

  async complete(request: LlmCompleteRequest): Promise<LlmCompleteResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? DEFAULT_LLM_TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: request.system }]
            },
            contents: [
              {
                role: "user",
                parts: [{ text: request.user }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              response_mime_type: "application/json",
              response_schema: {
                type: "OBJECT",
                required: [
                  "intent",
                  "description",
                  "clarity_score",
                  "business_impact",
                  "impact_reason",
                  "status",
                  "fix_suggestion"
                ],
                properties: {
                  intent: { type: "STRING" },
                  description: { type: "STRING" },
                  clarity_score: { type: "NUMBER" },
                  business_impact: { type: "STRING", enum: ["low", "medium", "high"] },
                  impact_reason: { type: "STRING" },
                  status: { type: "STRING", enum: ["clear", "unclear", "critical"] },
                  fix_suggestion: { type: "STRING" }
                }
              }
            }
          }),
          signal: controller.signal
        }
      );

      if (response.status === 429) {
        throw new RateLimitError(await safeResponseText(response));
      }
      if ([500, 502, 503, 504].includes(response.status)) {
        throw new RetryableProviderError(await safeResponseText(response));
      }
      if (!response.ok) {
        throw new Error(`Gemini request failed with HTTP ${response.status}: ${await safeResponseText(response)}`);
      }

      const payload = (await response.json()) as GeminiGenerateContentResponse;
      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

      return {
        text,
        inputTokens: payload.usageMetadata?.promptTokenCount,
        outputTokens: payload.usageMetadata?.candidatesTokenCount
      };
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw new LlmTimeoutError();
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function safeResponseText(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  return text.slice(0, 500) || `HTTP ${response.status}`;
}

export class HeuristicProvider implements LlmProvider {
  async complete(request: LlmCompleteRequest): Promise<LlmCompleteResponse> {
    const label = /Visible text:\s+(".*")/.exec(request.user)?.[1] ?? "\"Action\"";
    const cleanLabel = JSON.parse(label) as string;
    const intent = cleanLabel || "Unlabelled Action";

    return {
      text: JSON.stringify({
        intent,
        description: `${intent} is an interactive element identified on the page.`,
        clarity_score: cleanLabel ? 0.74 : 0.42,
        business_impact: inferImpact(cleanLabel),
        impact_reason: "Ambiguous or missing action labels can reduce confidence during conversion flows.",
        status: cleanLabel ? "unclear" : "critical",
        fix_suggestion: "Use a specific visible label that states the action outcome."
      }),
      inputTokens: estimateTokens(request.system) + estimateTokens(request.user),
      outputTokens: 80
    };
  }
}

export function createProviderFromEnv(): LlmProvider {
  if (process.env.AGENTLIT_LLM_PROVIDER === "heuristic") {
    return new HeuristicProvider();
  }

  return new GeminiProvider({
    apiKey: requiredEnv("GEMINI_API_KEY"),
    model: process.env.GEMINI_MODEL
  });
}

function inferImpact(label: string): "low" | "medium" | "high" {
  if (/(checkout|cart|buy|quote|demo|book|subscribe|apply|payment)/i.test(label)) {
    return "high";
  }
  if (/(search|filter|contact|login|sign up|signup)/i.test(label)) {
    return "medium";
  }
  return "low";
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}
