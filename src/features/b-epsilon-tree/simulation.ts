import {
  BEpsilonMessage,
  BEpsilonNode,
  BEpsilonOperation,
  BEpsilonScenario,
  BEpsilonState,
  BEpsilonStep,
  BEpsilonStepHighlights,
  BEpsilonStepMetrics,
} from "./types";

export function cloneBEpsilonState(state: BEpsilonState): BEpsilonState {
  return {
    ...state,
    root: cloneNode(state.root),
  };
}

function cloneNode(node: BEpsilonNode): BEpsilonNode {
  return {
    ...node,
    keys: [...node.keys],
    records: [...node.records],
    buffer: node.buffer.map((message) => ({ ...message })),
    children: node.children.map(cloneNode),
  };
}

export function createSeededBEpsilonState(): BEpsilonState {
  return {
    epsilon: 0.5,
    fanout: 3,
    bufferCapacity: 3,
    maxRecordsPerLeaf: 3,
    maxKeysPerInternal: 2,
    nextNodeId: 4,
    nextMessageSequence: 1,
    flushCount: 0,
    root: {
      id: "n0",
      keys: [30, 60],
      isLeaf: false,
      records: [],
      buffer: [],
      children: [
        {
          id: "n1",
          keys: [],
          isLeaf: true,
          records: [10, 20],
          buffer: [],
          children: [],
        },
        {
          id: "n2",
          keys: [],
          isLeaf: true,
          records: [35, 45],
          buffer: [],
          children: [],
        },
        {
          id: "n3",
          keys: [],
          isLeaf: true,
          records: [70, 80],
          buffer: [],
          children: [],
        },
      ],
    },
  };
}

export function createBufferedBEpsilonState(): BEpsilonState {
  const state = createSeededBEpsilonState();
  state.root.buffer = [
    { id: "m1", type: "insert", key: 25, sequence: 1 },
    { id: "m2", type: "insert", key: 42, sequence: 2 },
  ];
  state.nextMessageSequence = 3;
  return state;
}

export function createLeafBufferedBEpsilonState(): BEpsilonState {
  const state = createSeededBEpsilonState();
  state.root.children[1].buffer = [
    { id: "m1", type: "insert", key: 42, sequence: 1 },
    { id: "m2", type: "delete", key: 45, sequence: 2 },
  ];
  state.nextMessageSequence = 3;
  state.flushCount = 1;
  return state;
}

export function createLeafOverflowBEpsilonState(): BEpsilonState {
  const state = createSeededBEpsilonState();
  state.root.children[0].buffer = [
    { id: "m1", type: "insert", key: 25, sequence: 1 },
    { id: "m2", type: "insert", key: 28, sequence: 2 },
  ];
  state.nextMessageSequence = 3;
  state.flushCount = 1;
  return state;
}

export function getBEpsilonMetrics(state: BEpsilonState): BEpsilonStepMetrics {
  const nodes = collectNodes(state.root);
  return {
    height: getHeight(state.root),
    nodeCount: nodes.length,
    recordCount: nodes.reduce((sum, node) => sum + node.records.length, 0),
    bufferedMessageCount: nodes.reduce(
      (sum, node) => sum + node.buffer.length,
      0,
    ),
    flushCount: state.flushCount,
  };
}

export function collectNodes(root: BEpsilonNode): BEpsilonNode[] {
  const nodes: BEpsilonNode[] = [];

  function visit(node: BEpsilonNode) {
    nodes.push(node);
    node.children.forEach(visit);
  }

  visit(root);
  return nodes;
}

function getHeight(node: BEpsilonNode): number {
  if (node.children.length === 0) {
    return 1;
  }

  return 1 + Math.max(...node.children.map(getHeight));
}

function makeMessage(
  state: BEpsilonState,
  type: BEpsilonMessage["type"],
  key: number,
): BEpsilonMessage {
  const sequence = state.nextMessageSequence;
  state.nextMessageSequence += 1;
  return {
    id: `m${sequence}`,
    type,
    key,
    sequence,
  };
}

function makeNodeId(state: BEpsilonState): string {
  const id = `n${state.nextNodeId}`;
  state.nextNodeId += 1;
  return id;
}

function pushStep(
  steps: BEpsilonStep[],
  state: BEpsilonState,
  operation: BEpsilonOperation,
  title: string,
  explanation: string,
  highlights: BEpsilonStepHighlights,
) {
  steps.push({
    id: `${operation}-${steps.length}`,
    operation,
    title,
    explanation,
    bepsilonState: cloneBEpsilonState(state),
    highlights,
    metrics: getBEpsilonMetrics(state),
  });
}

function chooseChildIndex(node: BEpsilonNode, key: number): number {
  let index = 0;
  while (index < node.keys.length && key >= node.keys[index]) {
    index += 1;
  }
  return index;
}

function findFirstBufferedNode(node: BEpsilonNode): BEpsilonNode | undefined {
  if (node.buffer.length > 0) {
    return node;
  }

  for (const child of node.children) {
    const found = findFirstBufferedNode(child);
    if (found) {
      return found;
    }
  }

  return undefined;
}

function findNodePath(
  node: BEpsilonNode,
  nodeId: string,
  path: BEpsilonNode[] = [],
): BEpsilonNode[] | undefined {
  const nextPath = [...path, node];
  if (node.id === nodeId) {
    return nextPath;
  }

  for (const child of node.children) {
    const found = findNodePath(child, nodeId, nextPath);
    if (found) {
      return found;
    }
  }

  return undefined;
}

function applyLeafBuffer(node: BEpsilonNode) {
  const messages = [...node.buffer].sort((a, b) => a.sequence - b.sequence);

  for (const message of messages) {
    if (message.type === "insert" && !node.records.includes(message.key)) {
      node.records.push(message.key);
    }

    if (message.type === "delete") {
      node.records = node.records.filter((record) => record !== message.key);
    }
  }

  node.records.sort((a, b) => a - b);
  node.buffer = [];
}

function partitionMessages(
  messages: BEpsilonMessage[],
  separator: number,
): [BEpsilonMessage[], BEpsilonMessage[]] {
  const left: BEpsilonMessage[] = [];
  const right: BEpsilonMessage[] = [];

  for (const message of messages) {
    if (message.key < separator) {
      left.push(message);
    } else {
      right.push(message);
    }
  }

  return [left, right];
}

function splitLeafIfNeeded(
  state: BEpsilonState,
  leaf: BEpsilonNode,
  steps: BEpsilonStep[],
) {
  if (leaf.records.length <= state.maxRecordsPerLeaf) {
    return;
  }

  const path = findNodePath(state.root, leaf.id) ?? [leaf];
  const parent = path[path.length - 2];
  const splitIndex = Math.ceil(leaf.records.length / 2);
  const rightRecords = leaf.records.slice(splitIndex);
  const separator = rightRecords[0];
  const sibling: BEpsilonNode = {
    id: makeNodeId(state),
    keys: [],
    isLeaf: true,
    records: rightRecords,
    buffer: [],
    children: [],
  };
  leaf.records = leaf.records.slice(0, splitIndex);

  if (!parent) {
    const newRoot: BEpsilonNode = {
      id: makeNodeId(state),
      keys: [separator],
      isLeaf: false,
      records: [],
      buffer: [],
      children: [leaf, sibling],
    };
    state.root = newRoot;
    pushStep(
      steps,
      state,
      "flush",
      "Root leaf split",
      `葉 root が record capacity を超えたため、separator ${separator} を持つ新しい root を作ります。`,
      {
        activeNodeId: newRoot.id,
        targetChildId: sibling.id,
        pathNodeIds: [newRoot.id, leaf.id, sibling.id],
        mode: "root-split",
      },
    );
    return;
  }

  const childIndex = parent.children.findIndex((child) => child.id === leaf.id);
  parent.keys.splice(childIndex, 0, separator);
  parent.children.splice(childIndex + 1, 0, sibling);
  pushStep(
    steps,
    state,
    "flush",
    "Leaf split",
    `葉 ${leaf.id} が record capacity を超えたため、右葉 ${sibling.id} を作り、separator ${separator} を親へ追加します。`,
    {
      activeNodeId: leaf.id,
      targetChildId: sibling.id,
      activeKey: separator,
      pathNodeIds: [...path.map((node) => node.id), sibling.id],
      mode: "split-leaf",
    },
  );

  splitInternalIfNeeded(state, parent, steps);
}

function splitInternalIfNeeded(
  state: BEpsilonState,
  node: BEpsilonNode,
  steps: BEpsilonStep[],
) {
  if (node.keys.length <= state.maxKeysPerInternal) {
    return;
  }

  const path = findNodePath(state.root, node.id) ?? [node];
  const parent = path[path.length - 2];
  const midIndex = Math.floor(node.keys.length / 2);
  const promotedKey = node.keys[midIndex];
  const sibling: BEpsilonNode = {
    id: makeNodeId(state),
    keys: node.keys.slice(midIndex + 1),
    isLeaf: false,
    records: [],
    buffer: [],
    children: node.children.slice(midIndex + 1),
  };
  const [leftBuffer, rightBuffer] = partitionMessages(node.buffer, promotedKey);
  node.keys = node.keys.slice(0, midIndex);
  node.children = node.children.slice(0, midIndex + 1);
  node.buffer = leftBuffer;
  sibling.buffer = rightBuffer;

  if (!parent) {
    const newRoot: BEpsilonNode = {
      id: makeNodeId(state),
      keys: [promotedKey],
      isLeaf: false,
      records: [],
      buffer: [],
      children: [node, sibling],
    };
    state.root = newRoot;
    pushStep(
      steps,
      state,
      "flush",
      "Root split creates middle level",
      `内部 root が separator capacity を超えたため、${promotedKey} を新しい root へ昇格し、中間ノード ${node.id} と ${sibling.id} に分けます。`,
      {
        activeNodeId: newRoot.id,
        targetChildId: sibling.id,
        activeKey: promotedKey,
        pathNodeIds: [newRoot.id, node.id, sibling.id],
        mode: "root-split",
      },
    );
    return;
  }

  const childIndex = parent.children.findIndex((child) => child.id === node.id);
  parent.keys.splice(childIndex, 0, promotedKey);
  parent.children.splice(childIndex + 1, 0, sibling);
  pushStep(
    steps,
    state,
    "flush",
    "Internal split",
    `内部ノード ${node.id} が separator capacity を超えたため、${promotedKey} を親へ昇格し、右側を ${sibling.id} に分けます。`,
    {
      activeNodeId: node.id,
      targetChildId: sibling.id,
      activeKey: promotedKey,
      pathNodeIds: [...path.map((pathNode) => pathNode.id), sibling.id],
      mode: "split-internal",
    },
  );

  splitInternalIfNeeded(state, parent, steps);
}

function flushNodeBuffer(
  state: BEpsilonState,
  node: BEpsilonNode,
  pathNodeIds: string[],
  steps: BEpsilonStep[],
  reason: string,
) {
  if (node.buffer.length === 0) {
    pushStep(
      steps,
      state,
      "flush",
      "Flush skipped",
      "選択したノードのバッファは空なので、下位ノードへ送る更新メッセージはありません。",
      {
        activeNodeId: node.id,
        pathNodeIds,
        mode: "miss",
      },
    );
    return;
  }

  if (node.isLeaf) {
    const activeMessageId = node.buffer[0]?.id;
    applyLeafBuffer(node);
    state.flushCount += 1;
    pushStep(
      steps,
      state,
      "flush",
      "Apply leaf buffer",
      `${reason} 葉ノードの buffer に溜まった insert/delete メッセージを実データへ反映します。`,
      {
        activeNodeId: node.id,
        activeMessageId,
        pathNodeIds,
        mode: "apply",
      },
    );
    splitLeafIfNeeded(state, node, steps);
    return;
  }

  const messages = [...node.buffer];
  const batches = new Map<number, BEpsilonMessage[]>();
  for (const message of messages) {
    const childIndex = chooseChildIndex(node, message.key);
    batches.set(childIndex, [...(batches.get(childIndex) ?? []), message]);
  }

  pushStep(
    steps,
    state,
    "flush",
    "Partition buffer by child range",
    `${reason} separator key を使って、buffer 内のメッセージを送る child ごとに仕分けします。`,
    {
      activeNodeId: node.id,
      activeMessageId: messages[0]?.id,
      pathNodeIds,
      mode: "partition",
    },
  );

  node.buffer = [];
  for (const [childIndex, batch] of [...batches.entries()].sort(
    ([left], [right]) => left - right,
  )) {
    const child = node.children[childIndex];
    child.buffer.push(...batch);
    state.flushCount += 1;
    pushStep(
      steps,
      state,
      "flush",
      `Flush to ${child.id}`,
      `child ${child.id} の key range に属する ${batch.length} 件のメッセージをまとめて下へ移動します。`,
      {
        activeNodeId: node.id,
        targetChildId: child.id,
        activeMessageId: batch[0]?.id,
        pathNodeIds: [...pathNodeIds, child.id],
        mode: "flush",
      },
    );

    if (child.buffer.length >= state.bufferCapacity) {
      flushNodeBuffer(
        state,
        child,
        [...pathNodeIds, child.id],
        steps,
        "child buffer が容量に達したため、続けて flush します。",
      );
    }
  }
}

export function buildInsertSteps(
  baseState: BEpsilonState,
  key: number,
): BEpsilonStep[] {
  const state = cloneBEpsilonState(baseState);
  state.activeKey = key;
  const steps: BEpsilonStep[] = [];
  const message = makeMessage(state, "insert", key);
  state.activeMessageId = message.id;

  pushStep(
    steps,
    state,
    "insert",
    "Create insert message",
    `key ${key} をすぐ葉へ書かず、まず insert message として扱います。`,
    {
      activeNodeId: state.root.id,
      activeMessageId: message.id,
      activeKey: key,
      pathNodeIds: [state.root.id],
      mode: "create-message",
    },
  );

  state.root.buffer.push(message);
  pushStep(
    steps,
    state,
    "insert",
    "Append to root buffer",
    "Bε tree では更新を内部ノードの buffer に貯め、ランダム書き込みを遅延させます。",
    {
      activeNodeId: state.root.id,
      activeMessageId: message.id,
      activeKey: key,
      pathNodeIds: [state.root.id],
      mode: "buffer-insert",
    },
  );

  if (state.root.buffer.length >= state.bufferCapacity) {
    flushNodeBuffer(
      state,
      state.root,
      [state.root.id],
      steps,
      "root buffer が容量に達したため、batch flush を開始します。",
    );
  }

  return steps;
}

export function buildDeleteSteps(
  baseState: BEpsilonState,
  key: number,
): BEpsilonStep[] {
  const state = cloneBEpsilonState(baseState);
  state.activeKey = key;
  const steps: BEpsilonStep[] = [];
  const message = makeMessage(state, "delete", key);
  state.activeMessageId = message.id;

  pushStep(
    steps,
    state,
    "delete",
    "Create tombstone message",
    `key ${key} を即時削除せず、delete tombstone として root buffer に追加します。`,
    {
      activeNodeId: state.root.id,
      activeMessageId: message.id,
      activeKey: key,
      pathNodeIds: [state.root.id],
      mode: "tombstone",
    },
  );

  state.root.buffer.push(message);
  pushStep(
    steps,
    state,
    "delete",
    "Append tombstone to buffer",
    "削除も insert と同じくメッセージ化され、flush されたタイミングで葉の実データへ反映されます。",
    {
      activeNodeId: state.root.id,
      activeMessageId: message.id,
      activeKey: key,
      pathNodeIds: [state.root.id],
      mode: "buffer-insert",
    },
  );

  if (state.root.buffer.length >= state.bufferCapacity) {
    flushNodeBuffer(
      state,
      state.root,
      [state.root.id],
      steps,
      "root buffer が容量に達したため、delete message もまとめて下へ送ります。",
    );
  }

  return steps;
}

export function buildFlushSteps(baseState: BEpsilonState): BEpsilonStep[] {
  const state = cloneBEpsilonState(baseState);
  const steps: BEpsilonStep[] = [];
  const node = findFirstBufferedNode(state.root);

  if (!node) {
    pushStep(
      steps,
      state,
      "flush",
      "No buffered messages",
      "どのノードにも保留中のメッセージがないため、flush する対象はありません。",
      {
        activeNodeId: state.root.id,
        pathNodeIds: [state.root.id],
        mode: "miss",
      },
    );
    return steps;
  }

  const path = findNodePath(state.root, node.id) ?? [state.root];
  flushNodeBuffer(
    state,
    node,
    path.map((pathNode) => pathNode.id),
    steps,
    "手動 flush により、最初に見つかった非空 buffer を処理します。",
  );
  return steps;
}

function newestMessageForKey(
  node: BEpsilonNode,
  key: number,
): BEpsilonMessage | undefined {
  return [...node.buffer]
    .filter((message) => message.key === key)
    .sort((a, b) => b.sequence - a.sequence)[0];
}

export function buildSearchSteps(
  baseState: BEpsilonState,
  key: number,
): BEpsilonStep[] {
  const state = cloneBEpsilonState(baseState);
  state.activeKey = key;
  const steps: BEpsilonStep[] = [];
  const pathNodeIds: string[] = [];
  let node: BEpsilonNode | undefined = state.root;

  while (node) {
    pathNodeIds.push(node.id);
    const bufferedMessage = newestMessageForKey(node, key);
    pushStep(
      steps,
      state,
      "search",
      `Check buffer at ${node.id}`,
      `node ${node.id} の buffer を確認します。Bε tree では葉の record より新しい更新が buffer に残っている可能性があります。`,
      {
        activeNodeId: node.id,
        activeMessageId: bufferedMessage?.id,
        activeKey: key,
        pathNodeIds: [...pathNodeIds],
        mode: "search-buffer",
      },
    );

    if (bufferedMessage) {
      pushStep(
        steps,
        state,
        "search",
        bufferedMessage.type === "delete"
          ? "Found tombstone"
          : "Found pending insert",
        bufferedMessage.type === "delete"
          ? `key ${key} の delete tombstone が見つかったため、葉に古い record があっても削除済みとして扱います。`
          : `key ${key} の insert message が buffer に残っているため、まだ葉に反映前でも存在すると判断できます。`,
        {
          activeNodeId: node.id,
          activeMessageId: bufferedMessage.id,
          activeKey: key,
          pathNodeIds: [...pathNodeIds],
          mode: bufferedMessage.type === "delete" ? "tombstone" : "found",
        },
      );
      return steps;
    }

    if (node.isLeaf) {
      const found = node.records.includes(key);
      pushStep(
        steps,
        state,
        "search",
        found ? "Found in leaf records" : "Not found",
        found
          ? `buffer に新しい更新はなく、葉ノードの record に key ${key} が見つかりました。`
          : `buffer と葉ノードの record のどちらにも key ${key} は見つかりませんでした。`,
        {
          activeNodeId: node.id,
          activeKey: key,
          pathNodeIds: [...pathNodeIds],
          mode: found ? "found" : "miss",
        },
      );
      return steps;
    }

    const childIndex = chooseChildIndex(node, key);
    node = node.children[childIndex];
  }

  return steps;
}

export function buildBEpsilonScenario(
  id: string,
  title: string,
  description: string,
  baseState: BEpsilonState,
  operation:
    | { type: "insert"; key: number }
    | { type: "delete"; key: number }
    | { type: "search"; key: number }
    | { type: "flush" },
): BEpsilonScenario {
  const steps =
    operation.type === "insert"
      ? buildInsertSteps(baseState, operation.key)
      : operation.type === "delete"
      ? buildDeleteSteps(baseState, operation.key)
      : operation.type === "search"
      ? buildSearchSteps(baseState, operation.key)
      : buildFlushSteps(baseState);

  return {
    id,
    title,
    description,
    baseState: cloneBEpsilonState(baseState),
    finalState:
      steps[steps.length - 1]?.bepsilonState ?? cloneBEpsilonState(baseState),
    steps,
  };
}
