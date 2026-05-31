export type ExternalSortStage =
  | "input"
  | "run-generation"
  | "merge-pass";

export type ExternalSortLanguage = "pseudo" | "python";

export interface ExternalSortConfig {
  recordCount: number;
  runSize: number;
  bufferCount: number;
}

export interface SortRun {
  id: string;
  label: string;
  passNumber: number;
  size: number;
  sourceRunIds: string[];
}

export interface MergeGroup {
  id: string;
  inputRuns: SortRun[];
  outputRun: SortRun;
}

export interface MergePass {
  id: string;
  passNumber: number;
  inputRunCount: number;
  outputRunCount: number;
  groups: MergeGroup[];
  readPages: number;
  writePages: number;
}

export interface ExternalSortPlan {
  config: ExternalSortConfig;
  mergeFanIn: number;
  initialRuns: SortRun[];
  mergePasses: MergePass[];
  totalPasses: number;
  totalReadPages: number;
  totalWritePages: number;
  totalIoPages: number;
}

export interface ExternalSortState {
  plan: ExternalSortPlan;
  stage: ExternalSortStage;
  visibleRuns: SortRun[];
  completedPassIds: string[];
  activeRunIds: string[];
  activeInputRunIds: string[];
  activeOutputRunIds: string[];
  cumulativeReadPages: number;
  cumulativeWritePages: number;
}

export interface ExternalSortStep {
  id: string;
  title: string;
  explanation: string;
  stage: ExternalSortStage;
  activePassId?: string;
  sortState: ExternalSortState;
}

export interface ExternalSortScenarioDefinition {
  id: string;
  title: string;
  description: string;
  watchPoints?: string[];
  config: ExternalSortConfig;
}

export interface ExternalSortScenario {
  id: string;
  title: string;
  description: string;
  watchPoints?: string[];
  config: ExternalSortConfig;
  baseState: ExternalSortState;
  finalState: ExternalSortState;
  steps: ExternalSortStep[];
}

export interface ExternalSortCodeSnippet {
  title: string;
  code: string;
}

export interface ExternalSortCodeExampleSet {
  snippets: Record<ExternalSortStage, Record<ExternalSortLanguage, ExternalSortCodeSnippet>>;
  fullImplementations: Record<ExternalSortLanguage, ExternalSortCodeSnippet>;
  stageNotes: Record<ExternalSortStage, string>;
}
