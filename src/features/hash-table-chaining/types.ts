export type OperationType = "insert" | "search" | "delete";
export type HashStrategy = "chaining" | "linear-probing";
export type CodeLanguage = "python" | "c";
export type CodeSnippetKey = OperationType;
export type LinearSlot = number | null | "DELETED";

export interface TableState {
  bucketCount: number;
  strategy: HashStrategy;
  buckets?: number[][];
  slots?: LinearSlot[];
}

export interface StepHighlights {
  activeBucketIndex: number;
  activeNodeIndex?: number;
  activeNodeValue?: number;
  mode:
    | "hash"
    | "collision"
    | "scan"
    | "insert"
    | "found"
    | "delete"
    | "miss"
    | "duplicate"
    | "full";
}

export interface StepMetrics {
  size: number;
  loadFactor: number;
  totalCollisions: number;
  comparisons: number;
  operationCollisions: number;
}

export interface Step {
  id: string;
  operation: OperationType;
  title: string;
  explanation: string;
  key: number;
  hashValue: number;
  bucketIndex: number;
  tableState: TableState;
  highlights: StepHighlights;
  metrics: StepMetrics;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  baseState: TableState;
  finalState: TableState;
  steps: Step[];
}

export interface CodeSnippet {
  title: string;
  code: string;
}

export type LanguageSnippetMap = Record<CodeLanguage, CodeSnippet>;

export interface CodeExampleSet {
  snippets: Record<CodeSnippetKey, LanguageSnippetMap>;
  fullImplementations: LanguageSnippetMap;
  modeNotes: Partial<Record<StepHighlights["mode"], string>>;
}
