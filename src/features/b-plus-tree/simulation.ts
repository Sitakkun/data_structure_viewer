import {
  BPlusTreeNode,
  BPlusTreeScenario,
  BPlusTreeState,
  BPlusTreeStep,
  BPlusTreeStepHighlights,
} from "./types";

const MIN_DEGREE = 2;
const MAX_KEYS_PER_NODE = 2 * MIN_DEGREE - 1;

function cloneNode(node: BPlusTreeNode): BPlusTreeNode {
  return {
    id: node.id,
    keys: [...node.keys],
    children: node.children.map(cloneNode),
    isLeaf: node.isLeaf,
    nextLeafId: node.nextLeafId,
  };
}

export function cloneBPlusTreeState(state: BPlusTreeState): BPlusTreeState {
  return {
    minDegree: state.minDegree,
    maxKeysPerNode: state.maxKeysPerNode,
    nextNodeId: state.nextNodeId,
    root: state.root ? cloneNode(state.root) : undefined,
    activeKey: state.activeKey,
    activeRangeStart: state.activeRangeStart,
    activeRangeEnd: state.activeRangeEnd,
    collectedKeys: state.collectedKeys ? [...state.collectedKeys] : undefined,
    sourceKeys: state.sourceKeys ? [...state.sourceKeys] : undefined,
  };
}

function countNodes(node?: BPlusTreeNode): number {
  if (!node) {
    return 0;
  }

  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

function countLeaves(node?: BPlusTreeNode): number {
  if (!node) {
    return 0;
  }

  if (node.isLeaf) {
    return 1;
  }

  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

function treeHeight(node?: BPlusTreeNode): number {
  if (!node) {
    return 0;
  }

  if (node.isLeaf || node.children.length === 0) {
    return 1;
  }

  return 1 + Math.max(...node.children.map(treeHeight));
}

function createMetrics(state: BPlusTreeState, comparisons: number) {
  return {
    height: treeHeight(state.root),
    nodeCount: countNodes(state.root),
    leafCount: countLeaves(state.root),
    comparisons,
  };
}

function createStep(
  id: string,
  operation: BPlusTreeStep["operation"],
  state: BPlusTreeState,
  highlights: BPlusTreeStepHighlights,
  explanation: string,
  title: string,
  comparisons: number,
): BPlusTreeStep {
  return {
    id,
    operation,
    title,
    explanation,
    bplusTreeState: cloneBPlusTreeState(state),
    highlights,
    metrics: createMetrics(state, comparisons),
  };
}

function pushStep(
  steps: BPlusTreeStep[],
  state: BPlusTreeState,
  operation: BPlusTreeStep["operation"],
  id: string,
  highlights: BPlusTreeStepHighlights,
  explanation: string,
  title: string,
  comparisons: number,
) {
  steps.push(
    createStep(id, operation, state, highlights, explanation, title, comparisons),
  );
}

function allocateNodeId(state: BPlusTreeState) {
  const id = `node-${state.nextNodeId}`;
  state.nextNodeId += 1;
  return id;
}

function createNode(
  state: BPlusTreeState,
  keys: number[],
  isLeaf: boolean,
): BPlusTreeNode {
  return {
    id: allocateNodeId(state),
    keys: [...keys],
    children: [],
    isLeaf,
  };
}

export function createEmptyBPlusTreeState(): BPlusTreeState {
  return {
    minDegree: MIN_DEGREE,
    maxKeysPerNode: MAX_KEYS_PER_NODE,
    nextNodeId: 1,
    sourceKeys: [],
  };
}

function splitChildRaw(state: BPlusTreeState, parent: BPlusTreeNode, childIndex: number) {
  const child = parent.children[childIndex];

  if (child.isLeaf) {
    const splitIndex = Math.ceil(child.keys.length / 2);
    const sibling = createNode(state, child.keys.slice(splitIndex), true);
    child.keys = child.keys.slice(0, splitIndex);
    sibling.nextLeafId = child.nextLeafId;
    child.nextLeafId = sibling.id;

    const promotedKey = sibling.keys[0];
    parent.keys.splice(childIndex, 0, promotedKey);
    parent.children.splice(childIndex + 1, 0, sibling);

    return {
      promotedKey,
      leftChildId: child.id,
      rightChildId: sibling.id,
      mode: "split-leaf" as const,
    };
  }

  const t = state.minDegree;
  const sibling = createNode(state, child.keys.slice(t), false);
  const promotedKey = child.keys[t - 1];
  sibling.children = child.children.slice(t);
  child.children = child.children.slice(0, t);
  child.keys = child.keys.slice(0, t - 1);
  parent.keys.splice(childIndex, 0, promotedKey);
  parent.children.splice(childIndex + 1, 0, sibling);

  return {
    promotedKey,
    leftChildId: child.id,
    rightChildId: sibling.id,
    mode: "split-internal" as const,
  };
}

function chooseChildIndex(node: BPlusTreeNode, key: number) {
  let childIndex = 0;
  while (childIndex < node.keys.length && key >= node.keys[childIndex]) {
    childIndex += 1;
  }
  return childIndex;
}

function insertNonFullRaw(state: BPlusTreeState, node: BPlusTreeNode, key: number) {
  if (node.isLeaf) {
    let insertIndex = 0;
    while (insertIndex < node.keys.length && key > node.keys[insertIndex]) {
      insertIndex += 1;
    }
    node.keys.splice(insertIndex, 0, key);
    return;
  }

  let childIndex = chooseChildIndex(node, key);
  if (node.children[childIndex].keys.length === state.maxKeysPerNode) {
    splitChildRaw(state, node, childIndex);
    childIndex = chooseChildIndex(node, key);
  }
  insertNonFullRaw(state, node.children[childIndex], key);
}

function insertKeyWithoutSteps(state: BPlusTreeState, key: number) {
  state.sourceKeys = [...(state.sourceKeys ?? []), key];

  if (!state.root) {
    state.root = createNode(state, [key], true);
    return;
  }

  if (state.root.keys.length === state.maxKeysPerNode) {
    const oldRoot = state.root;
    const newRoot = createNode(state, [], false);
    newRoot.children = [oldRoot];
    state.root = newRoot;
    splitChildRaw(state, newRoot, 0);
  }

  insertNonFullRaw(state, state.root, key);
}

export function createBPlusTreeStateFromKeys(keys: number[]) {
  const state = createEmptyBPlusTreeState();
  for (const key of keys) {
    insertKeyWithoutSteps(state, key);
  }
  return state;
}

export function extractBPlusTreeSourceKeys(state: BPlusTreeState): number[] {
  if (state.sourceKeys) {
    return [...state.sourceKeys];
  }

  return collectLeaves(state.root).flatMap((leaf) => leaf.keys);
}

function removeKeyOnce(keys: number[] | undefined, key: number): number[] {
  const nextKeys = [...(keys ?? [])];
  const index = nextKeys.indexOf(key);
  if (index >= 0) {
    nextKeys.splice(index, 1);
  }
  return nextKeys;
}

export function collectLeaves(root?: BPlusTreeNode): BPlusTreeNode[] {
  if (!root) {
    return [];
  }

  if (root.isLeaf) {
    return [root];
  }

  return root.children.flatMap((child) => collectLeaves(child));
}

function firstKeyInSubtree(node: BPlusTreeNode): number | undefined {
  if (node.isLeaf) {
    return node.keys[0];
  }

  return node.children[0] ? firstKeyInSubtree(node.children[0]) : undefined;
}

function refreshSeparatorKeys(node?: BPlusTreeNode) {
  if (!node || node.isLeaf) {
    return;
  }

  for (const child of node.children) {
    refreshSeparatorKeys(child);
  }

  node.keys = node.children
    .slice(1)
    .map(firstKeyInSubtree)
    .filter((key): key is number => key !== undefined);
}

export function buildSearchSteps(baseState: BPlusTreeState, key: number): BPlusTreeStep[] {
  const state = cloneBPlusTreeState(baseState);
  const steps: BPlusTreeStep[] = [];
  let comparisons = 0;

  state.activeKey = key;
  state.activeRangeStart = undefined;
  state.activeRangeEnd = undefined;
  state.collectedKeys = undefined;

  if (!state.root) {
    pushStep(
      steps,
      state,
      "search",
      `search-${key}-empty`,
      { activeNodeId: undefined, pathNodeIds: [], mode: "miss" },
      `B+ Tree が空なので、キー ${key} は見つかりません。`,
      "空の木を検索",
      comparisons,
    );
    return steps;
  }

  function searchNode(node: BPlusTreeNode, pathNodeIds: string[]): boolean {
    for (let index = 0; index < node.keys.length; index += 1) {
      comparisons += 1;
      pushStep(
        steps,
        state,
        "search",
        `search-${key}-${node.id}-${index}`,
        {
          activeNodeId: node.id,
          activeKeyIndex: index,
          pathNodeIds,
          mode: "scan",
        },
        node.isLeaf
          ? `葉ノード ${node.id} のキー ${node.keys[index]} と ${key} を比較します。`
          : `内部ノード ${node.id} のセパレータ ${node.keys[index]} と ${key} を比較します。`,
        "ノード内を走査",
        comparisons,
      );

      if (node.isLeaf && key === node.keys[index]) {
        pushStep(
          steps,
          state,
          "search",
          `search-${key}-${node.id}-found`,
          {
            activeNodeId: node.id,
            activeKeyIndex: index,
            pathNodeIds,
            mode: "found",
          },
          `B+ Tree では実データは葉にあるので、キー ${key} が葉ノード ${node.id} で見つかって探索成功です。`,
          "葉でキーを発見",
          comparisons,
        );
        return true;
      }

      if (!node.isLeaf && key < node.keys[index]) {
        const child = node.children[index];
        pushStep(
          steps,
          state,
          "search",
          `search-${key}-${node.id}-descend-${index}`,
          {
            activeNodeId: node.id,
            activeKeyIndex: index,
            pathNodeIds,
            mode: "descend",
          },
          `キー ${key} はセパレータ ${node.keys[index]} より小さいので、左側の子ノード ${child.id} へ降ります。`,
          "子ノードへ降下",
          comparisons,
        );
        return searchNode(child, [...pathNodeIds, child.id]);
      }
    }

    if (node.isLeaf) {
      pushStep(
        steps,
        state,
        "search",
        `search-${key}-${node.id}-miss`,
        {
          activeNodeId: node.id,
          pathNodeIds,
          mode: "miss",
        },
        `葉ノード ${node.id} まで来てもキー ${key} はありません。葉にしか実データがないので探索失敗です。`,
        "葉で探索失敗",
        comparisons,
      );
      return false;
    }

    const child = node.children[node.keys.length];
    pushStep(
      steps,
      state,
      "search",
      `search-${key}-${node.id}-descend-last`,
      {
        activeNodeId: node.id,
        pathNodeIds,
        mode: "descend",
      },
      `キー ${key} はノード ${node.id} の全セパレータ以上なので、右端の子ノード ${child.id} へ降ります。`,
      "右端の子へ降下",
      comparisons,
    );
    return searchNode(child, [...pathNodeIds, child.id]);
  }

  searchNode(state.root, [state.root.id]);
  return steps;
}

function insertNonFullWithSteps(
  state: BPlusTreeState,
  node: BPlusTreeNode,
  key: number,
  pathNodeIds: string[],
  steps: BPlusTreeStep[],
  comparisonsRef: { value: number },
) {
  if (node.isLeaf) {
    let insertIndex = 0;
    for (let index = 0; index < node.keys.length; index += 1) {
      comparisonsRef.value += 1;
      pushStep(
        steps,
        state,
        "insert",
        `insert-${key}-${node.id}-scan-${index}`,
        {
          activeNodeId: node.id,
          activeKeyIndex: index,
          pathNodeIds,
          mode: "scan",
        },
        `葉ノード ${node.id} でキー ${node.keys[index]} と ${key} を比べ、挿入位置を探します。`,
        "葉ノード内を走査",
        comparisonsRef.value,
      );

      if (key > node.keys[index]) {
        insertIndex = index + 1;
      } else {
        break;
      }
    }

    node.keys.splice(insertIndex, 0, key);
    pushStep(
      steps,
      state,
      "insert",
      `insert-${key}-${node.id}-commit`,
      {
        activeNodeId: node.id,
        activeKeyIndex: insertIndex,
        pathNodeIds,
        mode: "leaf-insert",
      },
      `B+ Tree では実データは葉に置くので、キー ${key} を葉ノード ${node.id} に直接挿入します。`,
      "葉ノードへ挿入",
      comparisonsRef.value,
    );
    return;
  }

  let childIndex = 0;
  for (let index = 0; index < node.keys.length; index += 1) {
    comparisonsRef.value += 1;
    pushStep(
      steps,
      state,
      "insert",
      `insert-${key}-${node.id}-scan-${index}`,
      {
        activeNodeId: node.id,
        activeKeyIndex: index,
        pathNodeIds,
        mode: "scan",
      },
      `内部ノード ${node.id} のセパレータ ${node.keys[index]} を見て、どの葉側へ降りるかを決めます。`,
      "内部ノードを走査",
      comparisonsRef.value,
    );
    if (key >= node.keys[index]) {
      childIndex = index + 1;
    } else {
      break;
    }
  }

  let child = node.children[childIndex];
  pushStep(
    steps,
    state,
    "insert",
    `insert-${key}-${node.id}-descend-${childIndex}`,
    {
      activeNodeId: node.id,
      pathNodeIds,
      mode: "descend",
    },
    `キー ${key} は子ノード ${child.id} の部分木に入るので、そこへ降ります。`,
    "子ノードへ降下",
    comparisonsRef.value,
  );

  if (child.keys.length === state.maxKeysPerNode) {
    const split = splitChildRaw(state, node, childIndex);
    pushStep(
      steps,
      state,
      "insert",
      `insert-${key}-${node.id}-split-${childIndex}`,
      {
        activeNodeId: node.id,
        pathNodeIds,
        promotedKey: split.promotedKey,
        mode: split.mode,
      },
      split.mode === "split-leaf"
        ? `葉ノード ${split.leftChildId} が満杯なので分割し、右側の最初のキー ${split.promotedKey} を親ノード ${node.id} のセパレータとして追加します。`
        : `内部ノード ${split.leftChildId} が満杯なので分割し、中央値 ${split.promotedKey} を親ノード ${node.id} に昇格させます。`,
      split.mode === "split-leaf" ? "葉ノードを分割" : "内部ノードを分割",
      comparisonsRef.value,
    );
    childIndex = chooseChildIndex(node, key);
    child = node.children[childIndex];
  }

  insertNonFullWithSteps(
    state,
    child,
    key,
    [...pathNodeIds, child.id],
    steps,
    comparisonsRef,
  );
}

export function buildInsertSteps(baseState: BPlusTreeState, key: number): BPlusTreeStep[] {
  const state = cloneBPlusTreeState(baseState);
  const steps: BPlusTreeStep[] = [];
  const comparisons = { value: 0 };

  state.activeKey = key;
  state.activeRangeStart = undefined;
  state.activeRangeEnd = undefined;
  state.collectedKeys = undefined;
  state.sourceKeys = [...(state.sourceKeys ?? []), key];

  if (!state.root) {
    state.root = createNode(state, [key], true);
    pushStep(
      steps,
      state,
      "insert",
      `insert-${key}-root`,
      {
        activeNodeId: state.root.id,
        activeKeyIndex: 0,
        pathNodeIds: [state.root.id],
        mode: "leaf-insert",
      },
      `木が空だったので、キー ${key} を持つ葉ノードを根として新しく作ります。`,
      "最初の葉を作成",
      comparisons.value,
    );
    return steps;
  }

  if (state.root.keys.length === state.maxKeysPerNode) {
    const oldRoot = state.root;
    const newRoot = createNode(state, [], false);
    newRoot.children = [oldRoot];
    state.root = newRoot;
    const split = splitChildRaw(state, newRoot, 0);
    pushStep(
      steps,
      state,
      "insert",
      `insert-${key}-root-split`,
      {
        activeNodeId: newRoot.id,
        pathNodeIds: [newRoot.id],
        promotedKey: split.promotedKey,
        mode: "root-split",
      },
      split.mode === "split-leaf"
        ? `根が葉ノードのまま満杯だったので分割し、右側の最初のキー ${split.promotedKey} を持つ新しい内部ノードを根にします。`
        : `根が満杯だったので内部ノードとして分割し、中央値 ${split.promotedKey} を新しい根へ押し上げます。`,
      "根ノードを分割",
      comparisons.value,
    );
  }

  insertNonFullWithSteps(
    state,
    state.root,
    key,
    [state.root.id],
    steps,
    comparisons,
  );

  return steps;
}

export function buildRangeScanSteps(
  baseState: BPlusTreeState,
  startKey: number,
  endKey: number,
): BPlusTreeStep[] {
  const state = cloneBPlusTreeState(baseState);
  const steps: BPlusTreeStep[] = [];
  let comparisons = 0;

  state.activeKey = undefined;
  state.activeRangeStart = startKey;
  state.activeRangeEnd = endKey;
  state.collectedKeys = [];

  if (!state.root) {
    pushStep(
      steps,
      state,
      "range-scan",
      `range-${startKey}-${endKey}-empty`,
      { activeNodeId: undefined, pathNodeIds: [], mode: "range-done" },
      `B+ Tree が空なので、範囲 ${startKey}..${endKey} の結果は空です。`,
      "空の木を範囲走査",
      comparisons,
    );
    return steps;
  }

  pushStep(
    steps,
    state,
    "range-scan",
    `range-${startKey}-${endKey}-start`,
    {
      activeNodeId: state.root.id,
      pathNodeIds: [state.root.id],
      mode: "range-start",
    },
    `範囲 ${startKey}..${endKey} を読むため、まず開始キー ${startKey} を含む葉ノードを探します。`,
    "範囲走査を開始",
    comparisons,
  );

  function findStartLeaf(
    node: BPlusTreeNode,
    pathNodeIds: string[],
  ): { leaf: BPlusTreeNode; pathNodeIds: string[] } {
    if (node.isLeaf) {
      pushStep(
        steps,
        state,
        "range-scan",
        `range-${startKey}-${endKey}-${node.id}-leaf`,
        {
          activeNodeId: node.id,
          pathNodeIds,
          mode: "leaf-scan",
        },
        `開始位置の候補として葉ノード ${node.id} に到達しました。ここから右方向の leaf chain を読みます。`,
        "開始葉へ到達",
        comparisons,
      );
      return { leaf: node, pathNodeIds };
    }

    for (let index = 0; index < node.keys.length; index += 1) {
      comparisons += 1;
      pushStep(
        steps,
        state,
        "range-scan",
        `range-${startKey}-${endKey}-${node.id}-scan-${index}`,
        {
          activeNodeId: node.id,
          activeKeyIndex: index,
          pathNodeIds,
          mode: "range-start",
        },
        `内部ノード ${node.id} のセパレータ ${node.keys[index]} と開始キー ${startKey} を比較します。`,
        "開始キーの経路を判定",
        comparisons,
      );

      if (startKey < node.keys[index]) {
        const child = node.children[index];
        pushStep(
          steps,
          state,
          "range-scan",
          `range-${startKey}-${endKey}-${node.id}-descend-${index}`,
          {
            activeNodeId: node.id,
            activeKeyIndex: index,
            pathNodeIds,
            mode: "descend",
          },
          `開始キー ${startKey} は ${node.keys[index]} より小さいので、子ノード ${child.id} へ降ります。`,
          "開始葉へ降下",
          comparisons,
        );
        return findStartLeaf(child, [...pathNodeIds, child.id]);
      }
    }

    const child = node.children[node.keys.length];
    pushStep(
      steps,
      state,
      "range-scan",
      `range-${startKey}-${endKey}-${node.id}-descend-last`,
      {
        activeNodeId: node.id,
        pathNodeIds,
        mode: "descend",
      },
      `開始キー ${startKey} はすべてのセパレータ以上なので、右端の子ノード ${child.id} へ降ります。`,
      "右端の開始葉へ降下",
      comparisons,
    );
    return findStartLeaf(child, [...pathNodeIds, child.id]);
  }

  const { leaf: startLeaf, pathNodeIds } = findStartLeaf(state.root, [state.root.id]);
  const leaves = collectLeaves(state.root);
  let leafIndex = Math.max(
    leaves.findIndex((leaf) => leaf.id === startLeaf.id),
    0,
  );

  while (leafIndex < leaves.length) {
    const leaf = leaves[leafIndex];

    for (let keyIndex = 0; keyIndex < leaf.keys.length; keyIndex += 1) {
      const key = leaf.keys[keyIndex];
      comparisons += 1;

      if (key < startKey) {
        pushStep(
          steps,
          state,
          "range-scan",
          `range-${startKey}-${endKey}-${leaf.id}-skip-${keyIndex}`,
          {
            activeNodeId: leaf.id,
            activeKeyIndex: keyIndex,
            pathNodeIds,
            mode: "leaf-scan",
          },
          `葉ノード ${leaf.id} のキー ${key} は開始キー ${startKey} より小さいので読み飛ばします。`,
          "開始位置を探す",
          comparisons,
        );
        continue;
      }

      if (key > endKey) {
        pushStep(
          steps,
          state,
          "range-scan",
          `range-${startKey}-${endKey}-${leaf.id}-stop-${keyIndex}`,
          {
            activeNodeId: leaf.id,
            activeKeyIndex: keyIndex,
            pathNodeIds,
            mode: "range-stop",
          },
          `キー ${key} が終了キー ${endKey} を超えたので、ここで leaf chain の走査を止めます。`,
          "範囲外で停止",
          comparisons,
        );
        pushStep(
          steps,
          state,
          "range-scan",
          `range-${startKey}-${endKey}-done`,
          {
            activeNodeId: leaf.id,
            pathNodeIds,
            mode: "range-done",
          },
          `範囲走査が完了しました。結果は [${state.collectedKeys.join(", ")}] です。`,
          "範囲走査完了",
          comparisons,
        );
        return steps;
      }

      state.collectedKeys = [...(state.collectedKeys ?? []), key];
      pushStep(
        steps,
        state,
        "range-scan",
        `range-${startKey}-${endKey}-${leaf.id}-collect-${keyIndex}`,
        {
          activeNodeId: leaf.id,
          activeKeyIndex: keyIndex,
          pathNodeIds,
          collectedKeyIndices: [keyIndex],
          mode: "collect",
        },
        `キー ${key} は ${startKey}..${endKey} に含まれるので、結果セットへ追加します。`,
        "キーを回収",
        comparisons,
      );
    }

    const nextLeaf = leaves[leafIndex + 1];
    if (!nextLeaf) {
      break;
    }

    pushStep(
      steps,
      state,
      "range-scan",
      `range-${startKey}-${endKey}-${leaf.id}-hop-${nextLeaf.id}`,
      {
        activeNodeId: leaf.id,
        nextLeafId: nextLeaf.id,
        pathNodeIds,
        mode: "chain-hop",
      },
      `葉ノード ${leaf.id} を読み終えたので、next leaf をたどって ${nextLeaf.id} へ進みます。`,
      "次の葉へ移動",
      comparisons,
    );
    leafIndex += 1;
  }

  pushStep(
    steps,
    state,
    "range-scan",
    `range-${startKey}-${endKey}-done-tail`,
    {
      activeNodeId: leaves[leaves.length - 1]?.id,
      pathNodeIds,
      mode: "range-done",
    },
    `最後の葉まで読み終えました。結果は [${state.collectedKeys.join(", ")}] です。`,
    "範囲走査完了",
    comparisons,
  );

  return steps;
}

export function buildDeleteSteps(baseState: BPlusTreeState, key: number): BPlusTreeStep[] {
  const state = cloneBPlusTreeState(baseState);
  const steps: BPlusTreeStep[] = [];
  let comparisons = 0;

  state.activeKey = key;
  state.activeRangeStart = undefined;
  state.activeRangeEnd = undefined;
  state.collectedKeys = undefined;

  if (!state.root) {
    pushStep(
      steps,
      state,
      "delete",
      `delete-${key}-empty`,
      { activeNodeId: undefined, pathNodeIds: [], mode: "miss" },
      `B+ Tree が空なので、キー ${key} は削除できません。`,
      "空の木から削除",
      comparisons,
    );
    return steps;
  }

  const rootId = state.root.id;

  function deleteFromNode(node: BPlusTreeNode, pathNodeIds: string[]): boolean {
    if (node.isLeaf) {
      for (let index = 0; index < node.keys.length; index += 1) {
        comparisons += 1;
        pushStep(
          steps,
          state,
          "delete",
          `delete-${key}-${node.id}-scan-${index}`,
          {
            activeNodeId: node.id,
            activeKeyIndex: index,
            pathNodeIds,
            mode: "leaf-scan",
          },
          `葉ノード ${node.id} のキー ${node.keys[index]} と削除対象 ${key} を比較します。`,
          "葉で削除対象を探す",
          comparisons,
        );

        if (key !== node.keys[index]) {
          continue;
        }

        const minKeys = state.minDegree - 1;
        if (node.id !== rootId && node.keys.length <= minKeys) {
          pushStep(
            steps,
            state,
            "delete",
            `delete-${key}-${node.id}-underflow`,
            {
              activeNodeId: node.id,
              activeKeyIndex: index,
              pathNodeIds,
              mode: "underflow",
            },
            `葉ノード ${node.id} から ${key} を削除すると最小キー数を下回ります。leaf merge や separator 更新が必要なので、今回の MVP では状態を変更しません。`,
            "Underflow は未対応",
            comparisons,
          );
          return false;
        }

        node.keys.splice(index, 1);
        state.sourceKeys = removeKeyOnce(state.sourceKeys, key);
        refreshSeparatorKeys(state.root);
        pushStep(
          steps,
          state,
          "delete",
          `delete-${key}-${node.id}-commit`,
          {
            activeNodeId: node.id,
            activeKeyIndex: Math.min(index, Math.max(node.keys.length - 1, 0)),
            pathNodeIds,
            mode: "leaf-delete",
          },
          `キー ${key} を葉ノード ${node.id} から削除しました。必要な separator は残った葉の先頭キーに合わせて更新します。`,
          "葉からキーを削除",
          comparisons,
        );
        return true;
      }

      pushStep(
        steps,
        state,
        "delete",
        `delete-${key}-${node.id}-miss`,
        {
          activeNodeId: node.id,
          pathNodeIds,
          mode: "miss",
        },
        `葉ノード ${node.id} まで来ても ${key} はないため、削除できません。`,
        "削除対象なし",
        comparisons,
      );
      return false;
    }

    for (let index = 0; index < node.keys.length; index += 1) {
      comparisons += 1;
      pushStep(
        steps,
        state,
        "delete",
        `delete-${key}-${node.id}-scan-${index}`,
        {
          activeNodeId: node.id,
          activeKeyIndex: index,
          pathNodeIds,
          mode: "scan",
        },
        `内部ノード ${node.id} のセパレータ ${node.keys[index]} と削除対象 ${key} を比較します。`,
        "削除対象の葉を探す",
        comparisons,
      );

      if (key < node.keys[index]) {
        const child = node.children[index];
        pushStep(
          steps,
          state,
          "delete",
          `delete-${key}-${node.id}-descend-${index}`,
          {
            activeNodeId: node.id,
            activeKeyIndex: index,
            pathNodeIds,
            mode: "descend",
          },
          `削除対象 ${key} はセパレータ ${node.keys[index]} より小さいので、子ノード ${child.id} へ降ります。`,
          "削除対象の葉へ降下",
          comparisons,
        );
        return deleteFromNode(child, [...pathNodeIds, child.id]);
      }
    }

    const child = node.children[node.keys.length];
    pushStep(
      steps,
      state,
      "delete",
      `delete-${key}-${node.id}-descend-last`,
      {
        activeNodeId: node.id,
        pathNodeIds,
        mode: "descend",
      },
      `削除対象 ${key} はすべてのセパレータ以上なので、右端の子ノード ${child.id} へ降ります。`,
      "右端の葉側へ降下",
      comparisons,
    );
    return deleteFromNode(child, [...pathNodeIds, child.id]);
  }

  deleteFromNode(state.root, [state.root.id]);
  return steps;
}

export function buildBPlusTreeScenario(
  id: string,
  title: string,
  description: string,
  baseKeys: number[],
  operation:
    | { type: "insert"; key: number }
    | { type: "search"; key: number }
    | { type: "delete"; key: number }
    | { type: "range-scan"; startKey: number; endKey: number },
): BPlusTreeScenario {
  const baseState = createBPlusTreeStateFromKeys(baseKeys);
  const steps =
    operation.type === "insert"
      ? buildInsertSteps(baseState, operation.key)
      : operation.type === "search"
        ? buildSearchSteps(baseState, operation.key)
        : operation.type === "delete"
          ? buildDeleteSteps(baseState, operation.key)
          : buildRangeScanSteps(baseState, operation.startKey, operation.endKey);
  const finalState = steps[steps.length - 1]?.bplusTreeState ?? baseState;

  return {
    id,
    title,
    description,
    baseState,
    finalState: cloneBPlusTreeState(finalState),
    steps: steps.map((step, index) => ({
      ...step,
      id: `${id}-${index}`,
      bplusTreeState: cloneBPlusTreeState(step.bplusTreeState),
    })),
  };
}
