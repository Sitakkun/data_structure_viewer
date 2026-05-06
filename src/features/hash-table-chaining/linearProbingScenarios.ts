import { Scenario } from "./types";
import {
  cloneTableState,
  createEmptyLinearProbingTable,
  runLinearProbingOperation,
  tableFromKeysLinearProbing,
} from "./simulation";

const bucketCount = 7;

function buildScenario(
  id: string,
  title: string,
  description: string,
  baseKeys: number[],
  operations: Array<{ type: "insert" | "search" | "delete"; key: number }>,
): Scenario {
  const baseState = tableFromKeysLinearProbing(baseKeys, bucketCount);
  let currentState = cloneTableState(baseState);
  const steps = operations.flatMap((operation, operationIndex) => {
    const result = runLinearProbingOperation(
      operation.type,
      operation.key,
      currentState,
    );
    currentState = cloneTableState(result.finalState);

    return result.steps.map((step, stepIndex) => ({
      ...step,
      id: `${id}-${operationIndex}-${stepIndex}`,
      title:
        operations.length > 1
          ? `${operation.type.toUpperCase()} ${operation.key}: ${step.title}`
          : step.title,
    }));
  });

  return {
    id,
    title,
    description,
    baseState,
    finalState: currentState,
    steps,
  };
}

export const linearProbingSampleScenarios: Scenario[] = [
  buildScenario(
    "linear-collision-free-insert",
    "衝突なしの挿入",
    "空スロットへそのまま入る最短ケースです。",
    [],
    [{ type: "insert", key: 12 }],
  ),
  buildScenario(
    "linear-cluster-insert",
    "連続スロットへの挿入",
    "3, 10, 17 は同じ開始位置から線形にずれて、連続したクラスタを作ります。",
    [],
    [
      { type: "insert", key: 3 },
      { type: "insert", key: 10 },
      { type: "insert", key: 17 },
    ],
  ),
  buildScenario(
    "linear-search-hit",
    "衝突後の検索成功",
    "開始位置から右へたどって、離れたスロットにあるキーを見つけます。",
    [3, 10, 17, 4],
    [{ type: "search", key: 17 }],
  ),
  buildScenario(
    "linear-search-miss",
    "衝突後の検索失敗",
    "クラスタを最後までたどっても見つからず、空スロットで探索を止めるケースです。",
    [3, 10, 17, 4],
    [{ type: "search", key: 24 }],
  ),
  buildScenario(
    "linear-delete-tombstone",
    "tombstone を使う削除",
    "削除後に空へ戻さず tombstone を置くことで、後続要素の探索鎖を保ちます。",
    [3, 10, 17, 4],
    [{ type: "delete", key: 10 }],
  ),
];

export const emptyLinearProbingScenario: Scenario = {
  id: "linear-probing-empty",
  title: "空のテーブル",
  description: "ここから Insert / Search / Delete を実行できます。",
  baseState: createEmptyLinearProbingTable(bucketCount),
  finalState: createEmptyLinearProbingTable(bucketCount),
  steps: [],
};
