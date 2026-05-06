export type BTreeOperation = "insert" | "search" | "range-scan" | "delete";
export type BTreeLanguage = "python" | "c";

export interface BTreeNode {
  id: string;
  keys: number[];
  children: BTreeNode[];
  isLeaf: boolean;
}

export interface BTreeState {
  minDegree: number;
  maxKeysPerNode: number;
  nextNodeId: number;
  root?: BTreeNode;
  activeKey?: number;
  activeRangeStart?: number;
  activeRangeEnd?: number;
  collectedKeys?: number[];
  sourceKeys?: number[];
}

export interface BTreeStepHighlights {
  activeNodeId?: string;
  activeKeyIndex?: number;
  pathNodeIds: string[];
  promotedKey?: number;
  mode:
    | "scan"
    | "descend"
    | "range-start"
    | "range-scan"
    | "collect"
    | "range-stop"
    | "range-done"
    | "insert"
    | "delete"
    | "internal-delete"
    | "underflow"
    | "split"
    | "root-split"
    | "found"
    | "miss";
}

export interface BTreeStepMetrics {
  height: number;
  nodeCount: number;
  comparisons: number;
}

export interface BTreeStep {
  id: string;
  operation: BTreeOperation;
  title: string;
  explanation: string;
  btreeState: BTreeState;
  highlights: BTreeStepHighlights;
  metrics: BTreeStepMetrics;
}

export interface BTreeScenario {
  id: string;
  title: string;
  description: string;
  baseState: BTreeState;
  finalState: BTreeState;
  steps: BTreeStep[];
}

export interface BTreeCodeSnippet {
  title: string;
  code: string;
}

export type BTreeLanguageSnippetMap = Record<BTreeLanguage, BTreeCodeSnippet>;

export interface BTreeCodeExampleSet {
  snippets: Record<BTreeOperation, BTreeLanguageSnippetMap>;
  fullImplementations: BTreeLanguageSnippetMap;
  modeNotes: Partial<Record<BTreeStepHighlights["mode"], string>>;
}
