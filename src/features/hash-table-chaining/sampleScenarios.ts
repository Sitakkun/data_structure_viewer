import { Scenario } from "./types";
import {
  cloneTableState,
  createEmptyTable,
  runOperation,
  tableFromKeys,
} from "./simulation";

const bucketCount = 7;

function buildScenario(
  id: string,
  title: string,
  description: string,
  baseKeys: number[],
  operations: Array<{ type: "insert" | "search" | "delete"; key: number }>,
): Scenario {
  const baseState = tableFromKeys(baseKeys, bucketCount);
  let currentState = cloneTableState(baseState);
  const steps = operations.flatMap((operation, operationIndex) => {
    const result = runOperation(operation.type, operation.key, currentState);
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

export const chainingSampleScenarios: Scenario[] = [
  buildScenario(
    "collision-free-insert",
    "衝突なしの挿入",
    "空のバケットへそのままノードが入る最短ケースです。",
    [],
    [{ type: "insert", key: 12 }],
  ),
  buildScenario(
    "same-bucket-chain",
    "同一バケットへの連続挿入",
    "3, 10, 17 はすべて 7 で割った余りが 3 なので、1 本のチェーンに並びます。",
    [],
    [
      { type: "insert", key: 3 },
      { type: "insert", key: 10 },
      { type: "insert", key: 17 },
    ],
  ),
  buildScenario(
    "collision-search-hit",
    "衝突後の検索成功",
    "同じバケットのチェーンを順にたどって、末尾のキーを見つける流れです。",
    [3, 10, 17, 4],
    [{ type: "search", key: 17 }],
  ),
  buildScenario(
    "collision-search-miss",
    "衝突後の検索失敗",
    "目的のバケットまでは当たるが、チェーン全体を見てもキーが存在しないケースです。",
    [3, 10, 17, 4],
    [{ type: "search", key: 24 }],
  ),
  buildScenario(
    "delete-middle-node",
    "チェーン中間要素の削除",
    "同じバケット内で中間ノードだけを外すと、前後のつながりだけを直せば済みます。",
    [3, 10, 17, 4],
    [{ type: "delete", key: 10 }],
  ),
];

export const emptyChainingScenario: Scenario = {
  id: "chaining-empty",
  title: "空のテーブル",
  description: "ここから Insert / Search / Delete を実行できます。",
  baseState: createEmptyTable(bucketCount),
  finalState: createEmptyTable(bucketCount),
  steps: [],
};
