import {
  AcceptorState,
  PaxosMessage,
  PaxosOperation,
  PaxosPhase,
  PaxosState,
  PaxosStep,
  ProposerState,
} from "./types";

const proposerSeeds: ProposerState[] = [
  {
    id: "P1",
    proposalNumber: 1,
    proposedValue: "A",
    promises: [],
    accepts: [],
    rejectedBy: [],
  },
  {
    id: "P2",
    proposalNumber: 2,
    proposedValue: "B",
    promises: [],
    accepts: [],
    rejectedBy: [],
  },
];

const acceptorSeeds: AcceptorState[] = ["A1", "A2", "A3", "A4", "A5"].map(
  (id) => ({ id }),
);

export function createInitialPaxosState(): PaxosState {
  return {
    proposers: proposerSeeds.map((proposer) => ({ ...proposer })),
    acceptors: acceptorSeeds.map((acceptor) => ({ ...acceptor })),
    learner: {
      acceptedCounts: {},
    },
    activeMessages: [],
    quorumSize: 3,
    phase: "idle",
  };
}

export function clonePaxosState(state: PaxosState): PaxosState {
  return {
    ...state,
    proposers: state.proposers.map((proposer) => ({
      ...proposer,
      promises: [...proposer.promises],
      accepts: [...proposer.accepts],
      rejectedBy: [...proposer.rejectedBy],
    })),
    acceptors: state.acceptors.map((acceptor) => ({ ...acceptor })),
    learner: {
      ...state.learner,
      acceptedCounts: { ...state.learner.acceptedCounts },
    },
    activeMessages: state.activeMessages.map((message) => ({ ...message })),
  };
}

function setPhase(state: PaxosState, phase: PaxosPhase) {
  state.phase = phase;
}

function proposer(state: PaxosState, id: string) {
  const found = state.proposers.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`Unknown proposer: ${id}`);
  }
  return found;
}

function acceptor(state: PaxosState, id: string) {
  const found = state.acceptors.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`Unknown acceptor: ${id}`);
  }
  return found;
}

function messages(
  from: string,
  toIds: string[],
  type: PaxosMessage["type"],
  proposalNumber: number,
  value?: string,
  droppedIds: string[] = [],
): PaxosMessage[] {
  return toIds.map((to, index) => ({
    id: `${type}-${from}-${to}-${proposalNumber}-${index}`,
    from,
    to,
    type,
    proposalNumber,
    value,
    dropped: droppedIds.includes(to),
  }));
}

function getMetrics(state: PaxosState, activeProposerId: string): PaxosStep["metrics"] {
  const activeProposer = proposer(state, activeProposerId);
  const acceptedCount = state.chosenValue
    ? state.learner.acceptedCounts[state.chosenValue] ?? activeProposer.accepts.length
    : activeProposer.accepts.length;

  return {
    promiseCount: activeProposer.promises.length,
    acceptedCount,
    quorumSize: state.quorumSize,
    messageCount: state.activeMessages.length,
    rejectCount: activeProposer.rejectedBy.length,
  };
}

function pushStep(
  steps: PaxosStep[],
  state: PaxosState,
  options: {
    operation: PaxosOperation;
    activeProposerId: string;
    activeAcceptorIds?: string[];
    title: string;
    explanation: string;
    mode: PaxosPhase;
    rejected?: boolean;
  },
) {
  setPhase(state, options.mode);
  steps.push({
    id: `${options.operation}-${steps.length + 1}`,
    operation: options.operation,
    title: options.title,
    explanation: options.explanation,
    paxosState: clonePaxosState(state),
    highlights: {
      mode: options.mode,
      activeProposerId: options.activeProposerId,
      activeAcceptorIds: options.activeAcceptorIds,
      activeMessageIds: state.activeMessages.map((message) => message.id),
      quorumReached:
        proposer(state, options.activeProposerId).promises.length >= state.quorumSize ||
        proposer(state, options.activeProposerId).accepts.length >= state.quorumSize,
      rejected: options.rejected,
    },
    metrics: getMetrics(state, options.activeProposerId),
  });
}

function promiseToProposer(state: PaxosState, proposerId: string, acceptorIds: string[]) {
  const activeProposer = proposer(state, proposerId);

  for (const acceptorId of acceptorIds) {
    const activeAcceptor = acceptor(state, acceptorId);
    activeAcceptor.promisedProposal = activeProposer.proposalNumber;
    if (!activeProposer.promises.includes(acceptorId)) {
      activeProposer.promises.push(acceptorId);
    }
  }
}

function acceptValue(state: PaxosState, proposerId: string, acceptorIds: string[]) {
  const activeProposer = proposer(state, proposerId);

  for (const acceptorId of acceptorIds) {
    const activeAcceptor = acceptor(state, acceptorId);
    activeAcceptor.promisedProposal = activeProposer.proposalNumber;
    activeAcceptor.acceptedProposal = activeProposer.proposalNumber;
    activeAcceptor.acceptedValue = activeProposer.proposedValue;
    if (!activeProposer.accepts.includes(acceptorId)) {
      activeProposer.accepts.push(acceptorId);
    }
  }

  state.learner.acceptedCounts[activeProposer.proposedValue] =
    activeProposer.accepts.length;
}

function chooseValue(state: PaxosState, proposerId: string) {
  const activeProposer = proposer(state, proposerId);
  state.chosenValue = activeProposer.proposedValue;
  activeProposer.chosenValue = activeProposer.proposedValue;
  state.learner.chosenValue = activeProposer.proposedValue;
  state.learner.acceptedCounts[activeProposer.proposedValue] =
    activeProposer.accepts.length;
}

function rejectProposer(state: PaxosState, proposerId: string, acceptorIds: string[]) {
  const activeProposer = proposer(state, proposerId);
  for (const acceptorId of acceptorIds) {
    if (!activeProposer.rejectedBy.includes(acceptorId)) {
      activeProposer.rejectedBy.push(acceptorId);
    }
  }
}

export function buildSingleProposerSteps(
  baseState: PaxosState,
  proposerId: string,
  proposalNumber: number,
  value: string,
): PaxosStep[] {
  const state = clonePaxosState(baseState);
  const activeProposer = proposer(state, proposerId);
  activeProposer.proposalNumber = proposalNumber;
  activeProposer.proposedValue = value;
  activeProposer.promises = [];
  activeProposer.accepts = [];
  activeProposer.rejectedBy = [];

  const steps: PaxosStep[] = [];
  const quorum = ["A1", "A2", "A3"];
  const allAcceptors = state.acceptors.map((item) => item.id);

  state.activeMessages = messages(proposerId, allAcceptors, "prepare", proposalNumber);
  pushStep(steps, state, {
    operation: "propose",
    activeProposerId: proposerId,
    activeAcceptorIds: allAcceptors,
    title: `${proposerId} sends Prepare(n=${proposalNumber})`,
    explanation:
      "proposer はまず proposal number を acceptor に送り、自分より低い番号を受け付けない promise を求めます。",
    mode: "prepare",
  });

  promiseToProposer(state, proposerId, quorum);
  state.activeMessages = messages("Acceptor", quorum, "promise", proposalNumber);
  pushStep(steps, state, {
    operation: "propose",
    activeProposerId: proposerId,
    activeAcceptorIds: quorum,
    title: "Majority of promises",
    explanation:
      "3/5 の acceptor が promise を返しました。quorum に届いたので accept phase に進めます。",
    mode: "promise",
  });

  state.activeMessages = messages(
    proposerId,
    quorum,
    "accept-request",
    proposalNumber,
    value,
  );
  pushStep(steps, state, {
    operation: "propose",
    activeProposerId: proposerId,
    activeAcceptorIds: quorum,
    title: `${proposerId} asks acceptors to accept ${value}`,
    explanation:
      "promise を得た quorum に対して、同じ proposal number と値を accept するよう依頼します。",
    mode: "accept-request",
  });

  acceptValue(state, proposerId, quorum);
  state.activeMessages = messages("Acceptor", quorum, "accepted", proposalNumber, value);
  pushStep(steps, state, {
    operation: "propose",
    activeProposerId: proposerId,
    activeAcceptorIds: quorum,
    title: "Accepted by a majority",
    explanation:
      "acceptor の過半数が同じ proposal/value を accepted にしました。learner は chosen と判断できます。",
    mode: "accepted",
  });

  chooseValue(state, proposerId);
  state.activeMessages = [];
  pushStep(steps, state, {
    operation: "propose",
    activeProposerId: proposerId,
    activeAcceptorIds: quorum,
    title: `Value ${value} is chosen`,
    explanation:
      "一度 quorum で値が chosen になると、以後の proposal は安全性を保つためにこの値を引き継ぐ必要があります。",
    mode: "chosen",
  });

  return steps;
}

export function buildMessageLossSteps(): PaxosStep[] {
  const state = createInitialPaxosState();
  const steps: PaxosStep[] = [];
  const delivered = ["A1", "A2", "A3"];
  const dropped = ["A4", "A5"];

  state.activeMessages = messages("P1", ["A1", "A2", "A3", "A4", "A5"], "prepare", 1, undefined, dropped);
  pushStep(steps, state, {
    operation: "message-loss",
    activeProposerId: "P1",
    activeAcceptorIds: ["A1", "A2", "A3", "A4", "A5"],
    title: "Prepare messages with loss",
    explanation:
      "A4/A5 への prepare は失われます。ただし Paxos は全員の応答ではなく quorum を待ちます。",
    mode: "message-loss",
  });

  promiseToProposer(state, "P1", delivered);
  state.activeMessages = messages("Acceptor", delivered, "promise", 1);
  pushStep(steps, state, {
    operation: "message-loss",
    activeProposerId: "P1",
    activeAcceptorIds: delivered,
    title: "Promises still reach quorum",
    explanation:
      "A1/A2/A3 から promise が返ったため、メッセージロスがあっても accept phase に進めます。",
    mode: "promise",
  });

  state.activeMessages = messages("P1", delivered, "accept-request", 1, "A");
  pushStep(steps, state, {
    operation: "message-loss",
    activeProposerId: "P1",
    activeAcceptorIds: delivered,
    title: "Accept request to reachable quorum",
    explanation:
      "到達できている quorum に accept request を送ります。Paxos は一部ノード故障や遅延を許容します。",
    mode: "accept-request",
  });

  acceptValue(state, "P1", delivered);
  chooseValue(state, "P1");
  state.activeMessages = messages("Acceptor", delivered, "accepted", 1, "A");
  pushStep(steps, state, {
    operation: "message-loss",
    activeProposerId: "P1",
    activeAcceptorIds: delivered,
    title: "Chosen despite message loss",
    explanation:
      "accepted が quorum に届いたため、A4/A5 が参加していなくても値 A は chosen になります。",
    mode: "chosen",
  });

  return steps;
}

export function buildCompetingProposersSteps(): PaxosStep[] {
  const state = createInitialPaxosState();
  const steps: PaxosStep[] = [];

  state.activeMessages = messages("P1", ["A1", "A2", "A3"], "prepare", 1);
  promiseToProposer(state, "P1", ["A1", "A2", "A3"]);
  pushStep(steps, state, {
    operation: "conflict",
    activeProposerId: "P1",
    activeAcceptorIds: ["A1", "A2", "A3"],
    title: "P1 gets promises for n=1",
    explanation: "P1 は A1/A2/A3 から promise を得ていますが、まだ値は chosen ではありません。",
    mode: "promise",
  });

  state.activeMessages = messages("P2", ["A2", "A3", "A4", "A5"], "prepare", 2);
  promiseToProposer(state, "P2", ["A2", "A3", "A4", "A5"]);
  pushStep(steps, state, {
    operation: "conflict",
    activeProposerId: "P2",
    activeAcceptorIds: ["A2", "A3", "A4", "A5"],
    title: "P2 preempts with higher n=2",
    explanation:
      "A2/A3 は n=2 を promise したため、以後 n=1 の accept request は拒否します。",
    mode: "prepare",
  });

  rejectProposer(state, "P1", ["A2", "A3"]);
  state.activeMessages = messages("A2/A3", ["P1"], "reject", 1);
  pushStep(steps, state, {
    operation: "conflict",
    activeProposerId: "P1",
    activeAcceptorIds: ["A2", "A3"],
    title: "P1 is rejected",
    explanation:
      "低い proposal number の accept request は reject されます。競合時は番号の大きい proposer が先に進みます。",
    mode: "reject",
    rejected: true,
  });

  state.activeMessages = messages("P2", ["A2", "A3", "A4"], "accept-request", 2, "B");
  pushStep(steps, state, {
    operation: "conflict",
    activeProposerId: "P2",
    activeAcceptorIds: ["A2", "A3", "A4"],
    title: "P2 sends AcceptRequest(B)",
    explanation: "P2 は quorum に対して値 B の accept request を送ります。",
    mode: "accept-request",
  });

  acceptValue(state, "P2", ["A2", "A3", "A4"]);
  chooseValue(state, "P2");
  state.activeMessages = messages("Acceptor", ["A2", "A3", "A4"], "accepted", 2, "B");
  pushStep(steps, state, {
    operation: "conflict",
    activeProposerId: "P2",
    activeAcceptorIds: ["A2", "A3", "A4"],
    title: "B is chosen",
    explanation:
      "P2 の proposal/value が quorum に accepted され、値 B が chosen になりました。",
    mode: "chosen",
  });

  return steps;
}

export function buildPreserveAcceptedValueSteps(): PaxosStep[] {
  const state = createInitialPaxosState();
  const steps: PaxosStep[] = [];
  const p2 = proposer(state, "P2");
  p2.proposedValue = "B";

  for (const id of ["A1", "A2"]) {
    const current = acceptor(state, id);
    current.promisedProposal = 1;
    current.acceptedProposal = 1;
    current.acceptedValue = "A";
  }
  state.learner.acceptedCounts.A = 2;

  state.activeMessages = messages("P2", ["A1", "A2", "A3"], "prepare", 2);
  pushStep(steps, state, {
    operation: "preserve",
    activeProposerId: "P2",
    activeAcceptorIds: ["A1", "A2", "A3"],
    title: "P2 starts with value B",
    explanation:
      "A1/A2 は過去に A を accepted 済みです。新しい proposer は promise の返答からその事実を知ります。",
    mode: "prepare",
  });

  promiseToProposer(state, "P2", ["A1", "A2", "A3"]);
  state.activeMessages = [
    {
      id: "promise-A1-P2-2",
      from: "A1",
      to: "P2",
      type: "promise",
      proposalNumber: 2,
      carriesAcceptedProposal: 1,
      carriesAcceptedValue: "A",
    },
    {
      id: "promise-A2-P2-2",
      from: "A2",
      to: "P2",
      type: "promise",
      proposalNumber: 2,
      carriesAcceptedProposal: 1,
      carriesAcceptedValue: "A",
    },
    {
      id: "promise-A3-P2-2",
      from: "A3",
      to: "P2",
      type: "promise",
      proposalNumber: 2,
    },
  ];
  pushStep(steps, state, {
    operation: "preserve",
    activeProposerId: "P2",
    activeAcceptorIds: ["A1", "A2", "A3"],
    title: "Promises carry accepted value A",
    explanation:
      "promise には過去に accepted した proposal/value が含まれます。P2 は最も番号の大きい accepted value を採用します。",
    mode: "promise",
  });

  p2.proposedValue = "A";
  state.activeMessages = [];
  pushStep(steps, state, {
    operation: "preserve",
    activeProposerId: "P2",
    activeAcceptorIds: ["A1", "A2"],
    title: "P2 adopts A",
    explanation:
      "P2 は自分の希望値 B を捨て、過去に accepted された A を引き継ぎます。これが Paxos の safety の核です。",
    mode: "adopt-value",
  });

  state.activeMessages = messages("P2", ["A1", "A2", "A3"], "accept-request", 2, "A");
  pushStep(steps, state, {
    operation: "preserve",
    activeProposerId: "P2",
    activeAcceptorIds: ["A1", "A2", "A3"],
    title: "P2 asks acceptors to accept A",
    explanation:
      "高い proposal number で進む場合でも、選びうる値は promise で観測した accepted value に制約されます。",
    mode: "accept-request",
  });

  acceptValue(state, "P2", ["A1", "A2", "A3"]);
  chooseValue(state, "P2");
  state.activeMessages = messages("Acceptor", ["A1", "A2", "A3"], "accepted", 2, "A");
  pushStep(steps, state, {
    operation: "preserve",
    activeProposerId: "P2",
    activeAcceptorIds: ["A1", "A2", "A3"],
    title: "A is chosen safely",
    explanation:
      "P2 が A を引き継いだため、過去に chosen だった可能性のある値と矛盾しません。",
    mode: "chosen",
  });

  return steps;
}

export function buildRetryAfterRejectSteps(): PaxosStep[] {
  const state = createInitialPaxosState();
  const steps: PaxosStep[] = [];

  for (const id of ["A1", "A2", "A3"]) {
    acceptor(state, id).promisedProposal = 2;
  }

  state.activeMessages = messages("P1", ["A1", "A2", "A3"], "prepare", 1);
  rejectProposer(state, "P1", ["A1", "A2", "A3"]);
  pushStep(steps, state, {
    operation: "recover",
    activeProposerId: "P1",
    activeAcceptorIds: ["A1", "A2", "A3"],
    title: "P1 is rejected for n=1",
    explanation:
      "A1/A2/A3 はすでに n=2 を promise 済みなので、P1 の n=1 prepare は拒否されます。",
    mode: "reject",
    rejected: true,
  });

  const p1 = proposer(state, "P1");
  p1.proposalNumber = 3;
  p1.promises = [];
  p1.accepts = [];
  p1.rejectedBy = [];
  state.activeMessages = messages("P1", ["A1", "A2", "A3"], "prepare", 3);
  pushStep(steps, state, {
    operation: "recover",
    activeProposerId: "P1",
    activeAcceptorIds: ["A1", "A2", "A3"],
    title: "P1 retries with n=3",
    explanation:
      "proposer はより大きな proposal number を選んで prepare を再送します。",
    mode: "retry",
  });

  promiseToProposer(state, "P1", ["A1", "A2", "A3"]);
  state.activeMessages = messages("Acceptor", ["A1", "A2", "A3"], "promise", 3);
  pushStep(steps, state, {
    operation: "recover",
    activeProposerId: "P1",
    activeAcceptorIds: ["A1", "A2", "A3"],
    title: "Retry reaches quorum",
    explanation:
      "n=3 は既存 promise より大きいため、A1/A2/A3 は新しい promise を返します。",
    mode: "promise",
  });

  state.activeMessages = messages("P1", ["A1", "A2", "A3"], "accept-request", 3, "A");
  pushStep(steps, state, {
    operation: "recover",
    activeProposerId: "P1",
    activeAcceptorIds: ["A1", "A2", "A3"],
    title: "P1 sends AcceptRequest(A)",
    explanation:
      "quorum を得た proposal number で accept request を送ると、前回の拒否から回復できます。",
    mode: "accept-request",
  });

  acceptValue(state, "P1", ["A1", "A2", "A3"]);
  chooseValue(state, "P1");
  state.activeMessages = messages("Acceptor", ["A1", "A2", "A3"], "accepted", 3, "A");
  pushStep(steps, state, {
    operation: "recover",
    activeProposerId: "P1",
    activeAcceptorIds: ["A1", "A2", "A3"],
    title: "A is chosen after retry",
    explanation:
      "P1 はより大きな proposal number で quorum を取り直し、値 A を chosen にできました。",
    mode: "chosen",
  });

  return steps;
}
