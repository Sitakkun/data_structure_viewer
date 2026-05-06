import {
  buildWriteAmplificationSteps,
  defaultWorkloadConfig,
} from "./simulation";
import { WriteAmplificationScenario } from "./types";

export const writeAmplificationScenarios: WriteAmplificationScenario[] = [
  {
    id: "wa-default-insert",
    title: "Insert workload",
    description:
      "同じ insert workload を B-tree / Bε tree / LSM-tree に流し、どの層で書き込みが増えるかを比較します。",
    config: defaultWorkloadConfig,
    steps: buildWriteAmplificationSteps(defaultWorkloadConfig),
  },
  {
    id: "wa-btree-split-heavy",
    title: "B-tree split が多い workload",
    description:
      "B-tree の split frequency を小さくし、page split propagation が WA に効くケースを見ます。",
    config: {
      ...defaultWorkloadConfig,
      count: 12,
      btreeSplitEvery: 3,
    },
    steps: buildWriteAmplificationSteps({
      ...defaultWorkloadConfig,
      count: 12,
      btreeSplitEvery: 3,
    }),
  },
  {
    id: "wa-lsm-compaction-heavy",
    title: "LSM compaction が目立つ workload",
    description:
      "memtable を小さくして SSTable flush を増やし、compaction rewrite が WA に効くケースを見ます。",
    config: {
      ...defaultWorkloadConfig,
      count: 18,
      lsmMemtableCapacity: 3,
      lsmCompactionFanout: 2,
    },
    steps: buildWriteAmplificationSteps({
      ...defaultWorkloadConfig,
      count: 18,
      lsmMemtableCapacity: 3,
      lsmCompactionFanout: 2,
    }),
  },
  {
    id: "wa-delete-tombstone",
    title: "Delete と tombstone",
    description:
      "delete workload では、Bε tree と LSM-tree が tombstone を使って削除を遅延することを確認します。",
    config: {
      ...defaultWorkloadConfig,
      operation: "delete",
      count: 10,
    },
    steps: buildWriteAmplificationSteps({
      ...defaultWorkloadConfig,
      operation: "delete",
      count: 10,
    }),
  },
];

export function findWriteAmplificationScenarioById(id: string) {
  return (
    writeAmplificationScenarios.find((scenario) => scenario.id === id) ??
    writeAmplificationScenarios[0]
  );
}
