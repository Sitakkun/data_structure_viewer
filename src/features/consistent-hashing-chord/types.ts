export type ChordOperation = "lookup-resource";
export type ChordLanguage = "python" | "c";

export interface ChordFingerEntry {
  index: number;
  start: number;
  intervalEnd: number;
  successorNodeId: string;
  successorHash: number;
}

export interface ChordNode {
  id: string;
  hash: number;
  color: string;
  predecessorId: string;
  successorId: string;
  fingerTable: ChordFingerEntry[];
}

export interface ChordResource {
  id: string;
  hash: number;
  ownerNodeId: string;
}

export interface ChordHop {
  fromNodeId: string;
  toNodeId: string;
  viaFingerIndex?: number;
}

export interface ChordState {
  ringBits: number;
  ringSize: number;
  nodes: ChordNode[];
  resources: ChordResource[];
  activeResource?: ChordResource;
  currentNodeId?: string;
  activeHop?: ChordHop;
  pathNodeIds: string[];
}

export interface ChordStepHighlights {
  activeNodeId?: string;
  nextNodeId?: string;
  activeFingerIndex?: number;
  activeResourceId?: string;
  activeResourceHash?: number;
  mode: "hash" | "scan" | "hop" | "wrap" | "responsible" | "assign" | "miss";
}

export interface ChordStepMetrics {
  nodeCount: number;
  resourceCount: number;
  hopCount: number;
  lookupPath: string;
}

export interface ChordStep {
  id: string;
  operation: ChordOperation;
  title: string;
  explanation: string;
  chordState: ChordState;
  highlights: ChordStepHighlights;
  metrics: ChordStepMetrics;
}

export interface ChordScenario {
  id: string;
  title: string;
  description: string;
  baseState: ChordState;
  finalState: ChordState;
  steps: ChordStep[];
}

export interface ChordCodeSnippet {
  title: string;
  code: string;
}

export type ChordLanguageSnippetMap = Record<ChordLanguage, ChordCodeSnippet>;

export interface ChordCodeExampleSet {
  snippets: Record<ChordOperation, ChordLanguageSnippetMap>;
  fullImplementations: ChordLanguageSnippetMap;
  modeNotes: Partial<Record<ChordStepHighlights["mode"], string>>;
}
