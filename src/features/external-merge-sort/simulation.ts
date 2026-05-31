import {
  ExternalSortConfig,
  ExternalSortPlan,
  ExternalSortState,
  ExternalSortStep,
  MergeGroup,
  MergePass,
  SortRun,
} from "./types";

function createRun(
  passNumber: number,
  index: number,
  size: number,
  sourceRunIds: string[] = [],
): SortRun {
  return {
    id: `p${passNumber}-r${index}`,
    label: `R${index}`,
    passNumber,
    size,
    sourceRunIds,
  };
}

function formatRunCount(count: number) {
  return `${count} ${count === 1 ? "run" : "runs"}`;
}

export function normalizeExternalSortConfig(
  config: ExternalSortConfig,
): ExternalSortConfig {
  return {
    recordCount: Math.max(1, Math.floor(config.recordCount)),
    runSize: Math.max(1, Math.floor(config.runSize)),
    bufferCount: Math.max(3, Math.floor(config.bufferCount)),
  };
}

function splitIntoInitialRuns(config: ExternalSortConfig) {
  const runs: SortRun[] = [];
  let remaining = config.recordCount;
  let index = 1;

  while (remaining > 0) {
    const size = Math.min(config.runSize, remaining);
    runs.push(createRun(0, index, size));
    remaining -= size;
    index += 1;
  }

  return runs;
}

export function buildExternalSortPlan(
  rawConfig: ExternalSortConfig,
): ExternalSortPlan {
  const config = normalizeExternalSortConfig(rawConfig);
  const mergeFanIn = Math.max(2, config.bufferCount - 1);
  const initialRuns = splitIntoInitialRuns(config);
  const mergePasses: MergePass[] = [];
  let currentRuns = initialRuns;
  let passNumber = 1;

  while (currentRuns.length > 1) {
    const groups: MergeGroup[] = [];
    const nextRuns: SortRun[] = [];

    for (let index = 0; index < currentRuns.length; index += mergeFanIn) {
      const inputRuns = currentRuns.slice(index, index + mergeFanIn);
      const outputRun = createRun(
        passNumber,
        groups.length + 1,
        inputRuns.reduce((total, run) => total + run.size, 0),
        inputRuns.map((run) => run.id),
      );

      groups.push({
        id: `pass-${passNumber}-group-${groups.length + 1}`,
        inputRuns,
        outputRun,
      });
      nextRuns.push(outputRun);
    }

    mergePasses.push({
      id: `merge-pass-${passNumber}`,
      passNumber,
      inputRunCount: currentRuns.length,
      outputRunCount: nextRuns.length,
      groups,
      readPages: config.recordCount,
      writePages: config.recordCount,
    });

    currentRuns = nextRuns;
    passNumber += 1;
  }

  const totalPasses = 1 + mergePasses.length;
  const totalReadPages = config.recordCount * totalPasses;
  const totalWritePages = config.recordCount * totalPasses;

  return {
    config,
    mergeFanIn,
    initialRuns,
    mergePasses,
    totalPasses,
    totalReadPages,
    totalWritePages,
    totalIoPages: totalReadPages + totalWritePages,
  };
}

function createState({
  plan,
  stage,
  visibleRuns,
  completedPassIds = [],
  activeRunIds = [],
  activeInputRunIds = [],
  activeOutputRunIds = [],
  cumulativeReadPages = 0,
  cumulativeWritePages = 0,
}: {
  plan: ExternalSortPlan;
  stage: ExternalSortState["stage"];
  visibleRuns: SortRun[];
  completedPassIds?: string[];
  activeRunIds?: string[];
  activeInputRunIds?: string[];
  activeOutputRunIds?: string[];
  cumulativeReadPages?: number;
  cumulativeWritePages?: number;
}): ExternalSortState {
  return {
    plan,
    stage,
    visibleRuns,
    completedPassIds,
    activeRunIds,
    activeInputRunIds,
    activeOutputRunIds,
    cumulativeReadPages,
    cumulativeWritePages,
  };
}

export function createExternalSortBaseState(
  config: ExternalSortConfig,
): ExternalSortState {
  const plan = buildExternalSortPlan(config);

  return createState({
    plan,
    stage: "input",
    visibleRuns: plan.initialRuns,
  });
}

export function buildExternalSortSteps(
  config: ExternalSortConfig,
): ExternalSortStep[] {
  const plan = buildExternalSortPlan(config);
  const steps: ExternalSortStep[] = [];
  const runGenerationState = createState({
    plan,
    stage: "run-generation",
    visibleRuns: plan.initialRuns,
    activeRunIds: plan.initialRuns.map((run) => run.id),
    cumulativeReadPages: plan.config.recordCount,
    cumulativeWritePages: plan.config.recordCount,
  });

  steps.push({
    id: "run-generation",
    title: "Generate sorted runs",
    explanation:
      "入力 relation を memory に入る単位で読み、各 chunk を sort して sorted run として disk に書き戻します。",
    stage: "run-generation",
    sortState: runGenerationState,
  });

  plan.mergePasses.forEach((pass, index) => {
    const cumulativePasses = index + 2;
    const activeInputRunIds = pass.groups.flatMap((group) =>
      group.inputRuns.map((run) => run.id),
    );
    const activeOutputRunIds = pass.groups.map((group) => group.outputRun.id);

    steps.push({
      id: pass.id,
      title: `Merge pass ${pass.passNumber}: ${formatRunCount(pass.inputRunCount)} -> ${formatRunCount(pass.outputRunCount)}`,
      explanation:
        `最大 ${plan.mergeFanIn} 本の input run を同時に読み、output buffer へ merge します。` +
        `この pass だけで ${pass.readPages} pages read / ${pass.writePages} pages write が発生します。`,
      stage: "merge-pass",
      activePassId: pass.id,
      sortState: createState({
        plan,
        stage: "merge-pass",
        visibleRuns: pass.groups.map((group) => group.outputRun),
        completedPassIds: plan.mergePasses
          .slice(0, index + 1)
          .map((completedPass) => completedPass.id),
        activeInputRunIds,
        activeOutputRunIds,
        cumulativeReadPages: plan.config.recordCount * cumulativePasses,
        cumulativeWritePages: plan.config.recordCount * cumulativePasses,
      }),
    });
  });

  return steps;
}
