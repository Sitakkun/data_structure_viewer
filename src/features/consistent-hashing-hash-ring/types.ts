export type HashRingOperation =
  | "add-node"
  | "remove-node"
  | "lookup-resource"
  | "add-resource";
export type HashRingLanguage = "python" | "c";

export interface RingNode {
  id: string;
  hash: number;
  color: string;
}

export interface RingResource {
  id: string;
  hash: number;
  assignedNodeId?: string;
}

export interface RingState {
  ringSize: number;
  nodes: RingNode[];
  resources: RingResource[];
  activeResource?: RingResource;
}

export interface RingStepHighlights {
  activeNodeId?: string;
  candidateNodeIds?: string[];
  activeResourceId?: string;
  activeResourceHash?: number;
  mode:
    | "hash"
    | "scan"
    | "assign"
    | "insert"
    | "remove"
    | "wrap"
    | "miss"
    | "resource";
}

export interface RingStepMetrics {
  nodeCount: number;
  resourceCount: number;
  comparisons: number;
  remappedResourcesHint: string;
}

export interface RingStep {
  id: string;
  operation: HashRingOperation;
  title: string;
  explanation: string;
  ringState: RingState;
  highlights: RingStepHighlights;
  metrics: RingStepMetrics;
}

export interface RingScenario {
  id: string;
  title: string;
  description: string;
  watchPoints?: string[];
  baseState: RingState;
  finalState: RingState;
  steps: RingStep[];
}

export interface RingCodeSnippet {
  title: string;
  code: string;
}

export type RingLanguageSnippetMap = Record<HashRingLanguage, RingCodeSnippet>;

export interface RingCodeExampleSet {
  snippets: Record<HashRingOperation, RingLanguageSnippetMap>;
  fullImplementations: RingLanguageSnippetMap;
  modeNotes: Partial<Record<RingStepHighlights["mode"], string>>;
}
