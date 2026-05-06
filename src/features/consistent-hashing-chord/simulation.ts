import {
  ChordFingerEntry,
  ChordNode,
  ChordResource,
  ChordScenario,
  ChordState,
  ChordStep,
  ChordStepHighlights,
} from "./types";

const RING_BITS = 5;
const RING_SIZE = 2 ** RING_BITS;
const NODE_COLORS = [
  "#d56934",
  "#2f7f75",
  "#6b5bd2",
  "#cc9a28",
  "#d14c71",
  "#3f6ed9",
];

export interface ChordNodeSpec {
  id: string;
  hash: number;
}

function normalizeHash(value: number, ringSize = RING_SIZE) {
  return ((value % ringSize) + ringSize) % ringSize;
}

function hashString(value: string, ringSize = RING_SIZE) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % ringSize;
  }

  return normalizeHash(hash, ringSize);
}

export function hashChordResourceId(id: string, ringSize = RING_SIZE) {
  return hashString(id, ringSize);
}

function sortNodes(nodes: ChordNode[]) {
  return [...nodes].sort((left, right) => left.hash - right.hash);
}

function buildLookupPath(pathNodeIds: string[]) {
  return pathNodeIds.length > 0 ? pathNodeIds.join(" -> ") : "-";
}

function createMetrics(chordState: ChordState, hopCount: number) {
  return {
    nodeCount: chordState.nodes.length,
    resourceCount: chordState.resources.length,
    hopCount,
    lookupPath: buildLookupPath(chordState.pathNodeIds),
  };
}

function createStep(
  id: string,
  chordState: ChordState,
  highlights: ChordStepHighlights,
  explanation: string,
  title: string,
  hopCount: number,
): ChordStep {
  return {
    id,
    operation: "lookup-resource",
    title,
    explanation,
    chordState,
    highlights,
    metrics: createMetrics(chordState, hopCount),
  };
}

function getSuccessorByHash(nodes: ChordNode[], hash: number) {
  const sorted = sortNodes(nodes);

  for (const node of sorted) {
    if (node.hash >= hash) {
      return node;
    }
  }

  return sorted[0];
}

function isInOpenClosedInterval(
  value: number,
  startExclusive: number,
  endInclusive: number,
  ringSize = RING_SIZE,
) {
  const normalizedValue = normalizeHash(value, ringSize);
  const normalizedStart = normalizeHash(startExclusive, ringSize);
  const normalizedEnd = normalizeHash(endInclusive, ringSize);

  if (normalizedStart < normalizedEnd) {
    return normalizedValue > normalizedStart && normalizedValue <= normalizedEnd;
  }

  if (normalizedStart > normalizedEnd) {
    return normalizedValue > normalizedStart || normalizedValue <= normalizedEnd;
  }

  return true;
}

function isInOpenOpenInterval(
  value: number,
  startExclusive: number,
  endExclusive: number,
  ringSize = RING_SIZE,
) {
  const normalizedValue = normalizeHash(value, ringSize);
  const normalizedStart = normalizeHash(startExclusive, ringSize);
  const normalizedEnd = normalizeHash(endExclusive, ringSize);

  if (normalizedStart < normalizedEnd) {
    return normalizedValue > normalizedStart && normalizedValue < normalizedEnd;
  }

  if (normalizedStart > normalizedEnd) {
    return normalizedValue > normalizedStart || normalizedValue < normalizedEnd;
  }

  return normalizedValue !== normalizedStart;
}

function buildFingerTable(
  node: ChordNode,
  nodes: ChordNode[],
  ringBits = RING_BITS,
  ringSize = RING_SIZE,
): ChordFingerEntry[] {
  return Array.from({ length: ringBits }, (_, index) => {
    const fingerIndex = index + 1;
    const start = normalizeHash(node.hash + 2 ** index, ringSize);
    const intervalEnd = normalizeHash(node.hash + 2 ** fingerIndex, ringSize);
    const successor = getSuccessorByHash(nodes, start);

    return {
      index: fingerIndex,
      start,
      intervalEnd,
      successorNodeId: successor.id,
      successorHash: successor.hash,
    };
  });
}

function assignResources(resourceIds: string[], nodes: ChordNode[]) {
  return resourceIds.map((id) => {
    const hash = hashChordResourceId(id);
    const owner = getSuccessorByHash(nodes, hash);

    return {
      id,
      hash,
      ownerNodeId: owner.id,
    };
  });
}

export function cloneChordState(chordState: ChordState): ChordState {
  return {
    ringBits: chordState.ringBits,
    ringSize: chordState.ringSize,
    nodes: chordState.nodes.map((node) => ({
      ...node,
      fingerTable: node.fingerTable.map((entry) => ({ ...entry })),
    })),
    resources: chordState.resources.map((resource) => ({ ...resource })),
    activeResource: chordState.activeResource ? { ...chordState.activeResource } : undefined,
    currentNodeId: chordState.currentNodeId,
    activeHop: chordState.activeHop ? { ...chordState.activeHop } : undefined,
    pathNodeIds: [...chordState.pathNodeIds],
  };
}

export function createChordState(
  nodeSpecs: ChordNodeSpec[],
  resourceIds: string[],
): ChordState {
  const nodesWithoutLinks = sortNodes(
    nodeSpecs.map((spec, index) => ({
      id: spec.id,
      hash: normalizeHash(spec.hash),
      color: NODE_COLORS[index % NODE_COLORS.length],
      predecessorId: spec.id,
      successorId: spec.id,
      fingerTable: [],
    })),
  );

  const nodes = nodesWithoutLinks.map((node, index, allNodes) => ({
    ...node,
    predecessorId: allNodes[(index - 1 + allNodes.length) % allNodes.length].id,
    successorId: allNodes[(index + 1) % allNodes.length].id,
  }));

  const linkedNodes = nodes.map((node) => ({
    ...node,
    fingerTable: buildFingerTable(node, nodes),
  }));

  return {
    ringBits: RING_BITS,
    ringSize: RING_SIZE,
    nodes: linkedNodes,
    resources: assignResources(resourceIds, linkedNodes),
    pathNodeIds: [],
  };
}

function getNodeById(nodes: ChordNode[], nodeId: string) {
  return nodes.find((node) => node.id === nodeId);
}

function getPredecessorNode(nodes: ChordNode[], node: ChordNode) {
  return getNodeById(nodes, node.predecessorId) ?? node;
}

function isResponsibleNode(nodes: ChordNode[], node: ChordNode, targetHash: number) {
  if (nodes.length <= 1) {
    return true;
  }

  const predecessor = getPredecessorNode(nodes, node);
  return isInOpenClosedInterval(targetHash, predecessor.hash, node.hash);
}

function findClosestPrecedingFinger(node: ChordNode, targetHash: number) {
  for (const finger of [...node.fingerTable].sort((left, right) => right.index - left.index)) {
    if (
      finger.successorNodeId !== node.id &&
      isInOpenOpenInterval(finger.successorHash, node.hash, targetHash)
    ) {
      return finger;
    }
  }

  return undefined;
}

export function buildChordLookupSteps(
  baseState: ChordState,
  resourceId: string,
  startNodeId: string,
): ChordStep[] {
  const workingState = cloneChordState(baseState);
  const resourceHash = hashChordResourceId(resourceId, workingState.ringSize);
  const startNode = getNodeById(workingState.nodes, startNodeId) ?? workingState.nodes[0];
  const steps: ChordStep[] = [];

  workingState.activeResource = {
    id: resourceId,
    hash: resourceHash,
    ownerNodeId: getSuccessorByHash(workingState.nodes, resourceHash)?.id ?? "",
  };
  workingState.currentNodeId = startNode?.id;
  workingState.pathNodeIds = startNode ? [startNode.id] : [];

  steps.push(
    createStep(
      `lookup-${resourceId}-hash`,
      cloneChordState(workingState),
      {
        activeNodeId: startNode?.id,
        activeResourceId: resourceId,
        activeResourceHash: resourceHash,
        mode: "hash",
      },
      `リソース ${resourceId} を位置 ${resourceHash} に写像します。ここから開始ノードのフィンガーテーブルを使って担当ノードへ近づきます。`,
      "リソース位置を求める",
      0,
    ),
  );

  if (!startNode) {
    steps.push(
      createStep(
        `lookup-${resourceId}-miss`,
        cloneChordState(workingState),
        {
          activeResourceId: resourceId,
          activeResourceHash: resourceHash,
          mode: "miss",
        },
        "Chord リング上にノードがないため、探索を開始できません。",
        "ノードが存在しない",
        0,
      ),
    );

    return steps;
  }

  let currentNode = startNode;
  let hopCount = 0;

  for (let guard = 0; guard < workingState.nodes.length + 2; guard += 1) {
    const scanState = cloneChordState(workingState);
    scanState.currentNodeId = currentNode.id;
    scanState.pathNodeIds = [...workingState.pathNodeIds];

    steps.push(
      createStep(
        `lookup-${resourceId}-scan-${currentNode.id}`,
        scanState,
        {
          activeNodeId: currentNode.id,
          activeResourceId: resourceId,
          activeResourceHash: resourceHash,
          mode: "scan",
        },
        `ノード ${currentNode.id} (${currentNode.hash}) のフィンガーテーブルを見て、目標 ${resourceHash} より手前で最も遠くまで進める候補を探します。`,
        "フィンガーテーブルを確認",
        hopCount,
      ),
    );

    if (isResponsibleNode(workingState.nodes, currentNode, resourceHash)) {
      const responsibleState = cloneChordState(workingState);
      responsibleState.currentNodeId = currentNode.id;

      steps.push(
        createStep(
          `lookup-${resourceId}-responsible-${currentNode.id}`,
          responsibleState,
          {
            activeNodeId: currentNode.id,
            activeResourceId: resourceId,
            activeResourceHash: resourceHash,
            mode: "responsible",
          },
          `ノード ${currentNode.id} は、前任ノードから自分までの区間を担当しています。位置 ${resourceHash} はその範囲に含まれるので、このノードが責任を持ちます。`,
          "担当区間に到達",
          hopCount,
        ),
      );

      const assignedState = cloneChordState(responsibleState);
      assignedState.activeResource = {
        id: resourceId,
        hash: resourceHash,
        ownerNodeId: currentNode.id,
      };

      steps.push(
        createStep(
          `lookup-${resourceId}-assign-${currentNode.id}`,
          assignedState,
          {
            activeNodeId: currentNode.id,
            activeResourceId: resourceId,
            activeResourceHash: resourceHash,
            mode: "assign",
          },
          `最終的にノード ${currentNode.id} がリソース ${resourceId} の担当先です。Chord ではこのようにフィンガーテーブルを使って対数的に近づきます。`,
          "担当ノードを決定",
          hopCount,
        ),
      );

      return steps;
    }

    const chosenFinger = findClosestPrecedingFinger(currentNode, resourceHash);
    const nextNode =
      (chosenFinger && getNodeById(workingState.nodes, chosenFinger.successorNodeId)) ??
      getNodeById(workingState.nodes, currentNode.successorId) ??
      currentNode;
    const nextPath = [...workingState.pathNodeIds, nextNode.id];
    const willWrap = nextNode.hash <= currentNode.hash;
    const hopState = cloneChordState(workingState);
    hopState.currentNodeId = nextNode.id;
    hopState.pathNodeIds = nextPath;
    hopState.activeHop = {
      fromNodeId: currentNode.id,
      toNodeId: nextNode.id,
      viaFingerIndex: chosenFinger?.index,
    };

    hopCount += 1;

    steps.push(
      createStep(
        `lookup-${resourceId}-hop-${currentNode.id}-${nextNode.id}`,
        hopState,
        {
          activeNodeId: currentNode.id,
          nextNodeId: nextNode.id,
          activeFingerIndex: chosenFinger?.index,
          activeResourceId: resourceId,
          activeResourceHash: resourceHash,
          mode: willWrap ? "wrap" : "hop",
        },
        chosenFinger
          ? `finger[${chosenFinger.index}] は開始位置 ${chosenFinger.start} を担当するノード ${nextNode.id} を指しています。ここへジャンプして探索を続けます。`
          : `目標より手前にある finger が見つからないので、後継ノード ${nextNode.id} へ 1 歩進みます。`,
        willWrap ? "リング先頭側へ回り込む" : "フィンガーテーブルでジャンプ",
        hopCount,
      ),
    );

    workingState.currentNodeId = nextNode.id;
    workingState.pathNodeIds = nextPath;
    workingState.activeHop = {
      fromNodeId: currentNode.id,
      toNodeId: nextNode.id,
      viaFingerIndex: chosenFinger?.index,
    };
    currentNode = nextNode;
  }

  return steps;
}

export function buildChordScenario(
  id: string,
  title: string,
  description: string,
  nodeSpecs: ChordNodeSpec[],
  resourceIds: string[],
  operation: {
    type: "lookup-resource";
    resourceId: string;
    startNodeId: string;
  },
): ChordScenario {
  const baseState = createChordState(nodeSpecs, resourceIds);
  const steps = buildChordLookupSteps(baseState, operation.resourceId, operation.startNodeId);
  const finalState = steps[steps.length - 1]?.chordState ?? baseState;

  return {
    id,
    title,
    description,
    baseState,
    finalState: cloneChordState(finalState),
    steps: steps.map((step, index) => ({
      ...step,
      id: `${id}-${index}`,
      chordState: cloneChordState(step.chordState),
    })),
  };
}
