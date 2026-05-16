import {
  LSMOperation,
  LSMRecord,
  LSMScenario,
  LSMState,
  LSMStep,
  LSMStepHighlights,
  LSMStepMetrics,
  SSTable,
} from "./types";

export function cloneLSMState(state: LSMState): LSMState {
  return {
    ...state,
    wal: state.wal.map(cloneRecord),
    memtable: state.memtable.map(cloneRecord),
    immutableMemtable: state.immutableMemtable?.map(cloneRecord),
    sstables: state.sstables.map((sstable) => ({
      ...sstable,
      records: sstable.records.map(cloneRecord),
    })),
  };
}

function cloneRecord(record: LSMRecord): LSMRecord {
  return { ...record };
}

export function createEmptyLSMState(): LSMState {
  return {
    wal: [],
    memtable: [],
    sstables: [],
    memtableCapacity: 3,
    nextSequence: 1,
    nextSSTableId: 1,
  };
}

export function createSeededLSMState(): LSMState {
  return {
    wal: [],
    memtable: [
      { key: 35, value: "v35-new", sequence: 7 },
      { key: 55, tombstone: true, sequence: 8 },
    ],
    sstables: [
      {
        id: "S1",
        level: 0,
        records: [
          { key: 10, value: "v10", sequence: 1 },
          { key: 30, value: "v30", sequence: 2 },
          { key: 55, value: "v55", sequence: 3 },
        ],
      },
      {
        id: "S2",
        level: 0,
        records: [
          { key: 20, value: "v20", sequence: 4 },
          { key: 35, value: "v35-old", sequence: 5 },
          { key: 70, value: "v70", sequence: 6 },
        ],
      },
    ],
    memtableCapacity: 3,
    nextSequence: 9,
    nextSSTableId: 3,
  };
}

export function createFlushReadyLSMState(): LSMState {
  return {
    ...createEmptyLSMState(),
    wal: [
      { key: 15, value: "v15", sequence: 1 },
      { key: 25, value: "v25", sequence: 2 },
      { key: 35, value: "v35", sequence: 3 },
    ],
    memtable: [
      { key: 15, value: "v15", sequence: 1 },
      { key: 25, value: "v25", sequence: 2 },
      { key: 35, value: "v35", sequence: 3 },
    ],
    nextSequence: 4,
  };
}

export function createCompactionReadyLSMState(): LSMState {
  const state = createSeededLSMState();
  state.memtable = [];
  state.sstables.push({
    id: "S3",
    level: 0,
    records: [
      { key: 30, value: "v30-new", sequence: 9 },
      { key: 80, value: "v80", sequence: 10 },
    ],
  });
  state.nextSequence = 11;
  state.nextSSTableId = 4;
  return state;
}

export function getLSMMetrics(state: LSMState): LSMStepMetrics {
  const sstableRecords = state.sstables.flatMap((sstable) => sstable.records);
  return {
    walEntries: state.wal.length,
    memtableEntries: state.memtable.length + (state.immutableMemtable?.length ?? 0),
    sstableCount: state.sstables.length,
    tombstoneCount: [...state.memtable, ...sstableRecords].filter(
      (record) => record.tombstone,
    ).length,
    readSources: state.sstables.length + (state.memtable.length ? 1 : 0),
    writeUnits: state.sstables.length + state.wal.length,
  };
}

function pushStep(
  steps: LSMStep[],
  state: LSMState,
  operation: LSMOperation,
  title: string,
  explanation: string,
  highlights: LSMStepHighlights,
) {
  steps.push({
    id: `${operation}-${steps.length}`,
    operation,
    title,
    explanation,
    lsmState: cloneLSMState(state),
    highlights,
    metrics: getLSMMetrics(state),
  });
}

function makeRecord(
  state: LSMState,
  key: number,
  tombstone = false,
): LSMRecord {
  const sequence = state.nextSequence;
  state.nextSequence += 1;
  return tombstone
    ? { key, tombstone: true, sequence }
    : { key, value: `v${key}`, sequence };
}

function sortRecords(records: LSMRecord[]) {
  return [...records].sort((left, right) => left.key - right.key);
}

function flushMemtable(state: LSMState, steps: LSMStep[], reason: string) {
  if (state.memtable.length === 0) {
    pushStep(steps, state, "flush", "Flush skipped", "memtable が空なので、SSTable に書き出す内容はありません。", {
      activeLayer: "memtable",
      mode: "miss",
    });
    return;
  }

  state.immutableMemtable = sortRecords(state.memtable);
  state.memtable = [];
  pushStep(
    steps,
    state,
    "flush",
    "Freeze memtable",
    `${reason} 現在の memtable を immutable memtable に切り替え、以後の write は新しい memtable に向けます。`,
    {
      activeLayer: "immutable",
      mode: "freeze",
    },
  );

  const tableId = `S${state.nextSSTableId}`;
  state.nextSSTableId += 1;
  const sstable: SSTable = {
    id: tableId,
    level: 0,
    records: state.immutableMemtable,
  };
  state.sstables.unshift(sstable);
  state.immutableMemtable = undefined;
  state.wal = [];
  pushStep(
    steps,
    state,
    "flush",
    "Write SSTable",
    `${tableId} を sorted immutable file として書き出します。flush 後は対応する WAL を破棄できます。`,
    {
      activeLayer: "sstable",
      activeSSTableId: tableId,
      mode: "flush",
    },
  );
}

export function buildPutSteps(baseState: LSMState, key: number): LSMStep[] {
  const state = cloneLSMState(baseState);
  state.activeKey = key;
  const steps: LSMStep[] = [];
  const record = makeRecord(state, key);

  state.wal.push(record);
  pushStep(steps, state, "put", "Append to WAL", `key ${key} の write をまず WAL に追記し、memtable flush 前の耐障害性を確保します。`, {
    activeLayer: "wal",
    activeKey: key,
    activeSequence: record.sequence,
    mode: "wal",
  });

  state.memtable = sortRecords([...state.memtable, record]);
  pushStep(steps, state, "put", "Put into memtable", "memtable はメモリ上の sorted structure です。ディスク上の SSTable はまだ書き換えません。", {
    activeLayer: "memtable",
    activeKey: key,
    activeSequence: record.sequence,
    mode: "memtable-write",
  });

  if (state.memtable.length >= state.memtableCapacity) {
    flushMemtable(state, steps, "memtable が容量に達したため flush します。");
  }

  return steps;
}

export function buildDeleteSteps(baseState: LSMState, key: number): LSMStep[] {
  const state = cloneLSMState(baseState);
  state.activeKey = key;
  const steps: LSMStep[] = [];
  const record = makeRecord(state, key, true);

  state.wal.push(record);
  pushStep(steps, state, "delete", "Append delete to WAL", `key ${key} の delete tombstone を WAL に追記します。`, {
    activeLayer: "wal",
    activeKey: key,
    activeSequence: record.sequence,
    mode: "wal",
  });

  state.memtable = sortRecords([...state.memtable, record]);
  pushStep(steps, state, "delete", "Write tombstone to memtable", "LSM-tree では削除も tombstone として書き込み、古い値は後続 compaction で取り除きます。", {
    activeLayer: "memtable",
    activeKey: key,
    activeSequence: record.sequence,
    mode: "tombstone",
  });

  if (state.memtable.length >= state.memtableCapacity) {
    flushMemtable(state, steps, "tombstone を含む memtable が容量に達したため flush します。");
  }

  return steps;
}

function newestForKey(records: LSMRecord[], key: number): LSMRecord | undefined {
  return records
    .filter((record) => record.key === key)
    .sort((left, right) => right.sequence - left.sequence)[0];
}

export function buildSearchSteps(baseState: LSMState, key: number): LSMStep[] {
  const state = cloneLSMState(baseState);
  state.activeKey = key;
  const steps: LSMStep[] = [];

  const memtableRecord = newestForKey(state.memtable, key);
  pushStep(steps, state, "search", "Search memtable", "LSM-tree はまず最新の write がある memtable を確認します。", {
    activeLayer: "memtable",
    activeKey: key,
    activeSequence: memtableRecord?.sequence,
    mode: "search-memtable",
  });

  if (memtableRecord) {
    state.searchResult = memtableRecord.tombstone ? "deleted" : "found";
    pushStep(steps, state, "search", memtableRecord.tombstone ? "Found tombstone" : "Found latest value", memtableRecord.tombstone ? "memtable に tombstone があるため、古い SSTable に値が残っていても削除済みです。" : "memtable に最新値があるため、SSTable を読む必要はありません。", {
      activeLayer: "memtable",
      activeKey: key,
      activeSequence: memtableRecord.sequence,
      mode: memtableRecord.tombstone ? "tombstone" : "found",
    });
    return steps;
  }

  for (const sstable of state.sstables) {
    const record = newestForKey(sstable.records, key);
    pushStep(steps, state, "search", `Search ${sstable.id}`, `${sstable.id} を確認します。複数 SSTable があるほど read amplification が増えます。`, {
      activeLayer: "sstable",
      activeSSTableId: sstable.id,
      activeKey: key,
      activeSequence: record?.sequence,
      mode: "search-sstable",
    });

    if (record) {
      state.searchResult = record.tombstone ? "deleted" : "found";
      pushStep(steps, state, "search", record.tombstone ? "Found tombstone" : "Found in SSTable", record.tombstone ? `${sstable.id} に tombstone があり、key ${key} は削除済みです。` : `${sstable.id} で key ${key} の値が見つかりました。`, {
        activeLayer: "sstable",
        activeSSTableId: sstable.id,
        activeKey: key,
        activeSequence: record.sequence,
        mode: record.tombstone ? "tombstone" : "found",
      });
      return steps;
    }
  }

  state.searchResult = "miss";
  pushStep(steps, state, "search", "Search miss", `memtable とすべての SSTable に key ${key} は見つかりませんでした。`, {
    activeLayer: "sstable",
    activeKey: key,
    mode: "miss",
  });
  return steps;
}

export function buildFlushSteps(baseState: LSMState): LSMStep[] {
  const state = cloneLSMState(baseState);
  const steps: LSMStep[] = [];
  flushMemtable(state, steps, "手動 flush により、現在の memtable を SSTable に書き出します。");
  return steps;
}

export function buildCompactSteps(baseState: LSMState): LSMStep[] {
  const state = cloneLSMState(baseState);
  const steps: LSMStep[] = [];

  if (state.sstables.length < 2) {
    pushStep(steps, state, "compact", "Compaction skipped", "SSTable が 2 つ未満なので、merge する対象がありません。", {
      activeLayer: "compaction",
      mode: "miss",
    });
    return steps;
  }

  pushStep(steps, state, "compact", "Read SSTables for compaction", "複数の SSTable を読み、key ごとに最も新しい record だけを残す準備をします。", {
    activeLayer: "compaction",
    mode: "compact",
  });

  const byKey = new Map<number, LSMRecord>();
  for (const record of state.sstables.flatMap((sstable) => sstable.records)) {
    const current = byKey.get(record.key);
    if (!current || record.sequence > current.sequence) {
      byKey.set(record.key, record);
    }
  }

  const compactedRecords = [...byKey.values()]
    .filter((record) => !record.tombstone)
    .sort((left, right) => left.key - right.key);
  const tableId = `S${state.nextSSTableId}`;
  state.nextSSTableId += 1;
  state.sstables = [
    {
      id: tableId,
      level: 1,
      records: compactedRecords,
    },
  ];

  pushStep(steps, state, "compact", "Write compacted SSTable", `obsolete record と tombstone を落とし、${tableId} を level 1 の compacted SSTable として書き出します。`, {
    activeLayer: "sstable",
    activeSSTableId: tableId,
    mode: "drop-obsolete",
  });

  return steps;
}

export function buildLSMScenario(
  id: string,
  title: string,
  description: string,
  baseState: LSMState,
  operation:
    | { type: "put"; key: number }
    | { type: "delete"; key: number }
    | { type: "search"; key: number }
    | { type: "flush" }
    | { type: "compact" },
): LSMScenario {
  const steps =
    operation.type === "put"
      ? buildPutSteps(baseState, operation.key)
      : operation.type === "delete"
        ? buildDeleteSteps(baseState, operation.key)
        : operation.type === "search"
          ? buildSearchSteps(baseState, operation.key)
          : operation.type === "flush"
            ? buildFlushSteps(baseState)
            : buildCompactSteps(baseState);

  return {
    id,
    title,
    description,
    baseState: cloneLSMState(baseState),
    finalState: steps[steps.length - 1]?.lsmState ?? cloneLSMState(baseState),
    steps,
  };
}
