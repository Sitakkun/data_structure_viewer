import {
  buildBufferPoolSteps,
  cloneBufferPoolState,
  createInitialBufferPoolState,
} from "./simulation";
import {
  BufferPolicy,
  BufferPoolScenario,
  BufferPoolScenarioDefinition,
  BufferPoolStep,
} from "./types";

export function cloneBufferPoolSteps(steps: BufferPoolStep[]) {
  return steps.map((step) => ({
    ...step,
    bufferState: cloneBufferPoolState(step.bufferState),
    highlights: { ...step.highlights },
  }));
}

export const bufferPoolScenarioDefinitions: BufferPoolScenarioDefinition[] = [
  {
    id: "buffer-hot-pages",
    title: "Hot pages stay cached",
    description:
      "同じ page を繰り返し参照し、hit が増えて physical read が減る流れを確認します。",
    actions: [
      { operation: "read", pageId: 1 },
      { operation: "read", pageId: 2 },
      { operation: "read", pageId: 3 },
      { operation: "read", pageId: 1 },
      { operation: "read", pageId: 2 },
      { operation: "read", pageId: 1 },
    ],
  },
  {
    id: "buffer-dirty-writeback",
    title: "Dirty page writeback",
    description:
      "dirty page が eviction される前に disk へ writeback されることを確認します。",
    actions: [
      { operation: "update", pageId: 1 },
      { operation: "read", pageId: 2 },
      { operation: "read", pageId: 3 },
      { operation: "read", pageId: 4 },
      { operation: "read", pageId: 5 },
    ],
  },
  {
    id: "buffer-pinned-page",
    title: "Pinned page cannot be evicted",
    description:
      "pin count がある page を eviction 対象から外し、別の page を追い出す流れを確認します。",
    actions: [
      { operation: "read", pageId: 1 },
      { operation: "read", pageId: 2 },
      { operation: "read", pageId: 3 },
      { operation: "read", pageId: 4 },
      { operation: "pin", pageId: 1 },
      { operation: "read", pageId: 5 },
      { operation: "unpin", pageId: 1 },
    ],
  },
  {
    id: "buffer-sequential-scan-pressure",
    title: "Sequential scan pressure",
    description:
      "hot pages がある状態で連続 scan を流し、LRU と CLOCK の eviction 選択を比較します。",
    actions: [
      { operation: "read", pageId: 1 },
      { operation: "read", pageId: 2 },
      { operation: "read", pageId: 3 },
      { operation: "read", pageId: 1 },
      { operation: "read", pageId: 2 },
      { operation: "range-scan", pageId: 10 },
      { operation: "range-scan", pageId: 11 },
      { operation: "range-scan", pageId: 12 },
      { operation: "range-scan", pageId: 13 },
    ],
  },
  {
    id: "buffer-checkpoint",
    title: "Checkpoint flushes dirty pages",
    description:
      "checkpoint が dirty page をまとめて flush し、eviction 時の writeback を減らす流れを確認します。",
    actions: [
      { operation: "update", pageId: 1 },
      { operation: "update", pageId: 2 },
      { operation: "read", pageId: 3 },
      { operation: "checkpoint" },
      { operation: "read", pageId: 4 },
      { operation: "read", pageId: 5 },
    ],
  },
];

export function createBufferPoolScenario(
  definition: BufferPoolScenarioDefinition,
  policy: BufferPolicy,
): BufferPoolScenario {
  const baseState = createInitialBufferPoolState(policy);
  const steps = buildBufferPoolSteps(baseState, definition.actions);

  return {
    id: definition.id,
    title: definition.title,
    description: `${definition.description} 現在の policy: ${policy.toUpperCase()}。`,
    baseState: cloneBufferPoolState(baseState),
    finalState: cloneBufferPoolState(steps[steps.length - 1]?.bufferState ?? baseState),
    steps: cloneBufferPoolSteps(steps),
  };
}

export function createSeededBufferPoolScenario(policy: BufferPolicy) {
  return createBufferPoolScenario(bufferPoolScenarioDefinitions[0], policy);
}

export function findBufferPoolScenarioById(id: string, policy: BufferPolicy) {
  const definition =
    bufferPoolScenarioDefinitions.find((scenario) => scenario.id === id) ??
    bufferPoolScenarioDefinitions[0];

  return createBufferPoolScenario(definition, policy);
}
