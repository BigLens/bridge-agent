export const EXTRACTOR_USER_AGENT =
  "Agentlit/1.0 (AI Interaction Audit; +https://agentlit.io/bot)";

export const DEFAULT_NAVIGATION_TIMEOUT_MS = 30_000;
export const DEFAULT_LLM_TIMEOUT_MS = 30_000;
export const DEFAULT_MAX_CANDIDATES = 80;

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
