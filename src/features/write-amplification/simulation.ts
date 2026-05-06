import {
  EngineWriteSummary,
  WorkloadConfig,
  WriteEngine,
  WriteEvent,
  WriteLayer,
  WriteAmplificationStep,
} from "./types";

export const defaultWorkloadConfig: WorkloadConfig = {
  operation: "insert",
  count: 12,
  walEnabled: true,
  btreeSplitEvery: 6,
  bepsilonBufferCapacity: 4,
  lsmMemtableCapacity: 4,
  lsmCompactionFanout: 3,
};

const engineOrder: WriteEngine[] = ["btree", "bepsilon", "lsm"];

function roundUnit(value: number): number {
  return Math.round(value * 100) / 100;
}

function makeEvent(
  events: WriteEvent[],
  engine: WriteEngine,
  layer: WriteLayer,
  label: string,
  units: number,
  explanation: string,
) {
  events.push({
    id: `${engine}-${events.length}`,
    engine,
    layer,
    label,
    units: roundUnit(units),
    explanation,
  });
}

function summarize(
  engine: WriteEngine,
  logicalWrites: number,
  events: WriteEvent[],
): EngineWriteSummary {
  const physicalWriteUnits = roundUnit(
    events.reduce((sum, event) => sum + event.units, 0),
  );

  return {
    engine,
    logicalWrites,
    physicalWriteUnits,
    writeAmplification: roundUnit(physicalWriteUnits / logicalWrites),
    events,
  };
}

function buildBTreeSummary(config: WorkloadConfig): EngineWriteSummary {
  const events: WriteEvent[] = [];
  const splitCount = Math.floor(config.count / config.btreeSplitEvery);

  makeEvent(
    events,
    "btree",
    "logical",
    `${config.count} logical ${config.operation}`,
    0,
    "ユーザーが投入した論理更新です。ここでは normalized write units の分母になります。",
  );

  if (config.walEnabled) {
    makeEvent(
      events,
      "btree",
      "wal",
      "WAL append",
      config.count,
      "耐障害性のため、ページ更新より前にログへ追記します。",
    );
  }

  makeEvent(
    events,
    "btree",
    "buffer-pool",
    "Dirty index pages",
    0,
    "バッファープール上の B-tree page を変更します。ここ自体はメモリ上の変化なので物理 write units は 0 とします。",
  );
  makeEvent(
    events,
    "btree",
    "index-page",
    "Page write-back",
    config.count,
    "dirty page が checkpoint や eviction で書き戻されます。小さな record 更新でも page 単位の書き戻しになります。",
  );

  if (splitCount > 0) {
    makeEvent(
      events,
      "btree",
      "page-split",
      "Page split propagation",
      splitCount * 2,
      "leaf split では sibling page と parent page の更新が追加されます。親へ伝播するとさらに増えます。",
    );
  }

  if (config.operation === "delete") {
    makeEvent(
      events,
      "btree",
      "index-page",
      "Delete cleanup",
      Math.ceil(config.count / 4),
      "削除後の空き領域整理や merge は実装次第ですが、ここでは追加の保守 write として簡略化します。",
    );
  }

  return summarize("btree", config.count, events);
}

function buildBEpsilonSummary(config: WorkloadConfig): EngineWriteSummary {
  const events: WriteEvent[] = [];
  const flushBatches = Math.ceil(config.count / config.bepsilonBufferCapacity);
  const splitCount = Math.floor(config.count / (config.bepsilonBufferCapacity * 2));

  makeEvent(
    events,
    "bepsilon",
    "logical",
    `${config.count} logical ${config.operation}`,
    0,
    "Bε tree では logical write を更新 message として扱います。",
  );

  if (config.walEnabled) {
    makeEvent(
      events,
      "bepsilon",
      "wal",
      "WAL append",
      config.count,
      "message 自体の durability は WAL で守ります。",
    );
  }

  makeEvent(
    events,
    "bepsilon",
    "node-buffer",
    "Append messages to node buffers",
    0,
    "更新はすぐ葉 record を書き換えず、内部ノードの buffer に蓄積します。",
  );
  makeEvent(
    events,
    "bepsilon",
    "flush",
    "Batch flush to children",
    flushBatches,
    "buffer が溜まったら key range ごとに child へまとめて流します。小さなランダム更新を batch 化する箇所です。",
  );
  makeEvent(
    events,
    "bepsilon",
    "index-page",
    "Apply messages to leaves",
    flushBatches,
    "葉まで届いた message をまとめて record に適用します。",
  );

  if (config.operation === "delete") {
    makeEvent(
      events,
      "bepsilon",
      "tombstone",
      "Tombstone messages",
      0,
      "delete は即時削除ではなく tombstone message として流れます。",
    );
  }

  if (splitCount > 0) {
    makeEvent(
      events,
      "bepsilon",
      "page-split",
      "Buffered tree split",
      splitCount * 2,
      "leaf/internal が capacity を超えた場合は B-tree 系と同じく split が必要です。",
    );
  }

  return summarize("bepsilon", config.count, events);
}

function buildLsmSummary(config: WorkloadConfig): EngineWriteSummary {
  const events: WriteEvent[] = [];
  const sstableFlushes = Math.ceil(config.count / config.lsmMemtableCapacity);
  const compactions = Math.floor(sstableFlushes / config.lsmCompactionFanout);

  makeEvent(
    events,
    "lsm",
    "logical",
    `${config.count} logical ${config.operation}`,
    0,
    "LSM-tree では insert/update/delete はまず memtable へ入ります。",
  );

  if (config.walEnabled) {
    makeEvent(
      events,
      "lsm",
      "wal",
      "WAL append",
      config.count,
      "memtable の内容が flush されるまで、WAL が唯一の永続コピーになります。",
    );
  }

  makeEvent(
    events,
    "lsm",
    "memtable",
    "Memtable write",
    0,
    "memtable への書き込みはメモリ上の更新です。",
  );
  makeEvent(
    events,
    "lsm",
    "sstable",
    "Flush immutable SSTables",
    sstableFlushes,
    "memtable がいっぱいになると、sorted run / SSTable として sequential に書き出します。",
  );

  if (config.operation === "delete") {
    makeEvent(
      events,
      "lsm",
      "tombstone",
      "Tombstone entries",
      0,
      "delete は tombstone として書かれ、後続 compaction で古い値と一緒に回収されます。",
    );
  }

  if (compactions > 0) {
    makeEvent(
      events,
      "lsm",
      "compaction",
      "Compaction rewrite",
      compactions * config.lsmCompactionFanout,
      "複数 SSTable を読み、マージ結果を新しいファイルへ書き直します。LSM の write amplification の主因です。",
    );
  }

  return summarize("lsm", config.count, events);
}

export function buildWriteAmplificationSummaries(
  config: WorkloadConfig,
): Record<WriteEngine, EngineWriteSummary> {
  return {
    btree: buildBTreeSummary(config),
    bepsilon: buildBEpsilonSummary(config),
    lsm: buildLsmSummary(config),
  };
}

function cloneSummaries(
  summaries: Record<WriteEngine, EngineWriteSummary>,
): Record<WriteEngine, EngineWriteSummary> {
  return {
    btree: {
      ...summaries.btree,
      events: summaries.btree.events.map((event) => ({ ...event })),
    },
    bepsilon: {
      ...summaries.bepsilon,
      events: summaries.bepsilon.events.map((event) => ({ ...event })),
    },
    lsm: {
      ...summaries.lsm,
      events: summaries.lsm.events.map((event) => ({ ...event })),
    },
  };
}

export function buildWriteAmplificationSteps(
  config: WorkloadConfig,
): WriteAmplificationStep[] {
  const summaries = buildWriteAmplificationSummaries(config);
  const steps: WriteAmplificationStep[] = [
    {
      id: "overview",
      title: "Run workload",
      explanation:
        "同じ workload を B-tree / Bε tree / LSM-tree に流し、どの層で物理書き込みが増えるかを比較します。",
      summaries: cloneSummaries(summaries),
    },
  ];

  for (const engine of engineOrder) {
    for (const event of summaries[engine].events) {
      steps.push({
        id: `${engine}-${event.id}`,
        title: event.label,
        explanation: event.explanation,
        activeEngine: engine,
        activeEventId: event.id,
        summaries: cloneSummaries(summaries),
      });
    }
  }

  const sorted = [...engineOrder].sort(
    (left, right) =>
      summaries[left].writeAmplification - summaries[right].writeAmplification,
  );
  steps.push({
    id: "compare",
    title: "Compare write amplification",
    explanation: `${engineLabel(sorted[0])} がこの設定では最も低い WA です。ただし、この数値は実測値ではなく教材用の normalized write units です。`,
    activeEngine: sorted[0],
    summaries: cloneSummaries(summaries),
  });

  return steps;
}

export function engineLabel(engine: WriteEngine): string {
  if (engine === "btree") {
    return "B-tree";
  }
  if (engine === "bepsilon") {
    return "Bε tree";
  }
  return "LSM-tree";
}
