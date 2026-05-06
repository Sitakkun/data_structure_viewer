import {
  buildDeleteSteps as buildBPlusTreeDeleteSteps,
  buildInsertSteps as buildBPlusTreeInsertSteps,
  buildRangeScanSteps as buildBPlusTreeRangeScanSteps,
  buildSearchSteps as buildBPlusTreeSearchSteps,
  createBPlusTreeStateFromKeys,
  extractBPlusTreeSourceKeys,
} from "./b-plus-tree/simulation";
import { BPlusTreeState, BPlusTreeStep } from "./b-plus-tree/types";
import {
  buildDeleteSteps as buildBTreeDeleteSteps,
  buildInsertSteps as buildBTreeInsertSteps,
  buildRangeScanSteps as buildBTreeRangeScanSteps,
  buildSearchSteps as buildBTreeSearchSteps,
  createBTreeStateFromKeys,
  extractBTreeSourceKeys,
} from "./b-tree/simulation";
import { BTreeState, BTreeStep } from "./b-tree/types";

type SharedTreeOperation = "insert" | "search" | "range-scan" | "delete";
type OperationKey =
  | { operation: "insert" | "search" | "delete"; key: number }
  | { operation: "range-scan"; rangeStart: number; rangeEnd: number };

export interface TreeStepComparisonSummary {
  operation: SharedTreeOperation;
  targetLabel: string;
  primaryLabel: string;
  primarySteps: number;
  primaryCost: string;
  counterpartLabel: string;
  counterpartSteps: number;
  counterpartCost: string;
}

function getBTreeOperationKey(steps: BTreeStep[]): OperationKey | undefined {
  const operation = steps[0]?.operation;
  const key = steps[0]?.btreeState.activeKey;
  const rangeStart = steps[0]?.btreeState.activeRangeStart;
  const rangeEnd = steps[0]?.btreeState.activeRangeEnd;

  if (!operation) {
    return undefined;
  }

  if (operation === "range-scan") {
    if (rangeStart === undefined || rangeEnd === undefined) {
      return undefined;
    }

    return { operation, rangeStart, rangeEnd };
  }

  if (key === undefined) {
    return undefined;
  }

  return { operation, key };
}

function getBPlusTreeOperationKey(steps: BPlusTreeStep[]): OperationKey | undefined {
  const operation = steps[0]?.operation;
  const key = steps[0]?.bplusTreeState.activeKey;
  const rangeStart = steps[0]?.bplusTreeState.activeRangeStart;
  const rangeEnd = steps[0]?.bplusTreeState.activeRangeEnd;

  if (!operation) {
    return undefined;
  }

  if (operation === "range-scan") {
    if (rangeStart === undefined || rangeEnd === undefined) {
      return undefined;
    }

    return { operation, rangeStart, rangeEnd };
  }

  if (key === undefined) {
    return undefined;
  }

  return { operation, key };
}

export function buildBTreeStepComparison(
  baseState: BTreeState,
  steps: BTreeStep[],
): TreeStepComparisonSummary | undefined {
  const operationKey = getBTreeOperationKey(steps);
  if (!operationKey) {
    return undefined;
  }

  const sourceKeys = extractBTreeSourceKeys(baseState);
  const counterpartBaseState = createBPlusTreeStateFromKeys(sourceKeys);
  const counterpartSteps =
    operationKey.operation === "range-scan"
      ? buildBPlusTreeRangeScanSteps(
          counterpartBaseState,
          operationKey.rangeStart,
          operationKey.rangeEnd,
        )
      : operationKey.operation === "insert"
        ? buildBPlusTreeInsertSteps(counterpartBaseState, operationKey.key)
        : operationKey.operation === "delete"
          ? buildBPlusTreeDeleteSteps(counterpartBaseState, operationKey.key)
          : buildBPlusTreeSearchSteps(counterpartBaseState, operationKey.key);

  return {
    operation: operationKey.operation,
    targetLabel:
      operationKey.operation === "range-scan"
        ? `${operationKey.rangeStart}..${operationKey.rangeEnd}`
        : String(operationKey.key),
    primaryLabel: "B-tree",
    primarySteps: steps.length,
    primaryCost: operationKey.operation === "range-scan" ? "O(log n + k)" : "O(log n)",
    counterpartLabel: "B+ Tree",
    counterpartSteps: counterpartSteps.length,
    counterpartCost:
      operationKey.operation === "range-scan" ? "O(log n + k)" : "O(log n)",
  };
}

export function buildBPlusTreeStepComparison(
  baseState: BPlusTreeState,
  steps: BPlusTreeStep[],
): TreeStepComparisonSummary | undefined {
  const operationKey = getBPlusTreeOperationKey(steps);
  if (!operationKey) {
    return undefined;
  }

  const sourceKeys = extractBPlusTreeSourceKeys(baseState);
  const counterpartBaseState = createBTreeStateFromKeys(sourceKeys);
  const counterpartSteps =
    operationKey.operation === "range-scan"
      ? buildBTreeRangeScanSteps(
          counterpartBaseState,
          operationKey.rangeStart,
          operationKey.rangeEnd,
        )
      : operationKey.operation === "insert"
        ? buildBTreeInsertSteps(counterpartBaseState, operationKey.key)
        : operationKey.operation === "delete"
          ? buildBTreeDeleteSteps(counterpartBaseState, operationKey.key)
          : buildBTreeSearchSteps(counterpartBaseState, operationKey.key);

  return {
    operation: operationKey.operation,
    targetLabel:
      operationKey.operation === "range-scan"
        ? `${operationKey.rangeStart}..${operationKey.rangeEnd}`
        : String(operationKey.key),
    primaryLabel: "B+ Tree",
    primarySteps: steps.length,
    primaryCost: operationKey.operation === "range-scan" ? "O(log n + k)" : "O(log n)",
    counterpartLabel: "B-tree",
    counterpartSteps: counterpartSteps.length,
    counterpartCost:
      operationKey.operation === "range-scan" ? "O(log n + k)" : "O(log n)",
  };
}
