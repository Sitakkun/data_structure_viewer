import { buildBTreeScenario, createBTreeStateFromKeys, createEmptyBTreeState } from "./simulation";
import { BTreeScenario } from "./types";

export const btreeScenarios: BTreeScenario[] = [
  buildBTreeScenario(
    "btree-insert-leaf",
    "葉ノードへそのまま挿入する",
    "空きがある葉ノードに達した場合、キーは順序を保ったままその場で入ります。",
    [10, 20],
    { type: "insert", key: 15 },
  ),
  buildBTreeScenario(
    "btree-root-split",
    "根ノードを分割する",
    "根が満杯の状態で挿入すると、最初に根を分割して木の高さが 1 段増えます。",
    [10, 20, 30],
    { type: "insert", key: 25 },
  ),
  buildBTreeScenario(
    "btree-child-split",
    "途中の子ノードを分割する",
    "下降先の子ノードが満杯なら、その子を先に分割してから下へ進みます。",
    [10, 20, 30, 40, 50, 60],
    { type: "insert", key: 35 },
  ),
  buildBTreeScenario(
    "btree-search-hit",
    "存在するキーを探す",
    "B ツリーは各ノードのキーを比較しながら、必要な部分木だけをたどって目的のキーへ近づきます。",
    [10, 20, 30, 40, 50, 60],
    { type: "search", key: 50 },
  ),
  buildBTreeScenario(
    "btree-search-miss",
    "存在しないキーを探す",
    "葉ノードまで降りて見つからなければ、そのキーは木全体に存在しません。",
    [10, 20, 30, 40, 50, 60],
    { type: "search", key: 55 },
  ),
  buildBTreeScenario(
    "btree-delete-leaf",
    "葉ノードからキーを削除する",
    "underflow が起きない葉ノードでは、その場でキーを取り除くだけで削除できます。",
    [10, 20, 30, 40, 50, 60],
    { type: "delete", key: 60 },
  ),
  buildBTreeScenario(
    "btree-delete-underflow",
    "削除で underflow が必要になる",
    "最小キー数の葉から削除しようとすると、兄弟からの借用またはマージが必要になります。",
    [10, 20, 30, 40, 50, 60],
    { type: "delete", key: 10 },
  ),
  buildBTreeScenario(
    "btree-range-middle",
    "範囲内のキーを順序どおりに読む",
    "通常構造では部分木とノード内キーを順序どおりに確認します。範囲スキャン向けの亜種では sibling pointer を使うことがあります。",
    [10, 20, 30, 40, 50, 60],
    { type: "range-scan", startKey: 20, endKey: 50 },
  ),
  buildBTreeScenario(
    "btree-range-wide",
    "広い範囲を順に読む",
    "この可視化では木構造を順序どおりにたどって複数ノードからキーを回収します。",
    [5, 10, 15, 20, 25, 30, 35, 40, 45],
    { type: "range-scan", startKey: 12, endKey: 37 },
  ),
];

export const emptyBTreeScenario: BTreeScenario = {
  id: "btree-empty",
  title: "通常の B ツリー",
  description: "ここから挿入、探索、範囲走査を試せます。今回は通常の B ツリーとして delete は省略しています。",
  baseState: createEmptyBTreeState(),
  finalState: createEmptyBTreeState(),
  steps: [],
};

export const seededBTreeScenario: BTreeScenario = {
  id: "btree-seeded",
  title: "初期データ入りの B ツリー",
  description: "分割、探索、範囲走査の手動確認に使う初期状態です。",
  watchPoints: [
    "根から葉まで、必要な部分木だけに絞って進む経路を見る。",
    "挿入・削除・範囲走査で Cost 表示がどう変わるかを見る。",
  ],
  baseState: createBTreeStateFromKeys([10, 20, 30, 40, 50, 60]),
  finalState: createBTreeStateFromKeys([10, 20, 30, 40, 50, 60]),
  steps: [],
};
