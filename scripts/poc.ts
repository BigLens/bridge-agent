import { runAudit } from "../src/audit.js";
import { createProviderFromEnv, HeuristicProvider } from "../src/interpreter/provider.js";

const args = parseArgs(process.argv.slice(2));

if (!args.url) {
  console.error("Usage: npm run poc -- --url https://example.com [--max-candidates 80] [--heuristic]");
  process.exit(1);
}

if (args.heuristic) {
  process.env.AGENTLIT_LLM_PROVIDER = "heuristic";
}

const provider = args.heuristic ? new HeuristicProvider() : createProviderFromEnv();
const result = await runAudit({
  url: args.url,
  provider,
  maxCandidates: args.maxCandidates
});

console.log(`Agentlit Phase 1 audit complete for ${result.siteName}`);
console.log(`Report: ${result.markdownPath}`);
console.log(`IAG JSON: ${result.iagPath}`);
console.log(`Candidates JSON: ${result.candidatesPath}`);
console.log(`Unresolved JSON: ${result.unresolvedPath}`);
console.log(`Actions analysed: ${result.actions.length}`);
console.log(`Unresolved elements: ${result.unresolved.length}`);
for (const [reason, count] of reasonCounts(result.unresolved)) {
  console.log(`- ${reason}: ${count}`);
}
console.log(`Score: ${result.score}/100`);

function parseArgs(argv: string[]): { url?: string; maxCandidates?: number; heuristic: boolean } {
  const parsed: { url?: string; maxCandidates?: number; heuristic: boolean } = { heuristic: false };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url") {
      parsed.url = argv[index + 1];
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

function reasonCounts(unresolved: Array<{ reason: string }>): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const item of unresolved) {
    counts.set(item.reason, (counts.get(item.reason) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
}
