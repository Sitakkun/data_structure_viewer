import {
  buildCompetingProposersSteps,
  buildMessageLossSteps,
  buildPreserveAcceptedValueSteps,
  buildRetryAfterRejectSteps,
  buildSingleProposerSteps,
  clonePaxosState,
  createInitialPaxosState,
} from "./simulation";
import { PaxosScenario, PaxosStep } from "./types";

function makeScenario(
  id: string,
  title: string,
  description: string,
  baseState: ReturnType<typeof createInitialPaxosState>,
  steps: PaxosStep[],
): PaxosScenario {
  return {
    id,
    title,
    description,
    baseState: clonePaxosState(baseState),
    finalState: clonePaxosState(steps[steps.length - 1]?.paxosState ?? baseState),
    steps: clonePaxosSteps(steps),
  };
}

export function clonePaxosSteps(steps: PaxosStep[]) {
  return steps.map((step) => ({
    ...step,
    paxosState: clonePaxosState(step.paxosState),
    highlights: {
      ...step.highlights,
      activeAcceptorIds: step.highlights.activeAcceptorIds
        ? [...step.highlights.activeAcceptorIds]
        : undefined,
      activeMessageIds: step.highlights.activeMessageIds
        ? [...step.highlights.activeMessageIds]
        : undefined,
    },
    metrics: { ...step.metrics },
  }));
}

const happyBaseState = createInitialPaxosState();

export const seededPaxosScenario = makeScenario(
  "paxos-happy-path",
  "Happy path: quorum で値 A を決める",
  "P1 が prepare / promise / accept request / accepted を順に進め、3/5 quorum で A を chosen にします。",
  happyBaseState,
  buildSingleProposerSteps(happyBaseState, "P1", 1, "A"),
);

export const paxosScenarios: PaxosScenario[] = [
  makeScenario(
    "paxos-message-loss",
    "Message loss: 全員でなくても進む",
    "A4/A5 へのメッセージが失われても、A1/A2/A3 の quorum で合意できることを確認します。",
    createInitialPaxosState(),
    buildMessageLossSteps(),
  ),
  makeScenario(
    "paxos-competing-proposers",
    "Competing proposers: 高い番号が優先される",
    "P1 が promise を得たあと、P2 がより大きい proposal number で preempt する流れを確認します。",
    createInitialPaxosState(),
    buildCompetingProposersSteps(),
  ),
  makeScenario(
    "paxos-preserve-accepted-value",
    "Preserve accepted value: 値を引き継ぐ",
    "過去に accepted された値が promise に含まれ、新しい proposer がその値を採用する safety の要点を確認します。",
    createInitialPaxosState(),
    buildPreserveAcceptedValueSteps(),
  ),
  makeScenario(
    "paxos-retry-after-reject",
    "Retry after reject: 番号を上げて回復する",
    "低い proposal number が reject されたあと、より大きい番号で quorum を取り直す流れを確認します。",
    createInitialPaxosState(),
    buildRetryAfterRejectSteps(),
  ),
];

export function findPaxosScenarioById(id: string) {
  return [seededPaxosScenario, ...paxosScenarios].find(
    (scenario) => scenario.id === id,
  ) ?? seededPaxosScenario;
}
