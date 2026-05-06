import { buildBloomScenario, createEmptyBloomState } from "./simulation";
import { BloomScenario } from "./types";

export const bloomScenarios: BloomScenario[] = [
  buildBloomScenario(
    "bloom-insert",
    "要素を挿入する",
    "Bloom Filter では元の要素を保存せず、複数ハッシュの位置だけを 1 にします。",
    ["apple", "banana"],
    { type: "insert", item: "cherry" },
  ),
  buildBloomScenario(
    "bloom-query-hit",
    "登録済み要素を照会する",
    "登録済み要素は必要なビットがすべて 1 なので、「たぶん存在する」と返ります。",
    ["apple", "banana", "cherry", "date"],
    { type: "query", item: "banana" },
  ),
  buildBloomScenario(
    "bloom-query-miss",
    "未登録を即座に否定する",
    "必要なビットのどれか 1 つでも 0 なら、その要素は絶対に未登録です。",
    ["apple", "banana", "cherry", "date"],
    { type: "query", item: "fig" },
  ),
  buildBloomScenario(
    "bloom-false-positive",
    "false positive が起きる",
    "別の要素が立てたビットの組み合わせだけで条件を満たすと、未登録でも陽性に見えることがあります。",
    ["apple", "banana", "cherry", "date"],
    { type: "query", item: "plum" },
  ),
];

export const emptyBloomScenario: BloomScenario = {
  id: "bloom-empty",
  title: "空の Bloom Filter",
  description: "ここから要素の挿入や照会を試せます。",
  baseState: createEmptyBloomState(),
  finalState: createEmptyBloomState(),
  steps: [],
};
