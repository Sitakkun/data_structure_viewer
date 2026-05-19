export type BPlusTreeOperation = "insert" | "search" | "range-scan" | "delete";
export type BPlusTreeLanguage = "python" | "c";

export interface BPlusTreeNode {
  id: string;
  keys: number[];
  children: BPlusTreeNode[];
  isLeaf: boolean;
  nextLeafId?: string;
}

export interface BPlusTreeState {
  minDegree: number;
  maxKeysPerNode: number;
  nextNodeId: number;
  root?: BPlusTreeNode;
  activeKey?: number;
  activeRangeStart?: number;
  activeRangeEnd?: number;
  collectedKeys?: number[];
  sourceKeys?: number[];
}

export interface BPlusTreeStepHighlights {
  activeNodeId?: string;
  activeKeyIndex?: number;
  pathNodeIds: string[];
  promotedKey?: number;
  nextLeafId?: string;
  collectedKeyIndices?: number[];
  mode:
    | "scan"
    | "descend"
    | "range-start"
    | "leaf-scan"
    | "collect"
    | "chain-hop"
    | "range-stop"
    | "range-done"
    | "leaf-insert"
    | "leaf-delete"
    | "underflow"
    | "split-leaf"
    | "split-internal"
    | "root-split"
    | "found"
    | "miss";
}

export interface BPlusTreeStepMetrics {
  height: number;
  nodeCount: number;
  leafCount: number;
  comparisons: number;
}

export interface BPlusTreeStep {
  id: string;
  operation: BPlusTreeOperation;
  title: string;
  explanation: string;
  bplusTreeState: BPlusTreeState;
  highlights: BPlusTreeStepHighlights;
  metrics: BPlusTreeStepMetrics;
}

export interface BPlusTreeScenario {
  id: string;
  title: string;
  description: string;
  watchPoints?: string[];
  baseState: BPlusTreeState;
  finalState: BPlusTreeState;
  steps: BPlusTreeStep[];
}

export interface BPlusTreeCodeSnippet {
  title: string;
  code: string;
}

export type BPlusTreeLanguageSnippetMap = Record<
  BPlusTreeLanguage,
  BPlusTreeCodeSnippet
>;

export interface BPlusTreeCodeExampleSet {
  snippets: Record<BPlusTreeOperation, BPlusTreeLanguageSnippetMap>;
  fullImplementations: BPlusTreeLanguageSnippetMap;
  modeNotes: Partial<Record<BPlusTreeStepHighlights["mode"], string>>;
}
