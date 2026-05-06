export type BloomOperation = "insert" | "query";
export type BloomLanguage = "python" | "c";

export interface BloomHashResult {
  label: string;
  index: number;
}

export interface BloomState {
  bitCount: number;
  hashCount: number;
  bits: boolean[];
  items: string[];
  activeItem?: string;
  activeHashes: BloomHashResult[];
}

export interface BloomStepHighlights {
  activeBitIndexes: number[];
  activeHashIndex?: number;
  mode: "hash" | "set-bit" | "check-bit" | "miss" | "maybe" | "false-positive";
}

export interface BloomStepMetrics {
  itemCount: number;
  setBitCount: number;
  loadFactor: number;
  falsePositiveHint: string;
}

export interface BloomStep {
  id: string;
  operation: BloomOperation;
  title: string;
  explanation: string;
  bloomState: BloomState;
  highlights: BloomStepHighlights;
  metrics: BloomStepMetrics;
}

export interface BloomScenario {
  id: string;
  title: string;
  description: string;
  baseState: BloomState;
  finalState: BloomState;
  steps: BloomStep[];
}

export interface BloomCodeSnippet {
  title: string;
  code: string;
}

export type BloomLanguageSnippetMap = Record<BloomLanguage, BloomCodeSnippet>;

export interface BloomCodeExampleSet {
  snippets: Record<BloomOperation, BloomLanguageSnippetMap>;
  fullImplementations: BloomLanguageSnippetMap;
  modeNotes: Partial<Record<BloomStepHighlights["mode"], string>>;
}
