import {
  RingNode,
  RingResource,
  RingScenario,
  RingState,
  RingStep,
  RingStepHighlights,
} from "./types";

const RING_SIZE = 360;
const NODE_COLORS = [
  "#d56934",
  "#2f7f75",
  "#6b5bd2",
  "#cc9a28",
  "#d14c71",
  "#3f6ed9",
];

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

export function hashNodeId(id: string, ringSize = RING_SIZE) {
  return hashString(id, ringSize);
}

export function hashResourceId(id: string, ringSize = RING_SIZE) {
  return hashString(id, ringSize);
}

function sortNodes(nodes: RingNode[]) {
  return [...nodes].sort((left, right) => left.hash - right.hash);
}

function assignResourceToNode(nodes: RingNode[], resourceHash: number) {
  const sortedNodes = sortNodes(nodes);

  for (const node of sortedNodes) {
    if (node.hash >= resourceHash) {
      return { node, wrapped: false };
    }
  }

  return sortedNodes.length > 0
    ? { node: sortedNodes[0], wrapped: true }
    : { node: undefined, wrapped: false };
}

function assignResources(resources: RingResource[], nodes: RingNode[]) {
  return resources.map((resource) => ({
    ...resource,
    assignedNodeId: assignResourceToNode(nodes, resource.hash).node?.id,
  }));
}

function movedResourcesHint(
  previousResources: RingResource[],
  nextResources: RingResource[],
) {
  const moved = nextResources.filter((resource) => {
    const previous = previousResources.find((entry) => entry.id === resource.id);
    return previous && previous.assignedNodeId !== resource.assignedNodeId;
  });

  if (moved.length === 0) {
    return "登録済みリソースの担当先は変わりません。";
  }

  return `移動したリソース: ${moved
    .map((resource) => resource.id)
    .slice(0, 4)
    .join(", ")}${moved.length > 4 ? " ..." : ""}`;
}

function createMetrics(
  ringState: RingState,
  comparisons: number,
  remappedResourcesHint: string,
) {
  return {
    nodeCount: ringState.nodes.length,
    resourceCount: ringState.resources.length,
    comparisons,
    remappedResourcesHint,
  };
}

export function cloneRingState(ringState: RingState): RingState {
  return {
    ringSize: ringState.ringSize,
    nodes: ringState.nodes.map((node) => ({ ...node })),
    resources: ringState.resources.map((resource) => ({ ...resource })),
    activeResource: ringState.activeResource
      ? { ...ringState.activeResource }
      : undefined,
  };
}

function createStep(
  id: string,
  operation: RingStep["operation"],
  ringState: RingState,
  highlights: RingStepHighlights,
  explanation: string,
  title: string,
  comparisons: number,
  remappedResourcesHint: string,
): RingStep {
  return {
    id,
    operation,
    title,
    explanation,
    ringState,
    highlights,
    metrics: createMetrics(ringState, comparisons, remappedResourcesHint),
  };
}

export function createEmptyRingState(): RingState {
  return {
    ringSize: RING_SIZE,
    nodes: [],
    resources: [],
  };
}

export function createRingStateFromNodeIds(
  nodeIds: string[],
  resourceIds: string[] = [],
): RingState {
  const nodes = sortNodes(
    nodeIds.map((id, index) => ({
      id,
      hash: hashNodeId(id),
      color: NODE_COLORS[index % NODE_COLORS.length],
    })),
  );

  const resources = assignResources(
    resourceIds.map((id) => ({
      id,
      hash: hashResourceId(id),
    })),
    nodes,
  );

  return {
    ringSize: RING_SIZE,
    nodes,
    resources,
  };
}

function describeMovedRange(
  predecessor: RingNode | undefined,
  node: RingNode,
  wrapped: boolean,
) {
  if (!predecessor) {
    return "まだノードが 1 台だけなので、すべてのリソースを担当します。";
  }

  if (wrapped || predecessor.hash > node.hash) {
    return `(${predecessor.hash}, 359] と [0, ${node.hash}] の範囲にあるリソースだけが新ノードへ移ります。`;
  }

  return `(${predecessor.hash}, ${node.hash}] の範囲にあるリソースだけが新ノードへ移ります。`;
}

export function buildLookupSteps(
  baseState: RingState,
  resourceId: string,
): RingStep[] {
  const workingState = cloneRingState(baseState);
  const resourceHash = hashResourceId(resourceId, workingState.ringSize);
  const steps: RingStep[] = [];
  let comparisons = 0;

  workingState.activeResource = { id: resourceId, hash: resourceHash };

  steps.push(
    createStep(
      `lookup-${resourceId}-hash`,
      "lookup-resource",
      cloneRingState(workingState),
      {
        activeResourceId: resourceId,
        activeResourceHash: resourceHash,
        mode: "hash",
      },
      `リソース ${resourceId} をリング上の位置 ${resourceHash} に写像します。ここから時計回りに最初のノードを探します。`,
      "リソース位置を求める",
      comparisons,
      "登録済みリソースの担当先は変わりません。",
    ),
  );

  if (workingState.nodes.length === 0) {
    steps.push(
      createStep(
        `lookup-${resourceId}-empty`,
        "lookup-resource",
        cloneRingState(workingState),
        {
          activeResourceId: resourceId,
          activeResourceHash: resourceHash,
          mode: "miss",
        },
        "リング上にノードがないので、このリソースを担当できる先はまだありません。",
        "ノードが存在しない",
        comparisons,
        "登録済みリソースの担当先は変わりません。",
      ),
    );

    return steps;
  }

  for (const node of workingState.nodes) {
    comparisons += 1;
    steps.push(
      createStep(
        `lookup-${resourceId}-scan-${node.id}`,
        "lookup-resource",
        cloneRingState(workingState),
        {
          activeNodeId: node.id,
          candidateNodeIds: [node.id],
          activeResourceId: resourceId,
          activeResourceHash: resourceHash,
          mode: "scan",
        },
        `ノード ${node.id} は位置 ${node.hash} にいます。リソース位置 ${resourceHash} 以上かどうかを確認します。`,
        "時計回りに候補を確認",
        comparisons,
        "登録済みリソースの担当先は変わりません。",
      ),
    );

    if (node.hash >= resourceHash) {
      const assignedState = cloneRingState(workingState);
      assignedState.activeResource = {
        id: resourceId,
        hash: resourceHash,
        assignedNodeId: node.id,
      };

      steps.push(
        createStep(
          `lookup-${resourceId}-assign-${node.id}`,
          "lookup-resource",
          assignedState,
          {
            activeNodeId: node.id,
            candidateNodeIds: [node.id],
            activeResourceId: resourceId,
            activeResourceHash: resourceHash,
            mode: "assign",
          },
          `時計回りで最初に見つかったノード ${node.id} が、このリソースの担当先になります。`,
          "担当ノードを決定",
          comparisons,
          "登録済みリソースの担当先は変わりません。",
        ),
      );

      return steps;
    }
  }

  const wrapNode = workingState.nodes[0];
  const wrappedState = cloneRingState(workingState);
  wrappedState.activeResource = {
    id: resourceId,
    hash: resourceHash,
    assignedNodeId: wrapNode.id,
  };

  steps.push(
    createStep(
      `lookup-${resourceId}-wrap`,
      "lookup-resource",
      wrappedState,
      {
        activeNodeId: wrapNode.id,
        candidateNodeIds: [wrapNode.id],
        activeResourceId: resourceId,
        activeResourceHash: resourceHash,
        mode: "wrap",
      },
      `リソース位置 ${resourceHash} より右にノードがなかったので、リングの先頭へ巻き戻って ${wrapNode.id} が担当します。`,
      "先頭へ巻き戻る",
      comparisons,
      "登録済みリソースの担当先は変わりません。",
    ),
  );

  return steps;
}

export function buildAddResourceSteps(
  baseState: RingState,
  resourceId: string,
): RingStep[] {
  const workingState = cloneRingState(baseState);
  const resourceHash = hashResourceId(resourceId, workingState.ringSize);
  const steps: RingStep[] = [];

  steps.push(
    createStep(
      `resource-${resourceId}-hash`,
      "add-resource",
      cloneRingState(workingState),
      {
        activeResourceId: resourceId,
        activeResourceHash: resourceHash,
        mode: "hash",
      },
      `リソース ${resourceId} を位置 ${resourceHash} に写像します。この位置から時計回りに担当ノードを決めます。`,
      "リソース位置を求める",
      0,
      "まだ担当先の変化はありません。",
    ),
  );

  if (workingState.resources.some((resource) => resource.id === resourceId)) {
    steps.push(
      createStep(
        `resource-${resourceId}-duplicate`,
        "add-resource",
        cloneRingState(workingState),
        {
          activeResourceId: resourceId,
          activeResourceHash: resourceHash,
          mode: "miss",
        },
        `リソース ${resourceId} はすでに登録済みです。重複登録は行いません。`,
        "同名リソースは登録しない",
        0,
        "登録済みリソースの担当先は変わりません。",
      ),
    );

    return steps;
  }

  const assignment = assignResourceToNode(workingState.nodes, resourceHash);
  const nextState = cloneRingState(workingState);
  const newResource: RingResource = {
    id: resourceId,
    hash: resourceHash,
    assignedNodeId: assignment.node?.id,
  };
  nextState.resources = assignResources(
    [...nextState.resources, newResource],
    nextState.nodes,
  );
  nextState.activeResource = nextState.resources.find(
    (resource) => resource.id === resourceId,
  );

  steps.push(
    createStep(
      `resource-${resourceId}-assign`,
      "add-resource",
      nextState,
      {
        activeNodeId: assignment.node?.id,
        candidateNodeIds: assignment.node ? [assignment.node.id] : [],
        activeResourceId: resourceId,
        activeResourceHash: resourceHash,
        mode: "resource",
      },
      assignment.node
        ? `リソース ${resourceId} を登録しました。位置 ${resourceHash} から時計回りに最初のノード ${assignment.node.id} が担当します。`
        : `リソース ${resourceId} を登録しましたが、リング上にノードがないので担当先はまだ未定です。`,
      "リソースを登録",
      assignment.node ? 1 : 0,
      "新しいリソースだけが追加され、既存リソースの担当先は変わりません。",
    ),
  );

  return steps;
}

export function buildAddNodeSteps(baseState: RingState, nodeId: string): RingStep[] {
  const workingState = cloneRingState(baseState);
  const nodeHash = hashNodeId(nodeId, workingState.ringSize);
  const steps: RingStep[] = [];

  steps.push(
    createStep(
      `add-${nodeId}-hash`,
      "add-node",
      cloneRingState(workingState),
      { activeResourceHash: nodeHash, mode: "hash" },
      `ノード ${nodeId} を位置 ${nodeHash} に配置します。追加で動くのは、この位置の直前からここまでの範囲にあるリソースだけです。`,
      "ノード位置を求める",
      0,
      "まだ担当先の変化はありません。",
    ),
  );

  if (workingState.nodes.some((node) => node.id === nodeId)) {
    steps.push(
      createStep(
        `add-${nodeId}-duplicate`,
        "add-node",
        cloneRingState(workingState),
        { activeNodeId: nodeId, mode: "miss" },
        `ノード ${nodeId} はすでにリング上にあります。重複追加は行いません。`,
        "同名ノードは追加しない",
        0,
        "登録済みリソースの担当先は変わりません。",
      ),
    );

    return steps;
  }

  const previousNodes = sortNodes(workingState.nodes);
  const successorInfo = assignResourceToNode(previousNodes, nodeHash);
  const successor = successorInfo.node;
  const successorIndex = successor
    ? previousNodes.findIndex((node) => node.id === successor.id)
    : -1;
  const predecessor =
    successorIndex >= 0
      ? previousNodes[(successorIndex - 1 + previousNodes.length) % previousNodes.length]
      : previousNodes[previousNodes.length - 1];

  const newNode: RingNode = {
    id: nodeId,
    hash: nodeHash,
    color: NODE_COLORS[workingState.nodes.length % NODE_COLORS.length],
  };

  const nextState = cloneRingState(workingState);
  nextState.nodes = sortNodes([...nextState.nodes, newNode]);
  nextState.resources = assignResources(nextState.resources, nextState.nodes);

  steps.push(
    createStep(
      `add-${nodeId}-insert`,
      "add-node",
      nextState,
      {
        activeNodeId: nodeId,
        candidateNodeIds: [predecessor?.id, successor?.id, nodeId].filter(
          Boolean,
        ) as string[],
        activeResourceHash: nodeHash,
        mode: "insert",
      },
      successor
        ? `ノード ${nodeId} を ${predecessor?.id ?? "ring start"} と ${successor.id} の間へ追加しました。${describeMovedRange(
            predecessor,
            newNode,
            successorInfo.wrapped,
          )}`
        : `ノード ${nodeId} が最初の 1 台として配置されました。以後すべてのリソースはこのノードに割り当てられます。`,
      "リングへノードを追加",
      successor ? 1 : 0,
      movedResourcesHint(workingState.resources, nextState.resources),
    ),
  );

  return steps;
}

export function buildRemoveNodeSteps(baseState: RingState, nodeId: string): RingStep[] {
  const workingState = cloneRingState(baseState);
  const targetIndex = workingState.nodes.findIndex((node) => node.id === nodeId);
  const steps: RingStep[] = [];

  if (targetIndex < 0) {
    steps.push(
      createStep(
        `remove-${nodeId}-miss`,
        "remove-node",
        cloneRingState(workingState),
        { mode: "miss" },
        `ノード ${nodeId} はリング上に存在しないので、削除対象がありません。`,
        "削除対象がない",
        0,
        "登録済みリソースの担当先は変わりません。",
      ),
    );

    return steps;
  }

  const targetNode = workingState.nodes[targetIndex];
  const successor =
    workingState.nodes.length > 1
      ? workingState.nodes[(targetIndex + 1) % workingState.nodes.length]
      : undefined;

  steps.push(
    createStep(
      `remove-${nodeId}-focus`,
      "remove-node",
      cloneRingState(workingState),
      {
        activeNodeId: nodeId,
        candidateNodeIds: [nodeId, successor?.id].filter(Boolean) as string[],
        activeResourceHash: targetNode.hash,
        mode: "scan",
      },
      successor
        ? `ノード ${nodeId} を削除すると、このノードが担当していたリソースだけが時計回りの次ノード ${successor.id} に移ります。`
        : `リング上にノード ${nodeId} しかないので、削除すると担当先がなくなります。`,
      "削除の影響範囲を確認",
      successor ? 1 : 0,
      successor
        ? `ノード ${nodeId} の担当リソースだけが ${successor.id} に移ります。`
        : "すべてのリソースの担当先がなくなります。",
    ),
  );

  const nextState = cloneRingState(workingState);
  nextState.nodes = nextState.nodes.filter((node) => node.id !== nodeId);
  nextState.resources = assignResources(nextState.resources, nextState.nodes);

  steps.push(
    createStep(
      `remove-${nodeId}-commit`,
      "remove-node",
      nextState,
      {
        activeNodeId: successor?.id,
        candidateNodeIds: [successor?.id].filter(Boolean) as string[],
        activeResourceHash: targetNode.hash,
        mode: "remove",
      },
      successor
        ? `ノード ${nodeId} をリングから外しました。元の担当範囲のリソースは ${successor.id} が引き継ぎます。`
        : `最後のノード ${nodeId} を削除したので、リングは空になりました。`,
      "ノードを削除",
      successor ? 1 : 0,
      movedResourcesHint(workingState.resources, nextState.resources),
    ),
  );

  return steps;
}

export function buildRingScenario(
  id: string,
  title: string,
  description: string,
  baseNodeIds: string[],
  baseResourceIds:
    | string[]
    | undefined,
  operation:
    | { type: "lookup-resource"; resourceId: string }
    | { type: "add-node"; nodeId: string }
    | { type: "remove-node"; nodeId: string }
    | { type: "add-resource"; resourceId: string },
): RingScenario {
  const baseState = createRingStateFromNodeIds(baseNodeIds, baseResourceIds ?? []);
  let steps: RingStep[];
  let finalState: RingState;

  if (operation.type === "lookup-resource") {
    steps = buildLookupSteps(baseState, operation.resourceId);
    finalState = steps[steps.length - 1]?.ringState ?? baseState;
  } else if (operation.type === "add-node") {
    steps = buildAddNodeSteps(baseState, operation.nodeId);
    finalState = steps[steps.length - 1]?.ringState ?? baseState;
  } else if (operation.type === "add-resource") {
    steps = buildAddResourceSteps(baseState, operation.resourceId);
    finalState = steps[steps.length - 1]?.ringState ?? baseState;
  } else {
    steps = buildRemoveNodeSteps(baseState, operation.nodeId);
    finalState = steps[steps.length - 1]?.ringState ?? baseState;
  }

  return {
    id,
    title,
    description,
    baseState,
    finalState: cloneRingState(finalState),
    steps: steps.map((step, index) => ({
      ...step,
      id: `${id}-${index}`,
      ringState: cloneRingState(step.ringState),
    })),
  };
}
