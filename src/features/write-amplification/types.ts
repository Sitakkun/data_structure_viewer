export type WriteEngine = "btree" | "bepsilon" | "lsm";
export type WriteOperation = "insert" | "update" | "delete";
export type WriteLayer =
  | "logical"
  | "wal"
  | "buffer-pool"
  | "index-page"
  | "page-split"
  | "node-buffer"
  | "flush"
  | "memtable"
  | "sstable"
  | "compaction"
  | "tombstone";
export type WriteAmplificationLanguage = "pseudo" | "python";

export interface WorkloadConfig {
  operation: WriteOperation;
  count: number;
  walEnabled: boolean;
  btreeSplitEvery: number;
  bepsilonBufferCapacity: number;
  lsmMemtableCapacity: number;
  lsmCompactionFanout: number;
}

export interface WriteEvent {
  id: string;
  engine: WriteEngine;
  layer: WriteLayer;
  label: string;
  units: number;
  explanation: string;
}

export interface EngineWriteSummary {
  engine: WriteEngine;
  logicalWrites: number;
  physicalWriteUnits: number;
  writeAmplification: number;
  events: WriteEvent[];
}

export interface WriteAmplificationStep {
  id: string;
  title: string;
  explanation: string;
  activeEngine?: WriteEngine;
  activeEventId?: string;
  summaries: Record<WriteEngine, EngineWriteSummary>;
}

export interface WriteAmplificationScenario {
  id: string;
  title: string;
  description: string;
  watchPoints?: string[];
  config: WorkloadConfig;
  steps: WriteAmplificationStep[];
}

export interface WriteAmplificationCodeSnippet {
  title: string;
  code: string;
}

export type WriteAmplificationSnippetMap = Record<
  WriteAmplificationLanguage,
  WriteAmplificationCodeSnippet
>;

export interface WriteAmplificationCodeExampleSet {
  snippets: Record<WriteEngine, WriteAmplificationSnippetMap>;
  notes: Record<WriteEngine, string>;
}
