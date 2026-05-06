import {
  BTreeNode,
  BTreeScenario,
  BTreeState,
  BTreeStep,
  BTreeStepHighlights,
} from "./types";

const MIN_DEGREE = 2;
const MAX_KEYS_PER_NODE = 2 * MIN_DEGREE - 1;

function cloneNode(node: BTreeNode): BTreeNode {
  return {
    id: node.id,
    keys: [...node.keys],
    children: node.children.map(cloneNode),
    isLeaf: node.isLeaf,
  };
}

export function cloneBTreeState(state: BTreeState): BTreeState {
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

function countNodes(node?: BTreeNode): number {
  if (!node) {
    return 0;
  }

  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

function treeHeight(node?: BTreeNode): number {
  if (!node) {
    return 0;
  }

  if (node.isLeaf || node.children.length === 0) {
    return 1;
  }

  return 1 + Math.max(...node.children.map(treeHeight));
}

function createMetrics(state: BTreeState, comparisons: number) {
  return {
    height: treeHeight(state.root),
    nodeCount: countNodes(state.root),
    comparisons,
  };
}

function createStep(
  id: string,
  operation: BTreeStep["operation"],
  state: BTreeState,
  highlights: BTreeStepHighlights,
  explanation: string,
  title: string,
  comparisons: number,
): BTreeStep {
  return {
    id,
    operation,
    title,
    explanation,
    btreeState: cloneBTreeState(state),
    highlights,
    metrics: createMetrics(state, comparisons),
  };
}

function allocateNodeId(state: BTreeState) {
  const id = `node-${state.nextNodeId}`;
  state.nextNodeId += 1;
  return id;
}

function createNode(state: BTreeState, keys: number[], isLeaf: boolean): BTreeNode {
  return {
    id: allocateNodeId(state),
    keys: [...keys],
    children: [],
    isLeaf,
  };
}

export function createEmptyBTreeState(): BTreeState {
  return {
    minDegree: MIN_DEGREE,
    maxKeysPerNode: MAX_KEYS_PER_NODE,
    nextNodeId: 1,
    sourceKeys: [],
  };
}

function splitChildRaw(state: BTreeState, parent: BTreeNode, childIndex: number) {
  const t = state.minDegree;
  const child = parent.children[childIndex];
  const sibling = createNode(state, child.keys.slice(t), child.isLeaf);
  const promotedKey = child.keys[t - 1];

  if (!child.isLeaf) {
    sibling.children = child.children.slice(t);
    child.children = child.children.slice(0, t);
  }

  child.keys = child.keys.slice(0, t - 1);
  parent.keys.splice(childIndex, 0, promotedKey);
  parent.children.splice(childIndex + 1, 0, sibling);

  return { promotedKey, leftChildId: child.id, rightChildId: sibling.id };
}

function insertNonFullRaw(state: BTreeState, node: BTreeNode, key: number) {
  if (node.isLeaf) {
    let insertIndex = node.keys.length - 1;
    while (insertIndex >= 0 && key < node.keys[insertIndex]) {
      insertIndex -= 1;
    }
    node.keys.splice(insertIndex + 1, 0, key);
    return;
  }

  let childIndex = node.keys.length;
  while (childIndex > 0 && key < node.keys[childIndex - 1]) {
    childIndex -= 1;
  }

  if (node.children[childIndex].keys.length === state.maxKeysPerNode) {
    splitChildRaw(state, node, childIndex);
    if (key > node.keys[childIndex]) {
      childIndex += 1;
    }
  }

  insertNonFullRaw(state, node.children[childIndex], key);
}

function insertKeyWithoutSteps(state: BTreeState, key: number) {
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

export function createBTreeStateFromKeys(keys: number[]) {
  const state = createEmptyBTreeState();
  for (const key of keys) {
    insertKeyWithoutSteps(state, key);
  }
  return state;
}

function collectKeysFromNode(node?: BTreeNode): number[] {
  if (!node) {
    return [];
  }

  const childKeys = node.children.flatMap((child) => collectKeysFromNode(child));
  return [...node.keys, ...childKeys];
}

export function extractBTreeSourceKeys(state: BTreeState): number[] {
  return state.sourceKeys ? [...state.sourceKeys] : collectKeysFromNode(state.root);
}

function removeKeyOnce(keys: number[] | undefined, key: number): number[] {
  const nextKeys = [...(keys ?? [])];
  const index = nextKeys.indexOf(key);
  if (index >= 0) {
    nextKeys.splice(index, 1);
  }
  return nextKeys;
}

function pushStep(
  steps: BTreeStep[],
  state: BTreeState,
  operation: BTreeStep["operation"],
  suffix: string,
  highlights: BTreeStepHighlights,
  explanation: string,
  title: string,
  comparisons: number,
) {
  steps.push(
    createStep(suffix, operation, state, highlights, explanation, title, comparisons),
  );
}

export function buildSearchSteps(baseState: BTreeState, key: number): BTreeStep[] {
  const state = cloneBTreeState(baseState);
  const steps: BTreeStep[] = [];
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
      `B ツリーが空なので、キー ${key} は見つかりません。`,
      "空の木を検索",
      comparisons,
    );
    return steps;
  }

  function searchNode(node: BTreeNode, pathNodeIds: string[]): boolean {
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
        `ノード ${node.id} のキー ${node.keys[index]} と ${key} を比較します。`,
        "ノード内を走査",
        comparisons,
      );

      if (key === node.keys[index]) {
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
          `キー ${key} がノード ${node.id} で見つかりました。`,
          "キーを発見",
          comparisons,
        );
        return true;
      }

      if (key < node.keys[index]) {
        if (node.isLeaf) {
          pushStep(
            steps,
            state,
            "search",
            `search-${key}-${node.id}-miss-left`,
            {
              activeNodeId: node.id,
              activeKeyIndex: index,
              pathNodeIds,
              mode: "miss",
            },
            `キー ${key} は ${node.keys[index]} より小さいですが、このノードは葉なので見つかりません。`,
            "葉で探索失敗",
            comparisons,
          );
          return false;
        }

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
          `キー ${key} は ${node.keys[index]} より小さいので、左側の子ノードへ降ります。`,
          "子ノードへ降下",
          comparisons,
        );
        return searchNode(node.children[index], [...pathNodeIds, node.children[index].id]);
      }
    }

    if (node.isLeaf) {
      pushStep(
        steps,
        state,
        "search",
        `search-${key}-${node.id}-miss-right`,
        {
          activeNodeId: node.id,
          pathNodeIds,
          mode: "miss",
        },
        `ノード ${node.id} のすべてのキーを見ても ${key} はありません。葉なので探索終了です。`,
        "探索失敗",
        comparisons,
      );
      return false;
    }

    const lastChild = node.children[node.keys.length];
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
      `キー ${key} はノード ${node.id} の全キーより大きいので、右端の子ノードへ降ります。`,
      "右端の子へ降下",
      comparisons,
    );
    return searchNode(lastChild, [...pathNodeIds, lastChild.id]);
  }

  searchNode(state.root, [state.root.id]);
  return steps;
}

function insertNonFullWithSteps(
  state: BTreeState,
  node: BTreeNode,
  key: number,
  pathNodeIds: string[],
  steps: BTreeStep[],
  comparisonsRef: { value: number },
) {
  if (node.isLeaf) {
    let insertIndex = node.keys.length;

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

      if (key < node.keys[index]) {
        insertIndex = index;
        break;
      }

      insertIndex = index + 1;
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
        mode: "insert",
      },
      `キー ${key} を葉ノード ${node.id} に挿入しました。葉まで到達したら、その場で順序を保って追加します。`,
      "葉ノードへ挿入",
      comparisonsRef.value,
    );
    return;
  }

  let childIndex = node.keys.length;

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
      `内部ノード ${node.id} でキー ${node.keys[index]} と ${key} を比較し、どの子へ降りるかを決めます。`,
      "内部ノードを走査",
      comparisonsRef.value,
    );

    if (key < node.keys[index]) {
      childIndex = index;
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
    `キー ${key} は子ノード ${child.id} の部分木へ入るので、そこへ降ります。`,
    "子ノードへ降下",
    comparisonsRef.value,
  );

  if (child.keys.length === state.maxKeysPerNode) {
    const { promotedKey, leftChildId, rightChildId } = splitChildRaw(state, node, childIndex);
    pushStep(
      steps,
      state,
      "insert",
      `insert-${key}-${node.id}-split-${childIndex}`,
      {
        activeNodeId: node.id,
        pathNodeIds,
        promotedKey,
        mode: "split",
      },
      `子ノード ${leftChildId} が満杯なので分割し、中央値 ${promotedKey} を親ノード ${node.id} に昇格させます。新しい右兄弟は ${rightChildId} です。`,
      "満杯の子を分割",
      comparisonsRef.value,
    );

    if (key > node.keys[childIndex]) {
      childIndex += 1;
    }
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

export function buildInsertSteps(baseState: BTreeState, key: number): BTreeStep[] {
  const state = cloneBTreeState(baseState);
  const steps: BTreeStep[] = [];
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
        mode: "insert",
      },
      `木が空だったので、キー ${key} を持つ根ノードを新しく作ります。`,
      "最初の根を作成",
      comparisons.value,
    );
    return steps;
  }

  if (state.root.keys.length === state.maxKeysPerNode) {
    const oldRoot = state.root;
    const newRoot = createNode(state, [], false);
    newRoot.children = [oldRoot];
    state.root = newRoot;
    const { promotedKey } = splitChildRaw(state, newRoot, 0);
    pushStep(
      steps,
      state,
      "insert",
      `insert-${key}-root-split`,
      {
        activeNodeId: newRoot.id,
        pathNodeIds: [newRoot.id],
        promotedKey,
        mode: "root-split",
      },
      `根ノードが満杯だったので分割し、新しい根を作って中央値 ${promotedKey} を 1 段上へ押し上げます。`,
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
  baseState: BTreeState,
  startKey: number,
  endKey: number,
): BTreeStep[] {
  const state = cloneBTreeState(baseState);
  const steps: BTreeStep[] = [];
  let comparisons = 0;
  let stopped = false;

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
      `B ツリーが空なので、範囲 ${startKey}..${endKey} の結果は空です。`,
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
    `範囲 ${startKey}..${endKey} を読むため、開始位置の近くから順序に沿ってキーをたどります。`,
    "範囲走査を開始",
    comparisons,
  );

  function visitNode(node: BTreeNode, pathNodeIds: string[]) {
    for (let index = 0; index < node.keys.length; index += 1) {
      const key = node.keys[index];

      if (!node.isLeaf && startKey <= key) {
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
          `キー ${key} の左側の部分木にも範囲内の値があり得るので、子ノード ${child.id} を先に読みます。`,
          "左側の部分木へ進む",
          comparisons,
        );
        visitNode(child, [...pathNodeIds, child.id]);
        if (stopped) {
          return;
        }
      }

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
          mode: "range-scan",
        },
        `ノード ${node.id} のキー ${key} が範囲 ${startKey}..${endKey} に入るか確認します。`,
        "キーを範囲判定",
        comparisons,
      );

      if (key < startKey) {
        continue;
      }

      if (key > endKey) {
        stopped = true;
        pushStep(
          steps,
          state,
          "range-scan",
          `range-${startKey}-${endKey}-${node.id}-stop-${index}`,
          {
            activeNodeId: node.id,
            activeKeyIndex: index,
            pathNodeIds,
            mode: "range-stop",
          },
          `キー ${key} が終了キー ${endKey} を超えたので、範囲走査を止めます。`,
          "範囲外で停止",
          comparisons,
        );
        return;
      }

      state.collectedKeys = [...(state.collectedKeys ?? []), key];
      pushStep(
        steps,
        state,
        "range-scan",
        `range-${startKey}-${endKey}-${node.id}-collect-${index}`,
        {
          activeNodeId: node.id,
          activeKeyIndex: index,
          pathNodeIds,
          mode: "collect",
        },
        `キー ${key} は範囲内なので結果セットへ追加します。`,
        "キーを回収",
        comparisons,
      );
    }

    if (!node.isLeaf && !stopped) {
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
        `ノード ${node.id} の右端の部分木にも続きのキーがあるため、子ノード ${child.id} を読みます。`,
        "右端の部分木へ進む",
        comparisons,
      );
      visitNode(child, [...pathNodeIds, child.id]);
    }
  }

  visitNode(state.root, [state.root.id]);

  pushStep(
    steps,
    state,
    "range-scan",
    `range-${startKey}-${endKey}-done`,
    {
      activeNodeId: steps[steps.length - 1]?.highlights.activeNodeId,
      pathNodeIds: steps[steps.length - 1]?.highlights.pathNodeIds ?? [],
      mode: "range-done",
    },
    `範囲走査が完了しました。結果は [${state.collectedKeys.join(", ")}] です。実装によってはリーフ間の sibling pointer で隣接ノードへ進みます。`,
    "範囲走査完了",
    comparisons,
  );

  return steps;
}

export function buildDeleteSteps(baseState: BTreeState, key: number): BTreeStep[] {
  const state = cloneBTreeState(baseState);
  const steps: BTreeStep[] = [];
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
      `B ツリーが空なので、キー ${key} は削除できません。`,
      "空の木から削除",
      comparisons,
    );
    return steps;
  }

  const rootId = state.root.id;

  function deleteFromNode(node: BTreeNode, pathNodeIds: string[]): boolean {
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
        `ノード ${node.id} のキー ${node.keys[index]} と削除対象 ${key} を比較します。`,
        "削除対象を探す",
        comparisons,
      );

      if (key === node.keys[index]) {
        if (!node.isLeaf) {
          pushStep(
            steps,
            state,
            "delete",
            `delete-${key}-${node.id}-internal`,
            {
              activeNodeId: node.id,
              activeKeyIndex: index,
              pathNodeIds,
              mode: "internal-delete",
            },
            `キー ${key} は内部ノード ${node.id} にあります。内部ノード削除では前後のキーとの入れ替えや再調整が必要なので、今回の MVP では状態を変更しません。`,
            "内部ノード削除は未対応",
            comparisons,
          );
          return false;
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
            `葉ノード ${node.id} から ${key} を削除すると最小キー数を下回ります。借用またはマージが必要なので、今回の MVP では状態を変更しません。`,
            "Underflow は未対応",
            comparisons,
          );
          return false;
        }

        node.keys.splice(index, 1);
        state.sourceKeys = removeKeyOnce(state.sourceKeys, key);
        pushStep(
          steps,
          state,
          "delete",
          `delete-${key}-${node.id}-commit`,
          {
            activeNodeId: node.id,
            activeKeyIndex: Math.min(index, Math.max(node.keys.length - 1, 0)),
            pathNodeIds,
            mode: "delete",
          },
          `キー ${key} を葉ノード ${node.id} から削除しました。今回は underflow が起きない葉削除だけを扱います。`,
          "葉からキーを削除",
          comparisons,
        );
        return true;
      }

      if (key < node.keys[index]) {
        if (node.isLeaf) {
          pushStep(
            steps,
            state,
            "delete",
            `delete-${key}-${node.id}-miss-left`,
            {
              activeNodeId: node.id,
              activeKeyIndex: index,
              pathNodeIds,
              mode: "miss",
            },
            `キー ${key} は ${node.keys[index]} より小さいですが、この葉には存在しないため削除できません。`,
            "削除対象なし",
            comparisons,
          );
          return false;
        }

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
          `削除対象 ${key} は左側の子ノード ${child.id} にある可能性があるため、そこへ降ります。`,
          "子ノードへ降下",
          comparisons,
        );
        return deleteFromNode(child, [...pathNodeIds, child.id]);
      }
    }

    if (node.isLeaf) {
      pushStep(
        steps,
        state,
        "delete",
        `delete-${key}-${node.id}-miss-right`,
        {
          activeNodeId: node.id,
          pathNodeIds,
          mode: "miss",
        },
        `葉ノード ${node.id} のすべてのキーを見ても ${key} はないため、削除できません。`,
        "削除対象なし",
        comparisons,
      );
      return false;
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
      `削除対象 ${key} は右端の子ノード ${child.id} にある可能性があるため、そこへ降ります。`,
      "右端の子へ降下",
      comparisons,
    );
    return deleteFromNode(child, [...pathNodeIds, child.id]);
  }

  deleteFromNode(state.root, [state.root.id]);
  return steps;
}

export function buildBTreeScenario(
  id: string,
  title: string,
  description: string,
  baseKeys: number[],
  operation:
    | { type: "insert"; key: number }
    | { type: "search"; key: number }
    | { type: "delete"; key: number }
    | { type: "range-scan"; startKey: number; endKey: number },
): BTreeScenario {
  const baseState = createBTreeStateFromKeys(baseKeys);
  const steps =
    operation.type === "insert"
      ? buildInsertSteps(baseState, operation.key)
      : operation.type === "search"
        ? buildSearchSteps(baseState, operation.key)
        : operation.type === "delete"
          ? buildDeleteSteps(baseState, operation.key)
          : buildRangeScanSteps(baseState, operation.startKey, operation.endKey);
  const finalState = steps[steps.length - 1]?.btreeState ?? baseState;

  return {
    id,
    title,
    description,
    baseState,
    finalState: cloneBTreeState(finalState),
    steps: steps.map((step, index) => ({
      ...step,
      id: `${id}-${index}`,
      btreeState: cloneBTreeState(step.btreeState),
    })),
  };
}
