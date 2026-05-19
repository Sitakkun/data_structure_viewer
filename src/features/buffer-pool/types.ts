export type BufferPolicy = "lru" | "clock";

export type BufferPoolOperation =
  | "read"
  | "update"
  | "range-scan"
  | "pin"
  | "unpin"
  | "checkpoint";

export type BufferPoolMode =
  | "idle"
  | "hit"
  | "miss"
  | "load"
  | "evict"
  | "writeback"
  | "dirty"
  | "pin"
  | "unpin"
  | "clock-scan"
  | "second-chance"
  | "checkpoint";

export type BufferPoolLanguage = "pseudo" | "python";

export interface BufferFrame {
  frameIndex: number;
  pageId?: number;
  dirty: boolean;
  pinCount: number;
  referenceBit: boolean;
  lastAccessTick: number;
  accessCount: number;
}

export interface BufferPoolMetrics {
  logicalReads: number;
  physicalReads: number;
  physicalWrites: number;
  hits: number;
  misses: number;
  evictions: number;
  writebacks: number;
}

export interface BufferPoolState {
  policy: BufferPolicy;
  capacity: number;
  frames: BufferFrame[];
  lruOrder: number[];
  clockHand: number;
  accessTick: number;
  metrics: BufferPoolMetrics;
}

export interface BufferPoolStepHighlights {
  mode: BufferPoolMode;
  activePageId?: number;
  activeFrameIndex?: number;
  victimFrameIndex?: number;
  evictedPageId?: number;
  clockHandIndex?: number;
  dirtyWrite?: boolean;
}

export interface BufferPoolStep {
  id: string;
  operation: BufferPoolOperation;
  title: string;
  explanation: string;
  bufferState: BufferPoolState;
  highlights: BufferPoolStepHighlights;
}

export interface BufferPoolScenario {
  id: string;
  title: string;
  description: string;
  watchPoints?: string[];
  baseState: BufferPoolState;
  finalState: BufferPoolState;
  steps: BufferPoolStep[];
}

export interface BufferPoolAction {
  operation: BufferPoolOperation;
  pageId?: number;
}

export interface BufferPoolScenarioDefinition {
  id: string;
  title: string;
  description: string;
  watchPoints?: string[];
  actions: BufferPoolAction[];
}

export type BufferPoolLanguageSnippetMap = Record<
  BufferPoolLanguage,
  {
    title: string;
    code: string;
  }
>;

export interface BufferPoolCodeExampleSet {
  snippets: Record<BufferPoolOperation, BufferPoolLanguageSnippetMap>;
  fullImplementations: BufferPoolLanguageSnippetMap;
  modeNotes: Partial<Record<BufferPoolMode, string>>;
}
