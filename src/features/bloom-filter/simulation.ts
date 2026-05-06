import {
  BloomHashResult,
  BloomScenario,
  BloomState,
  BloomStep,
  BloomStepHighlights,
} from "./types";

const BIT_COUNT = 16;
const HASH_COUNT = 2;

function hash1(value: string, bitCount = BIT_COUNT) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % bitCount;
  }

  return hash;
}

function hash2(value: string, bitCount = BIT_COUNT) {
  let hash = 7;

  for (const char of value) {
    hash = (hash * 17 + char.charCodeAt(0)) % bitCount;
  }

  return hash;
}

export function getBloomHashes(value: string, bitCount = BIT_COUNT): BloomHashResult[] {
  return [
    { label: "h1", index: hash1(value, bitCount) },
    { label: "h2", index: hash2(value, bitCount) },
  ];
}

function createMetrics(state: BloomState, falsePositiveHint: string) {
  const setBitCount = state.bits.filter(Boolean).length;

  return {
    itemCount: state.items.length,
    setBitCount,
    loadFactor: setBitCount / state.bitCount,
    falsePositiveHint,
  };
}

function createStep(
  id: string,
  operation: BloomStep["operation"],
  bloomState: BloomState,
  highlights: BloomStepHighlights,
  explanation: string,
  title: string,
  falsePositiveHint: string,
): BloomStep {
  return {
    id,
    operation,
    title,
    explanation,
    bloomState,
    highlights,
    metrics: createMetrics(bloomState, falsePositiveHint),
  };
}

export function cloneBloomState(state: BloomState): BloomState {
  return {
    bitCount: state.bitCount,
    hashCount: state.hashCount,
    bits: [...state.bits],
    items: [...state.items],
    activeItem: state.activeItem,
    activeHashes: state.activeHashes.map((entry) => ({ ...entry })),
  };
}

export function createEmptyBloomState(): BloomState {
  return {
    bitCount: BIT_COUNT,
    hashCount: HASH_COUNT,
    bits: Array.from({ length: BIT_COUNT }, () => false),
    items: [],
    activeHashes: [],
  };
}

export function createBloomStateFromItems(items: string[]): BloomState {
  const state = createEmptyBloomState();

  for (const item of items) {
    for (const hash of getBloomHashes(item, state.bitCount)) {
      state.bits[hash.index] = true;
    }
    state.items.push(item);
  }

  return state;
}

export function buildInsertSteps(baseState: BloomState, item: string): BloomStep[] {
  const workingState = cloneBloomState(baseState);
  const hashes = getBloomHashes(item, workingState.bitCount);
  const steps: BloomStep[] = [];

  workingState.activeItem = item;
  workingState.activeHashes = hashes;

  steps.push(
    createStep(
      `insert-${item}-hash`,
      "insert",
      cloneBloomState(workingState),
      {
        activeBitIndexes: hashes.map((hash) => hash.index),
        mode: "hash",
      },
      `要素 ${item} に対して ${hashes
        .map((hash) => `${hash.label}=${hash.index}`)
        .join(", ")} を計算します。Bloom Filter ではこの複数位置だけを更新します。`,
      "ハッシュ値を計算",
      "Bloom Filter は元の要素を保持しないため、照会は確率的です。",
    ),
  );

  hashes.forEach((hash, index) => {
    const nextState = cloneBloomState(workingState);
    nextState.bits[hash.index] = true;
    if (!nextState.items.includes(item)) {
      nextState.items.push(item);
    }

    steps.push(
      createStep(
        `insert-${item}-${hash.label}`,
        "insert",
        nextState,
        {
          activeBitIndexes: [hash.index],
          activeHashIndex: index,
          mode: "set-bit",
        },
        `ハッシュ関数 ${hash.label} の結果 ${hash.index} 番目のビットを 1 にします。すでに 1 ならそのまま維持します。`,
        `${hash.label} の位置を立てる`,
        "ビットは 1 にするだけなので、別要素と衝突しても区別は付きません。",
      ),
    );

    workingState.bits = [...nextState.bits];
    workingState.items = [...nextState.items];
  });

  return steps;
}

export function buildQuerySteps(baseState: BloomState, item: string): BloomStep[] {
  const workingState = cloneBloomState(baseState);
  const hashes = getBloomHashes(item, workingState.bitCount);
  const steps: BloomStep[] = [];

  workingState.activeItem = item;
  workingState.activeHashes = hashes;

  steps.push(
    createStep(
      `query-${item}-hash`,
      "query",
      cloneBloomState(workingState),
      {
        activeBitIndexes: hashes.map((hash) => hash.index),
        mode: "hash",
      },
      `要素 ${item} の照会では ${hashes
        .map((hash) => `${hash.label}=${hash.index}`)
        .join(", ")} を確認します。全部 1 なら「たぶん存在する」、1 つでも 0 なら「絶対に存在しない」です。`,
      "照会位置を計算",
      "Bloom Filter は false positive を起こす可能性があります。",
    ),
  );

  for (const [index, hash] of hashes.entries()) {
    const bitValue = workingState.bits[hash.index];

    steps.push(
      createStep(
        `query-${item}-${hash.label}`,
        "query",
        cloneBloomState(workingState),
        {
          activeBitIndexes: [hash.index],
          activeHashIndex: index,
          mode: "check-bit",
        },
        `${hash.label} が指す ${hash.index} 番目のビットは ${bitValue ? "1" : "0"} です。`,
        `${hash.label} の位置を確認`,
        bitValue
          ? "まだ候補を否定できないので、残りのビットも確認します。"
          : "1 つでも 0 があれば、その要素は絶対に未登録です。",
      ),
    );

    if (!bitValue) {
      steps.push(
        createStep(
          `query-${item}-miss`,
          "query",
          cloneBloomState(workingState),
          {
            activeBitIndexes: [hash.index],
            activeHashIndex: index,
            mode: "miss",
          },
          `${hash.index} 番目が 0 なので、要素 ${item} は Bloom Filter に絶対に入っていません。`,
          "未登録と確定",
          "0 が見つかった時点で、残りを見なくても陰性を確定できます。",
        ),
      );

      return steps;
    }
  }

  const isActuallyStored = workingState.items.includes(item);

  steps.push(
    createStep(
      `query-${item}-result`,
      "query",
      cloneBloomState(workingState),
      {
        activeBitIndexes: hashes.map((hash) => hash.index),
        mode: isActuallyStored ? "maybe" : "false-positive",
      },
      isActuallyStored
        ? `必要なビットがすべて 1 なので、要素 ${item} は「たぶん存在する」と判定されます。今回は実際に登録済みです。`
        : `必要なビットがすべて 1 なので、要素 ${item} は「たぶん存在する」と判定されます。ただし今回は未登録で、false positive です。`,
      isActuallyStored ? "たぶん存在する" : "False positive",
      isActuallyStored
        ? "Bloom Filter 単体では真陽性と false positive を区別できません。"
        : "別要素が立てたビットだけで条件を満たすと false positive が起きます。",
    ),
  );

  return steps;
}

export function buildBloomScenario(
  id: string,
  title: string,
  description: string,
  baseItems: string[],
  operation: { type: "insert"; item: string } | { type: "query"; item: string },
): BloomScenario {
  const baseState = createBloomStateFromItems(baseItems);
  const steps =
    operation.type === "insert"
      ? buildInsertSteps(baseState, operation.item)
      : buildQuerySteps(baseState, operation.item);
  const finalState = steps[steps.length - 1]?.bloomState ?? baseState;

  return {
    id,
    title,
    description,
    baseState,
    finalState: cloneBloomState(finalState),
    steps: steps.map((step, index) => ({
      ...step,
      id: `${id}-${index}`,
      bloomState: cloneBloomState(step.bloomState),
    })),
  };
}
