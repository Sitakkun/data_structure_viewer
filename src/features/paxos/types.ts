export type PaxosOperation =
  | "propose"
  | "message-loss"
  | "conflict"
  | "preserve"
  | "recover";

export type PaxosLanguage = "pseudo" | "python";

export type PaxosPhase =
  | "idle"
  | "prepare"
  | "promise"
  | "accept-request"
  | "accepted"
  | "chosen"
  | "reject"
  | "retry"
  | "adopt-value"
  | "message-loss";

export type PaxosMessageType =
  | "prepare"
  | "promise"
  | "accept-request"
  | "accepted"
  | "reject";

export interface AcceptorState {
  id: string;
  promisedProposal?: number;
  acceptedProposal?: number;
  acceptedValue?: string;
}

export interface ProposerState {
  id: string;
  proposalNumber: number;
  proposedValue: string;
  chosenValue?: string;
  promises: string[];
  accepts: string[];
  rejectedBy: string[];
}

export interface LearnerState {
  chosenValue?: string;
  acceptedCounts: Record<string, number>;
}

export interface PaxosMessage {
  id: string;
  from: string;
  to: string;
  type: PaxosMessageType;
  proposalNumber: number;
  value?: string;
  carriesAcceptedProposal?: number;
  carriesAcceptedValue?: string;
  dropped?: boolean;
}

export interface PaxosState {
  proposers: ProposerState[];
  acceptors: AcceptorState[];
  learner: LearnerState;
  activeMessages: PaxosMessage[];
  quorumSize: number;
  phase: PaxosPhase;
  chosenValue?: string;
}

export interface PaxosStepHighlights {
  mode: PaxosPhase;
  activeProposerId?: string;
  activeAcceptorIds?: string[];
  activeMessageIds?: string[];
  quorumReached?: boolean;
  rejected?: boolean;
}

export interface PaxosStepMetrics {
  promiseCount: number;
  acceptedCount: number;
  quorumSize: number;
  messageCount: number;
  rejectCount: number;
}

export interface PaxosStep {
  id: string;
  operation: PaxosOperation;
  title: string;
  explanation: string;
  paxosState: PaxosState;
  highlights: PaxosStepHighlights;
  metrics: PaxosStepMetrics;
}

export interface PaxosScenario {
  id: string;
  title: string;
  description: string;
  baseState: PaxosState;
  finalState: PaxosState;
  steps: PaxosStep[];
}

export type PaxosLanguageSnippetMap = Record<
  PaxosLanguage,
  {
    title: string;
    code: string;
  }
>;

export interface PaxosCodeExampleSet {
  snippets: Record<PaxosOperation, PaxosLanguageSnippetMap>;
  fullImplementations: PaxosLanguageSnippetMap;
  modeNotes: Partial<Record<PaxosPhase, string>>;
}
