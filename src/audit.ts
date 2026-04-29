import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { DEFAULT_MAX_CANDIDATES } from "./config.js";
import { evaluateActions } from "./evaluator/index.js";
import { extractCandidates } from "./extractor/index.js";
import { appendIagNodes } from "./iag/store.js";
import type { IAGNode, ReportAction, UnresolvedElement } from "./iag/types.js";
import { interpretCandidates } from "./interpreter/index.js";
import type { LlmProvider } from "./interpreter/provider.js";
import { renderAuditReport, writeAuditReport } from "./output/report.js";

export interface RunAuditOptions {
  url: string;
  provider: LlmProvider;
  outputDir?: string;
  maxCandidates?: number;
}

export interface AuditRunResult {
  siteName: string;
  markdownPath: string;
  iagPath: string;
  unresolvedPath: string;
  candidatesPath: string;
  markdown: string;
  nodes: IAGNode[];
  actions: ReportAction[];
  unresolved: UnresolvedElement[];
  rawCandidateCount: number;
  extractedCandidateCount: number;
  score: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function runAudit(options: RunAuditOptions): Promise<AuditRunResult> {
  const outputDir = options.outputDir ?? "output";
  const extraction = await extractCandidates(options.url, {
    maxCandidates: options.maxCandidates ?? DEFAULT_MAX_CANDIDATES
  });
  const interpreted = await interpretCandidates(extraction.candidates, options.provider);
  const evaluated = evaluateActions(interpreted.actions);
  const siteName = siteNameFromUrl(extraction.url);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const slug = slugFromSiteName(siteName);
  const markdownPath = `${outputDir}/${slug}-${timestamp}.md`;
  const iagPath = `${outputDir}/${slug}-${timestamp}.iag.json`;
  const unresolvedPath = `${outputDir}/${slug}-${timestamp}.unresolved.json`;
  const candidatesPath = `${outputDir}/${slug}-${timestamp}.candidates.json`;
  const markdown = renderAuditReport({
    siteName,
    generatedAt: new Date(),
    actions: evaluated.actions,
    unresolved: interpreted.unresolved,
    score: evaluated.score
  });
  const nodes = evaluated.actions.map((action) => action.node);

  await writeAuditReport(markdownPath, markdown);
  await appendIagNodes(iagPath, nodes);
  await writeJson(candidatesPath, extraction.candidates);
  await writeJson(unresolvedPath, interpreted.unresolved);

  return {
    siteName,
    markdownPath,
    iagPath,
    unresolvedPath,
    candidatesPath,
    markdown,
    nodes,
    actions: evaluated.actions,
    unresolved: interpreted.unresolved,
    rawCandidateCount: extraction.rawCandidateCount,
    extractedCandidateCount: extraction.candidates.length,
    score: evaluated.score,
    usage: interpreted.usage
  };
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function siteNameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "") || "local-page";
  } catch {
    return basename(url);
  }
}

function slugFromSiteName(siteName: string): string {
  return siteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
}
