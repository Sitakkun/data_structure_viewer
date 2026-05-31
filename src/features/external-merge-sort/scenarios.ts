import {
  buildExternalSortSteps,
  createExternalSortBaseState,
} from "./simulation";
import {
  ExternalSortScenario,
  ExternalSortScenarioDefinition,
  ExternalSortStep,
} from "./types";

export function cloneExternalSortSteps(
  steps: ExternalSortStep[],
): ExternalSortStep[] {
  return steps.map((step) => ({
    ...step,
    sortState: {
      ...step.sortState,
      visibleRuns: step.sortState.visibleRuns.map((run) => ({ ...run })),
      completedPassIds: [...step.sortState.completedPassIds],
      activeRunIds: [...step.sortState.activeRunIds],
      activeInputRunIds: [...step.sortState.activeInputRunIds],
      activeOutputRunIds: [...step.sortState.activeOutputRunIds],
    },
  }));
}

export const externalSortScenarioDefinitions: ExternalSortScenarioDefinition[] = [
  {
    id: "external-sort-small",
    title: "Small sort in two passes",
    description:
      "4 本の initial run を 1 回の merge pass でまとめ、basic external sort の流れを確認します。",
    watchPoints: [
      "run generation では全 page を 1 回 read/write する点を見る。",
      "buffer count - 1 が同時に merge できる run 数になる点を見る。",
    ],
    config: {
      recordCount: 36,
      runSize: 9,
      bufferCount: 5,
    },
  },
  {
    id: "external-sort-constrained-buffers",
    title: "Constrained buffers need extra pass",
    description:
      "buffer が少ないと 2-way merge になり、同じデータを複数 pass で読み書きします。",
    watchPoints: [
      "merge fan-in が 2 だと 8 runs が 4 -> 2 -> 1 と段階的にしか減らない点を見る。",
      "pass が増えるたびに read/write cost が record count 分ずつ増える点を見る。",
    ],
    config: {
      recordCount: 96,
      runSize: 12,
      bufferCount: 3,
    },
  },
  {
    id: "external-sort-more-buffers",
    title: "More buffers reduce passes",
    description:
      "同じ 96 pages でも buffer を増やすと fan-in が上がり、merge pass と I/O cost が減ります。",
    watchPoints: [
      "buffer count 5 では fan-in 4 になり、8 runs が 2 pass で 1 run になる点を見る。",
      "constrained buffer case と total I/O を比較する。",
    ],
    config: {
      recordCount: 96,
      runSize: 12,
      bufferCount: 5,
    },
  },
  {
    id: "external-sort-large-memory-runs",
    title: "Larger memory runs reduce fan-in pressure",
    description:
      "memory に乗る run size が大きいと initial run 数が減り、merge pass を少なくできます。",
    config: {
      recordCount: 80,
      runSize: 20,
      bufferCount: 5,
    },
  },
];

export function createExternalSortScenario(
  definition: ExternalSortScenarioDefinition,
): ExternalSortScenario {
  const baseState = createExternalSortBaseState(definition.config);
  const steps = buildExternalSortSteps(definition.config);

  return {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    watchPoints: definition.watchPoints,
    config: definition.config,
    baseState,
    finalState: steps[steps.length - 1]?.sortState ?? baseState,
    steps: cloneExternalSortSteps(steps),
  };
}

export function createSeededExternalSortScenario() {
  return createExternalSortScenario(externalSortScenarioDefinitions[0]);
}

export function findExternalSortScenarioById(id: string) {
  const definition =
    externalSortScenarioDefinitions.find((scenario) => scenario.id === id) ??
    externalSortScenarioDefinitions[0];

  return createExternalSortScenario(definition);
}
