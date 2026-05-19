import {
  buildLSMScenario,
  cloneLSMState,
  createCompactionReadyLSMState,
  createEmptyLSMState,
  createFlushReadyLSMState,
  createSeededLSMState,
} from "./simulation";
import { LSMScenario } from "./types";

export const seededLSMScenario: LSMScenario = {
  id: "lsm-seeded",
  title: "LSM-tree with memtable and SSTables",
  description:
    "memtable、WAL、複数 SSTable がある状態から、write / search / tombstone / compaction を試せます。",
  watchPoints: [
    "write が WAL と memtable に入り、SSTable をすぐ書き換えない点を見る。",
    "search は memtable から新しい SSTable 順に探す点を見る。",
  ],
  baseState: createSeededLSMState(),
  finalState: createSeededLSMState(),
  steps: [],
};

export const lsmScenarios: LSMScenario[] = [
  buildLSMScenario(
    "lsm-put-memtable",
    "Put を memtable に書く",
    "WAL に追記したあと、memtable に最新値を追加します。SSTable はまだ書き換えません。",
    createEmptyLSMState(),
    { type: "put", key: 15 },
  ),
  buildLSMScenario(
    "lsm-flush-sstable",
    "Memtable を SSTable に flush する",
    "memtable がいっぱいになったら immutable に切り替え、sorted SSTable として書き出します。",
    createFlushReadyLSMState(),
    { type: "flush" },
  ),
  buildLSMScenario(
    "lsm-search-newest",
    "Memtable の最新値を見つける",
    "古い値が SSTable に残っていても、memtable の新しい値が優先されます。",
    createSeededLSMState(),
    { type: "search", key: 35 },
  ),
  buildLSMScenario(
    "lsm-search-multiple-sstables",
    "複数 SSTable を順に探す",
    "memtable にない key は、複数 SSTable を新しい順に確認するため read amplification が増えます。",
    createSeededLSMState(),
    { type: "search", key: 20 },
  ),
  buildLSMScenario(
    "lsm-delete-tombstone",
    "Delete を tombstone として書く",
    "LSM-tree の delete は値の即時削除ではなく、tombstone を新しい record として追加します。",
    createSeededLSMState(),
    { type: "delete", key: 30 },
  ),
  buildLSMScenario(
    "lsm-compaction",
    "Compaction で obsolete record を落とす",
    "複数 SSTable を merge し、同じ key の古い値や tombstone を取り除きます。",
    createCompactionReadyLSMState(),
    { type: "compact" },
  ),
];

export function findLSMScenarioById(id: string): LSMScenario {
  if (id === seededLSMScenario.id) {
    return seededLSMScenario;
  }

  return lsmScenarios.find((scenario) => scenario.id === id) ?? seededLSMScenario;
}

export function cloneLSMScenarioSteps(scenario: LSMScenario) {
  return scenario.steps.map((step) => ({
    ...step,
    lsmState: cloneLSMState(step.lsmState),
  }));
}
