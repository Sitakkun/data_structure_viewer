export type BEpsilonOperation = "insert" | "search" | "delete" | "flush";
export type BEpsilonLanguage = "python" | "c";

export interface BEpsilonMessage {
  id: string;
  type: "insert" | "delete";
  key: number;
  sequence: number;
}

export interface BEpsilonNode {
  id: string;
  keys: number[];
  children: BEpsilonNode[];
  isLeaf: boolean;
  records: number[];
  buffer: BEpsilonMessage[];
}

export interface BEpsilonState {
  epsilon: number;
  fanout: number;
  bufferCapacity: number;
  maxRecordsPerLeaf: number;
  maxKeysPerInternal: number;
  nextNodeId: number;
  nextMessageSequence: number;
  flushCount: number;
  root: BEpsilonNode;
  activeKey?: number;
  activeMessageId?: string;
}

export interface BEpsilonStepHighlights {
  activeNodeId?: string;
  targetChildId?: string;
  activeMessageId?: string;
  activeKey?: number;
  pathNodeIds: string[];
  mode:
    | "create-message"
    | "buffer-insert"
    | "partition"
    | "flush"
    | "apply"
    | "split-leaf"
    | "split-internal"
    | "root-split"
    | "search-buffer"
    | "search-leaf"
    | "found"
    | "miss"
    | "tombstone";
}

export interface BEpsilonStepMetrics {
  height: number;
  nodeCount: number;
  recordCount: number;
  bufferedMessageCount: number;
  flushCount: number;
}

export interface BEpsilonStep {
  id: string;
  operation: BEpsilonOperation;
  title: string;
  explanation: string;
  bepsilonState: BEpsilonState;
  highlights: BEpsilonStepHighlights;
  metrics: BEpsilonStepMetrics;
}

export interface BEpsilonScenario {
  id: string;
  title: string;
  description: string;
  baseState: BEpsilonState;
  finalState: BEpsilonState;
  steps: BEpsilonStep[];
}

export interface BEpsilonCodeSnippet {
  title: string;
  code: string;
}

export type BEpsilonLanguageSnippetMap = Record<
  BEpsilonLanguage,
  BEpsilonCodeSnippet
>;

export interface BEpsilonCodeExampleSet {
  snippets: Record<BEpsilonOperation, BEpsilonLanguageSnippetMap>;
  fullImplementations: BEpsilonLanguageSnippetMap;
  modeNotes: Partial<Record<BEpsilonStepHighlights["mode"], string>>;
}
