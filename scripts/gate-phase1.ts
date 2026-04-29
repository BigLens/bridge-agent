import { runAudit } from "../src/audit.js";
import { meaningfulActionRatio } from "../src/evaluator/scorer.js";
import { createProviderFromEnv, HeuristicProvider } from "../src/interpreter/provider.js";

const args = parseArgs(process.argv.slice(2));
const urls = args.urls.length > 0 ? args.urls : urlsFromEnv();
const provider = args.heuristic ? new HeuristicProvider() : createProviderFromEnv();
const results = [];

for (const url of urls) {
  console.log(`Running Phase 1 gate sample: ${url}`);
  const result = await runAudit({
    url,
    provider,
    maxCandidates: args.maxCandidates
  });
  const meaningfulRatio = meaningfulActionRatio(result.rawCandidateCount, result.actions.length);
  const cost = estimateCost(result.usage.inputTokens, result.usage.outputTokens);
  results.push({ result, meaningfulRatio, cost });
}

const averageMeaningfulRatio =
  results.reduce((sum, entry) => sum + entry.meaningfulRatio, 0) / Math.max(results.length, 1);
const averageCost = results.reduce((sum, entry) => sum + entry.cost, 0) / Math.max(results.length, 1);

console.log("");
console.log("Phase 1 Gate Report");
console.log(`Sites tested: ${results.length}`);
console.log(`Average meaningful-action ratio: ${(averageMeaningfulRatio * 100).toFixed(1)}%`);
console.log(`Average estimated analysis cost: ${averageCost.toFixed(4)} USD`);
console.log("");
console.log("[ ] Reports understandable without explanation: requires human review of generated reports");
console.log(
  `${averageMeaningfulRatio >= 0.5 ? "[x]" : "[ ]"} >= 50% meaningful actions per site: ${(averageMeaningfulRatio * 100).toFixed(1)}%`
);
console.log(`${averageCost <= 0.1 ? "[x]" : "[ ]"} <= 0.10 USD cost per site: ${averageCost.toFixed(4)} USD`);
console.log("[ ] Human reviewer finds output useful: requires human review");
console.log("");
console.log("Generated reports:");
for (const entry of results) {
  console.log(`- ${entry.result.markdownPath}`);
}

function parseArgs(argv: string[]): { urls: string[]; maxCandidates?: number; heuristic: boolean } {
  const parsed: { urls: string[]; maxCandidates?: number; heuristic: boolean } = {
    urls: [],
    heuristic: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url") {
      parsed.urls.push(argv[index + 1]);
      index += 1;
    } else if (value === "--max-candidates") {
      parsed.maxCandidates = Number(argv[index + 1]);
      index += 1;
    } else if (value === "--heuristic") {
      parsed.heuristic = true;
    }
  }

  return parsed;
}

function urlsFromEnv(): string[] {
  const raw = process.env.AGENTLIT_GATE_URLS;
  if (!raw) {
    return [
      "https://example.com",
      "https://www.wikipedia.org",
      "https://www.mozilla.org",
      "https://www.shopify.com",
      "https://wordpress.org"
    ];
  }
  return raw.split(",").map((url) => url.trim()).filter(Boolean);
}

function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = Number(process.env.AGENTLIT_INPUT_COST_PER_1M_TOKENS ?? "0.10");
  const outputCost = Number(process.env.AGENTLIT_OUTPUT_COST_PER_1M_TOKENS ?? "0.40");
  return (inputTokens / 1_000_000) * inputCost + (outputTokens / 1_000_000) * outputCost;
}
