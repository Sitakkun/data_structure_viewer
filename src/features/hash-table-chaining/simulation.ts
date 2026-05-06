import { LinearSlot, OperationType, Step, StepHighlights, TableState } from "./types";

export interface OperationResult {
  finalState: TableState;
  steps: Step[];
}

const DEFAULT_BUCKET_COUNT = 7;

function isOccupiedSlot(slot: LinearSlot): slot is number {
  return typeof slot === "number";
}

export function createEmptyTable(bucketCount = DEFAULT_BUCKET_COUNT): TableState {
  return {
    bucketCount,
    strategy: "chaining",
    buckets: Array.from({ length: bucketCount }, () => []),
  };
}

export function createEmptyLinearProbingTable(
  bucketCount = DEFAULT_BUCKET_COUNT,
): TableState {
  return {
    bucketCount,
    strategy: "linear-probing",
    slots: Array.from({ length: bucketCount }, () => null),
  };
}

export function cloneTableState(tableState: TableState): TableState {
  if (tableState.strategy === "chaining") {
    return {
      bucketCount: tableState.bucketCount,
      strategy: "chaining",
      buckets: (tableState.buckets ?? []).map((bucket) => [...bucket]),
    };
  }

  return {
    bucketCount: tableState.bucketCount,
    strategy: "linear-probing",
    slots: [...(tableState.slots ?? [])],
  };
}

export function hashKey(key: number, bucketCount: number): number {
  return Math.abs(key) % bucketCount;
}

export function calculateSize(tableState: TableState): number {
  if (tableState.strategy === "chaining") {
    return (tableState.buckets ?? []).reduce(
      (total, bucket) => total + bucket.length,
      0,
    );
  }

  return (tableState.slots ?? []).reduce<number>(
    (total, slot) => total + (isOccupiedSlot(slot) ? 1 : 0),
    0,
  );
}

export function calculateTotalCollisions(tableState: TableState): number {
  if (tableState.strategy === "chaining") {
    return (tableState.buckets ?? []).reduce(
      (total, bucket) => total + Math.max(bucket.length - 1, 0),
      0,
    );
  }

  return (tableState.slots ?? []).reduce<number>((total, slot, index) => {
    if (!isOccupiedSlot(slot)) {
      return total;
    }

    return total + (hashKey(slot, tableState.bucketCount) === index ? 0 : 1);
  }, 0);
}

function buildMetrics(
  tableState: TableState,
  comparisons: number,
  operationCollisions: number,
) {
  const size = calculateSize(tableState);

  return {
    size,
    loadFactor: size / tableState.bucketCount,
    totalCollisions: calculateTotalCollisions(tableState),
    comparisons,
    operationCollisions,
  };
}

function createStep(
  id: string,
  operation: OperationType,
  key: number,
  tableState: TableState,
  hashValue: number,
  bucketIndex: number,
  highlights: StepHighlights,
  explanation: string,
  title: string,
  comparisons: number,
  operationCollisions: number,
): Step {
  return {
    id,
    operation,
    key,
    hashValue,
    bucketIndex,
    title,
    explanation,
    tableState,
    highlights,
    metrics: buildMetrics(tableState, comparisons, operationCollisions),
  };
}

export function tableFromKeys(
  keys: number[],
  bucketCount = DEFAULT_BUCKET_COUNT,
): TableState {
  const state = createEmptyTable(bucketCount);

  for (const key of keys) {
    state.buckets![hashKey(key, bucketCount)].push(key);
  }

  return state;
}

export function tableFromKeysLinearProbing(
  keys: number[],
  bucketCount = DEFAULT_BUCKET_COUNT,
): TableState {
  let state = createEmptyLinearProbingTable(bucketCount);

  for (const key of keys) {
    state = runLinearProbingOperation("insert", key, state).finalState;
  }

  return state;
}

export function runOperation(
  operation: OperationType,
  key: number,
  initialState: TableState,
): OperationResult {
  switch (operation) {
    case "insert":
      return buildInsertSteps(initialState, key);
    case "search":
      return buildSearchSteps(initialState, key);
    case "delete":
      return buildDeleteSteps(initialState, key);
  }
}

export function runLinearProbingOperation(
  operation: OperationType,
  key: number,
  initialState: TableState,
): OperationResult {
  switch (operation) {
    case "insert":
      return buildLinearInsertSteps(initialState, key);
    case "search":
      return buildLinearSearchSteps(initialState, key);
    case "delete":
      return buildLinearDeleteSteps(initialState, key);
  }
}

function buildInsertSteps(initialState: TableState, key: number): OperationResult {
  const workingState = cloneTableState(initialState);
  const bucketIndex = hashKey(key, workingState.bucketCount);
  const chain = workingState.buckets![bucketIndex];
  const steps: Step[] = [];
  const operationCollisions = chain.length > 0 ? 1 : 0;
  let comparisons = 0;
  const hashValue = bucketIndex;

  steps.push(
    createStep(
      `insert-${key}-hash`,
      "insert",
      key,
      cloneTableState(workingState),
      hashValue,
      bucketIndex,
      { activeBucketIndex: bucketIndex, mode: "hash" },
      `キー ${key} に対して h(k) = abs(${key}) mod ${workingState.bucketCount} を計算し、バケット ${bucketIndex} に向かいます。`,
      "ハッシュ値を計算",
      comparisons,
      operationCollisions,
    ),
  );

  if (chain.length > 0) {
    steps.push(
      createStep(
        `insert-${key}-collision`,
        "insert",
        key,
        cloneTableState(workingState),
        hashValue,
        bucketIndex,
        { activeBucketIndex: bucketIndex, mode: "collision" },
        `バケット ${bucketIndex} はすでに ${chain.length} 件入っています。ここで衝突が起きるので、チェーンをたどって重複がないか確認します。`,
        "衝突を検出",
        comparisons,
        operationCollisions,
      ),
    );
  }

  for (let index = 0; index < chain.length; index += 1) {
    comparisons += 1;
    const value = chain[index];

    steps.push(
      createStep(
        `insert-${key}-scan-${index}`,
        "insert",
        key,
        cloneTableState(workingState),
        hashValue,
        bucketIndex,
        {
          activeBucketIndex: bucketIndex,
          activeNodeIndex: index,
          activeNodeValue: value,
          mode: "scan",
        },
        `チェーンの ${index + 1} 番目のノード ${value} を確認します。重複キーを許可しないので、同じ値がないか順に比較します。`,
        "チェーンを確認",
        comparisons,
        operationCollisions,
      ),
    );

    if (value === key) {
      steps.push(
        createStep(
          `insert-${key}-duplicate`,
          "insert",
          key,
          cloneTableState(workingState),
          hashValue,
          bucketIndex,
          {
            activeBucketIndex: bucketIndex,
            activeNodeIndex: index,
            activeNodeValue: value,
            mode: "duplicate",
          },
          `キー ${key} はすでに存在します。チェーン法でも重複を避けたいので、ここでは挿入せず処理を終えます。`,
          "重複キーを検出",
          comparisons,
          operationCollisions,
        ),
      );

      return { finalState: workingState, steps };
    }
  }

  const nextState = cloneTableState(workingState);
  nextState.buckets![bucketIndex].push(key);

  steps.push(
    createStep(
      `insert-${key}-commit`,
      "insert",
      key,
      nextState,
      hashValue,
      bucketIndex,
      {
        activeBucketIndex: bucketIndex,
        activeNodeIndex: nextState.buckets![bucketIndex].length - 1,
        activeNodeValue: key,
        mode: "insert",
      },
      chain.length === 0
        ? `バケット ${bucketIndex} は空だったので、そのまま ${key} を最初のノードとして追加します。`
        : `チェーンの末尾に ${key} を追加しました。衝突した要素は同じバケットの鎖として保持されます。`,
      "ノードを追加",
      comparisons,
      operationCollisions,
    ),
  );

  return { finalState: nextState, steps };
}

function buildSearchSteps(initialState: TableState, key: number): OperationResult {
  const workingState = cloneTableState(initialState);
  const bucketIndex = hashKey(key, workingState.bucketCount);
  const chain = workingState.buckets![bucketIndex];
  const steps: Step[] = [];
  const operationCollisions = chain.length > 0 ? 1 : 0;
  let comparisons = 0;
  const hashValue = bucketIndex;

  steps.push(
    createStep(
      `search-${key}-hash`,
      "search",
      key,
      cloneTableState(workingState),
      hashValue,
      bucketIndex,
      { activeBucketIndex: bucketIndex, mode: "hash" },
      `検索キー ${key} からバケット ${bucketIndex} を求めます。まずはこの 1 箇所だけを見ればよく、全バケットをなめる必要はありません。`,
      "探索するバケットを特定",
      comparisons,
      operationCollisions,
    ),
  );

  if (chain.length === 0) {
    steps.push(
      createStep(
        `search-${key}-empty`,
        "search",
        key,
        cloneTableState(workingState),
        hashValue,
        bucketIndex,
        { activeBucketIndex: bucketIndex, mode: "miss" },
        `バケット ${bucketIndex} は空です。この時点でキー ${key} は存在しないと判断できます。`,
        "空バケットなので不在",
        comparisons,
        operationCollisions,
      ),
    );

    return { finalState: workingState, steps };
  }

  for (let index = 0; index < chain.length; index += 1) {
    comparisons += 1;
    const value = chain[index];

    steps.push(
      createStep(
        `search-${key}-scan-${index}`,
        "search",
        key,
        cloneTableState(workingState),
        hashValue,
        bucketIndex,
        {
          activeBucketIndex: bucketIndex,
          activeNodeIndex: index,
          activeNodeValue: value,
          mode: "scan",
        },
        `バケット ${bucketIndex} のチェーンを先頭から調べます。${value} と ${key} を比較します。`,
        "ノードを比較",
        comparisons,
        operationCollisions,
      ),
    );

    if (value === key) {
      steps.push(
        createStep(
          `search-${key}-found`,
          "search",
          key,
          cloneTableState(workingState),
          hashValue,
          bucketIndex,
          {
            activeBucketIndex: bucketIndex,
            activeNodeIndex: index,
            activeNodeValue: value,
            mode: "found",
          },
          `キー ${key} が見つかりました。衝突していても、同じバケットのチェーンをたどれば探索できます。`,
          "キーを発見",
          comparisons,
          operationCollisions,
        ),
      );

      return { finalState: workingState, steps };
    }
  }

  steps.push(
    createStep(
      `search-${key}-miss`,
      "search",
      key,
      cloneTableState(workingState),
      hashValue,
      bucketIndex,
      { activeBucketIndex: bucketIndex, mode: "miss" },
      `バケット ${bucketIndex} のチェーンを最後まで見ましたが、キー ${key} は見つかりませんでした。`,
      "チェーンを見終えて不在",
      comparisons,
      operationCollisions,
    ),
  );

  return { finalState: workingState, steps };
}

function buildDeleteSteps(initialState: TableState, key: number): OperationResult {
  const workingState = cloneTableState(initialState);
  const bucketIndex = hashKey(key, workingState.bucketCount);
  const chain = workingState.buckets![bucketIndex];
  const steps: Step[] = [];
  const operationCollisions = chain.length > 0 ? 1 : 0;
  let comparisons = 0;
  const hashValue = bucketIndex;

  steps.push(
    createStep(
      `delete-${key}-hash`,
      "delete",
      key,
      cloneTableState(workingState),
      hashValue,
      bucketIndex,
      { activeBucketIndex: bucketIndex, mode: "hash" },
      `削除したいキー ${key} のバケットは ${bucketIndex} です。削除でも、まずは正しいチェーンを見つけるところから始まります。`,
      "削除対象のバケットを特定",
      comparisons,
      operationCollisions,
    ),
  );

  if (chain.length === 0) {
    steps.push(
      createStep(
        `delete-${key}-empty`,
        "delete",
        key,
        cloneTableState(workingState),
        hashValue,
        bucketIndex,
        { activeBucketIndex: bucketIndex, mode: "miss" },
        `バケット ${bucketIndex} は空なので、削除できるノードはありません。`,
        "空バケットなので削除なし",
        comparisons,
        operationCollisions,
      ),
    );

    return { finalState: workingState, steps };
  }

  for (let index = 0; index < chain.length; index += 1) {
    comparisons += 1;
    const value = chain[index];

    steps.push(
      createStep(
        `delete-${key}-scan-${index}`,
        "delete",
        key,
        cloneTableState(workingState),
        hashValue,
        bucketIndex,
        {
          activeBucketIndex: bucketIndex,
          activeNodeIndex: index,
          activeNodeValue: value,
          mode: "scan",
        },
        `削除前に、チェーンの ${index + 1} 番目のノード ${value} が対象かどうかを比較します。`,
        "削除対象を探索",
        comparisons,
        operationCollisions,
      ),
    );

    if (value === key) {
      const nextState = cloneTableState(workingState);
      nextState.buckets![bucketIndex].splice(index, 1);

      let positionDescription = "中間ノード";
      if (chain.length === 1) {
        positionDescription = "唯一のノード";
      } else if (index === 0) {
        positionDescription = "先頭ノード";
      } else if (index === chain.length - 1) {
        positionDescription = "末尾ノード";
      }

      steps.push(
        createStep(
          `delete-${key}-commit`,
          "delete",
          key,
          nextState,
          hashValue,
          bucketIndex,
          {
            activeBucketIndex: bucketIndex,
            activeNodeValue: value,
            mode: "delete",
          },
          `${positionDescription} ${key} をチェーンから外しました。チェーン法では、対象ノードの前後関係だけを直せば削除できます。`,
          "ノードを削除",
          comparisons,
          operationCollisions,
        ),
      );

      return { finalState: nextState, steps };
    }
  }

  steps.push(
    createStep(
      `delete-${key}-miss`,
      "delete",
      key,
      cloneTableState(workingState),
      hashValue,
      bucketIndex,
      { activeBucketIndex: bucketIndex, mode: "miss" },
      `バケット ${bucketIndex} のチェーンを最後までたどりましたが、キー ${key} はありませんでした。`,
      "削除対象は見つからず",
      comparisons,
      operationCollisions,
    ),
  );

  return { finalState: workingState, steps };
}

function buildLinearInsertSteps(
  initialState: TableState,
  key: number,
): OperationResult {
  const workingState = cloneTableState(initialState);
  const hashValue = hashKey(key, workingState.bucketCount);
  const slots = workingState.slots ?? [];
  const steps: Step[] = [];
  let comparisons = 0;
  let operationCollisions = 0;
  let firstDeletedIndex: number | undefined;

  steps.push(
    createStep(
      `linear-insert-${key}-hash`,
      "insert",
      key,
      cloneTableState(workingState),
      hashValue,
      hashValue,
      { activeBucketIndex: hashValue, mode: "hash" },
      `キー ${key} の開始位置は ${hashValue} です。線形探索法では、ここが埋まっていたら次のスロットへ順に進みます。`,
      "開始スロットを決定",
      comparisons,
      operationCollisions,
    ),
  );

  for (let offset = 0; offset < workingState.bucketCount; offset += 1) {
    const slotIndex = (hashValue + offset) % workingState.bucketCount;
    const slot = slots[slotIndex];

    if (slot === "DELETED") {
      if (firstDeletedIndex === undefined) {
        firstDeletedIndex = slotIndex;
      }

      steps.push(
        createStep(
          `linear-insert-${key}-deleted-${slotIndex}`,
          "insert",
          key,
          cloneTableState(workingState),
          hashValue,
          slotIndex,
          { activeBucketIndex: slotIndex, mode: "scan" },
          `スロット ${slotIndex} は tombstone です。あとで再利用できるので位置を覚えつつ、重複キーがないか探索は続けます。`,
          "tombstone を記録",
          comparisons,
          operationCollisions,
        ),
      );
      continue;
    }

    if (slot === null) {
      const insertIndex = firstDeletedIndex ?? slotIndex;
      const nextState = cloneTableState(workingState);
      nextState.slots![insertIndex] = key;

      steps.push(
        createStep(
          `linear-insert-${key}-commit-${insertIndex}`,
          "insert",
          key,
          nextState,
          hashValue,
          insertIndex,
          {
            activeBucketIndex: insertIndex,
            activeNodeValue: key,
            mode: "insert",
          },
          firstDeletedIndex !== undefined
            ? `空スロット ${slotIndex} に到達しました。先に見つけていた tombstone ${firstDeletedIndex} を再利用して ${key} を挿入します。`
            : `スロット ${slotIndex} は空なので、そのまま ${key} を格納します。`,
          "スロットへ挿入",
          comparisons,
          operationCollisions,
        ),
      );

      return { finalState: nextState, steps };
    }

    comparisons += 1;

    if (slot === key) {
      steps.push(
        createStep(
          `linear-insert-${key}-duplicate-${slotIndex}`,
          "insert",
          key,
          cloneTableState(workingState),
          hashValue,
          slotIndex,
          {
            activeBucketIndex: slotIndex,
            activeNodeValue: slot,
            mode: "duplicate",
          },
          `スロット ${slotIndex} に ${key} がありました。重複キーは入れないので、ここで挿入を中止します。`,
          "重複キーを検出",
          comparisons,
          operationCollisions,
        ),
      );

      return { finalState: workingState, steps };
    }

    operationCollisions += 1;

    steps.push(
      createStep(
        `linear-insert-${key}-scan-${slotIndex}`,
        "insert",
        key,
        cloneTableState(workingState),
        hashValue,
        slotIndex,
        {
          activeBucketIndex: slotIndex,
          activeNodeValue: slot,
          mode: "collision",
        },
        `スロット ${slotIndex} は ${slot} で埋まっています。衝突したので、次のスロットへ 1 つ進みます。`,
        "衝突したので次へ",
        comparisons,
        operationCollisions,
      ),
    );
  }

  if (firstDeletedIndex !== undefined) {
    const nextState = cloneTableState(workingState);
    nextState.slots![firstDeletedIndex] = key;

    steps.push(
      createStep(
        `linear-insert-${key}-reuse-${firstDeletedIndex}`,
        "insert",
        key,
        nextState,
        hashValue,
        firstDeletedIndex,
        {
          activeBucketIndex: firstDeletedIndex,
          activeNodeValue: key,
          mode: "insert",
        },
        `テーブルを 1 周しましたが、記録していた tombstone ${firstDeletedIndex} を再利用できるので ${key} を置きます。`,
        "tombstone を再利用",
        comparisons,
        operationCollisions,
      ),
    );

    return { finalState: nextState, steps };
  }

  steps.push(
    createStep(
      `linear-insert-${key}-full`,
      "insert",
      key,
      cloneTableState(workingState),
      hashValue,
      hashValue,
      { activeBucketIndex: hashValue, mode: "full" },
      `全スロットを調べても再利用可能な位置がありませんでした。線形探索法では、テーブルがいっぱいだと挿入できません。`,
      "テーブルが満杯",
      comparisons,
      operationCollisions,
    ),
  );

  return { finalState: workingState, steps };
}

function buildLinearSearchSteps(
  initialState: TableState,
  key: number,
): OperationResult {
  const workingState = cloneTableState(initialState);
  const hashValue = hashKey(key, workingState.bucketCount);
  const slots = workingState.slots ?? [];
  const steps: Step[] = [];
  let comparisons = 0;
  let operationCollisions = 0;

  steps.push(
    createStep(
      `linear-search-${key}-hash`,
      "search",
      key,
      cloneTableState(workingState),
      hashValue,
      hashValue,
      { activeBucketIndex: hashValue, mode: "hash" },
      `検索キー ${key} の開始位置は ${hashValue} です。ここから右へ順に調べていきます。`,
      "開始スロットを決定",
      comparisons,
      operationCollisions,
    ),
  );

  for (let offset = 0; offset < workingState.bucketCount; offset += 1) {
    const slotIndex = (hashValue + offset) % workingState.bucketCount;
    const slot = slots[slotIndex];

    if (slot === null) {
      steps.push(
        createStep(
          `linear-search-${key}-miss-${slotIndex}`,
          "search",
          key,
          cloneTableState(workingState),
          hashValue,
          slotIndex,
          { activeBucketIndex: slotIndex, mode: "miss" },
          `スロット ${slotIndex} は空です。ここに来るまでにキーが見つからなかったので、${key} は存在しません。`,
          "空スロットで探索終了",
          comparisons,
          operationCollisions,
        ),
      );

      return { finalState: workingState, steps };
    }

    if (slot === "DELETED") {
      steps.push(
        createStep(
          `linear-search-${key}-deleted-${slotIndex}`,
          "search",
          key,
          cloneTableState(workingState),
          hashValue,
          slotIndex,
          { activeBucketIndex: slotIndex, mode: "scan" },
          `スロット ${slotIndex} は tombstone です。削除済みでも探索の連続性を保つため、次のスロットまで進みます。`,
          "tombstone を通過",
          comparisons,
          operationCollisions,
        ),
      );
      continue;
    }

    comparisons += 1;

    steps.push(
      createStep(
        `linear-search-${key}-scan-${slotIndex}`,
        "search",
        key,
        cloneTableState(workingState),
        hashValue,
        slotIndex,
        {
          activeBucketIndex: slotIndex,
          activeNodeValue: slot,
          mode: "scan",
        },
        `スロット ${slotIndex} の値 ${slot} を ${key} と比較します。違えば、次のスロットへ進みます。`,
        "スロットを比較",
        comparisons,
        operationCollisions,
      ),
    );

    if (slot === key) {
      steps.push(
        createStep(
          `linear-search-${key}-found-${slotIndex}`,
          "search",
          key,
          cloneTableState(workingState),
          hashValue,
          slotIndex,
          {
            activeBucketIndex: slotIndex,
            activeNodeValue: slot,
            mode: "found",
          },
          `スロット ${slotIndex} でキー ${key} が見つかりました。線形探索法では、衝突しても隣を順に探せば見つけられます。`,
          "キーを発見",
          comparisons,
          operationCollisions,
        ),
      );

      return { finalState: workingState, steps };
    }

    operationCollisions += 1;
  }

  steps.push(
    createStep(
      `linear-search-${key}-wrapped-miss`,
      "search",
      key,
      cloneTableState(workingState),
      hashValue,
      hashValue,
      { activeBucketIndex: hashValue, mode: "miss" },
      `テーブルを 1 周しましたが、キー ${key} は見つかりませんでした。`,
      "一周しても不在",
      comparisons,
      operationCollisions,
    ),
  );

  return { finalState: workingState, steps };
}

function buildLinearDeleteSteps(
  initialState: TableState,
  key: number,
): OperationResult {
  const workingState = cloneTableState(initialState);
  const hashValue = hashKey(key, workingState.bucketCount);
  const slots = workingState.slots ?? [];
  const steps: Step[] = [];
  let comparisons = 0;
  let operationCollisions = 0;

  steps.push(
    createStep(
      `linear-delete-${key}-hash`,
      "delete",
      key,
      cloneTableState(workingState),
      hashValue,
      hashValue,
      { activeBucketIndex: hashValue, mode: "hash" },
      `削除したいキー ${key} の開始位置は ${hashValue} です。探索と同じ順番でスロットを追います。`,
      "開始スロットを決定",
      comparisons,
      operationCollisions,
    ),
  );

  for (let offset = 0; offset < workingState.bucketCount; offset += 1) {
    const slotIndex = (hashValue + offset) % workingState.bucketCount;
    const slot = slots[slotIndex];

    if (slot === null) {
      steps.push(
        createStep(
          `linear-delete-${key}-miss-${slotIndex}`,
          "delete",
          key,
          cloneTableState(workingState),
          hashValue,
          slotIndex,
          { activeBucketIndex: slotIndex, mode: "miss" },
          `スロット ${slotIndex} が空なので、${key} は存在しません。ここで削除を打ち切れます。`,
          "空スロットで削除終了",
          comparisons,
          operationCollisions,
        ),
      );

      return { finalState: workingState, steps };
    }

    if (slot === "DELETED") {
      steps.push(
        createStep(
          `linear-delete-${key}-deleted-${slotIndex}`,
          "delete",
          key,
          cloneTableState(workingState),
          hashValue,
          slotIndex,
          { activeBucketIndex: slotIndex, mode: "scan" },
          `スロット ${slotIndex} は tombstone です。探索鎖を維持するため、そのまま次へ進みます。`,
          "tombstone を通過",
          comparisons,
          operationCollisions,
        ),
      );
      continue;
    }

    comparisons += 1;

    steps.push(
      createStep(
        `linear-delete-${key}-scan-${slotIndex}`,
        "delete",
        key,
        cloneTableState(workingState),
        hashValue,
        slotIndex,
        {
          activeBucketIndex: slotIndex,
          activeNodeValue: slot,
          mode: "scan",
        },
        `スロット ${slotIndex} の値 ${slot} が削除対象 ${key} か確認します。`,
        "削除対象を比較",
        comparisons,
        operationCollisions,
      ),
    );

    if (slot === key) {
      const nextState = cloneTableState(workingState);
      nextState.slots![slotIndex] = "DELETED";

      steps.push(
        createStep(
          `linear-delete-${key}-commit-${slotIndex}`,
          "delete",
          key,
          nextState,
          hashValue,
          slotIndex,
          {
            activeBucketIndex: slotIndex,
            activeNodeValue: slot,
            mode: "delete",
          },
          `スロット ${slotIndex} を tombstone に置き換えました。線形探索法では、ただ空に戻すと後ろの探索鎖が切れるためです。`,
          "tombstone で削除",
          comparisons,
          operationCollisions,
        ),
      );

      return { finalState: nextState, steps };
    }

    operationCollisions += 1;
  }

  steps.push(
    createStep(
      `linear-delete-${key}-wrapped-miss`,
      "delete",
      key,
      cloneTableState(workingState),
      hashValue,
      hashValue,
      { activeBucketIndex: hashValue, mode: "miss" },
      `テーブルを 1 周しましたが、キー ${key} は見つかりませんでした。`,
      "一周しても削除対象なし",
      comparisons,
      operationCollisions,
    ),
  );

  return { finalState: workingState, steps };
}
