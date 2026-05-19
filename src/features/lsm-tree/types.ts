export type LSMOperation = "put" | "search" | "delete" | "flush" | "compact";
export type LSMLanguage = "python" | "pseudo";

export interface LSMRecord {
  key: number;
  value?: string;
  tombstone?: boolean;
  sequence: number;
}

export interface SSTable {
  id: string;
  level: number;
  records: LSMRecord[];
}

export interface LSMState {
  wal: LSMRecord[];
  memtable: LSMRecord[];
  immutableMemtable?: LSMRecord[];
  sstables: SSTable[];
  memtableCapacity: number;
  nextSequence: number;
  nextSSTableId: number;
  activeKey?: number;
  searchResult?: "found" | "deleted" | "miss";
}

export interface LSMStepHighlights {
  activeLayer?: "wal" | "memtable" | "immutable" | "sstable" | "compaction";
  activeSSTableId?: string;
  activeKey?: number;
  activeSequence?: number;
  mode:
    | "wal"
    | "memtable-write"
    | "freeze"
    | "flush"
    | "search-memtable"
    | "search-sstable"
    | "found"
    | "miss"
    | "tombstone"
    | "compact"
    | "drop-obsolete";
}

export interface LSMStepMetrics {
  walEntries: number;
  memtableEntries: number;
  sstableCount: number;
  tombstoneCount: number;
  readSources: number;
  writeUnits: number;
}

export interface LSMStep {
  id: string;
  operation: LSMOperation;
  title: string;
  explanation: string;
  lsmState: LSMState;
  highlights: LSMStepHighlights;
  metrics: LSMStepMetrics;
}

export interface LSMScenario {
  id: string;
  title: string;
  description: string;
  watchPoints?: string[];
  baseState: LSMState;
  finalState: LSMState;
  steps: LSMStep[];
}

export interface LSMCodeSnippet {
  title: string;
  code: string;
}

export type LSMLanguageSnippetMap = Record<LSMLanguage, LSMCodeSnippet>;

export interface LSMCodeExampleSet {
  snippets: Record<LSMOperation, LSMLanguageSnippetMap>;
  fullImplementations: LSMLanguageSnippetMap;
  modeNotes: Partial<Record<LSMStepHighlights["mode"], string>>;
}
