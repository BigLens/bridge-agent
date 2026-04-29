import type { TriggerMethod } from "../iag/types.js";

export interface CandidateElement {
  tag: string;
  label: string;
  attributes: Record<string, string>;
  selector: string;
  selector_chain: string[];
  trigger_method: TriggerMethod;
  context: string;
  page_title: string;
  url: string;
  href?: string;
  in_navigation: boolean;
  in_footer?: boolean;
  form_selector?: string;
}

export interface ExtractorOptions {
  maxCandidates?: number;
  timeoutMs?: number;
}

export interface ExtractionResult {
  url: string;
  title: string;
  candidates: CandidateElement[];
  rawCandidateCount: number;
}
