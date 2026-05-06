import {
  buildBEpsilonScenario,
  cloneBEpsilonState,
  createBufferedBEpsilonState,
  createLeafBufferedBEpsilonState,
  createLeafOverflowBEpsilonState,
  createSeededBEpsilonState,
} from "./simulation";
import { BEpsilonScenario } from "./types";

export const seededBEpsilonScenario: BEpsilonScenario = {
  id: "bepsilon-seeded",
  title: "Buffered Bε-style Tree",
  description:
    "固定 fanout の小さな木で、insert/delete を message として buffer に貯め、flush で下位ノードへまとめて送る動きを確認できます。",
  baseState: createSeededBEpsilonState(),
  finalState: createSeededBEpsilonState(),
  steps: [],
};

export const bEpsilonScenarios: BEpsilonScenario[] = [
  buildBEpsilonScenario(
    "bepsilon-buffer-insert",
    "Insert を root buffer に貯める",
    "更新をすぐ葉へ書かず、root buffer に insert message として追加します。",
    createSeededBEpsilonState(),
    { type: "insert", key: 25 },
  ),
  buildBEpsilonScenario(
    "bepsilon-root-flush",
    "Root buffer を child へ flush する",
    "root に溜まった複数メッセージを separator key で仕分けし、対象 child の buffer へまとめて送ります。",
    createBufferedBEpsilonState(),
    { type: "flush" },
  ),
  buildBEpsilonScenario(
    "bepsilon-leaf-apply",
    "Leaf buffer を実データへ反映する",
    "葉に届いた insert/delete message を record に適用し、tombstone なら既存 record を削除します。",
    createLeafBufferedBEpsilonState(),
    { type: "flush" },
  ),
  buildBEpsilonScenario(
    "bepsilon-leaf-split-root-split",
    "Leaf split から中間ノードを作る",
    "葉の record capacity 超過で leaf split が起き、親 root も満杯なので新しい root と中間ノードが生成されます。",
    createLeafOverflowBEpsilonState(),
    { type: "flush" },
  ),
  buildBEpsilonScenario(
    "bepsilon-search-buffer-hit",
    "Buffer に残る insert を検索する",
    "まだ葉に反映されていない key でも、検索パス上の buffer に insert message があれば存在すると判断します。",
    createBufferedBEpsilonState(),
    { type: "search", key: 42 },
  ),
  buildBEpsilonScenario(
    "bepsilon-delete-tombstone",
    "Delete を tombstone として貯める",
    "削除も即時に葉を書き換えず、delete message として buffer に追加します。",
    createSeededBEpsilonState(),
    { type: "delete", key: 45 },
  ),
];

export function findBEpsilonScenarioById(id: string): BEpsilonScenario {
  if (id === seededBEpsilonScenario.id) {
    return seededBEpsilonScenario;
  }

  return (
    bEpsilonScenarios.find((scenario) => scenario.id === id) ??
    seededBEpsilonScenario
  );
}

export function cloneScenarioSteps(scenario: BEpsilonScenario) {
  return scenario.steps.map((step) => ({
    ...step,
    bepsilonState: cloneBEpsilonState(step.bepsilonState),
  }));
}
