import {
  buildBPlusTreeScenario,
  createBPlusTreeStateFromKeys,
  createEmptyBPlusTreeState,
} from "./simulation";
import { BPlusTreeScenario } from "./types";

export const bplusTreeScenarios: BPlusTreeScenario[] = [
  buildBPlusTreeScenario(
    "bplus-insert-leaf",
    "葉ノードへそのまま挿入する",
    "B+ Tree では実データは葉にだけ置かれるので、空きのある葉ならそのまま追加します。",
    [10, 20],
    { type: "insert", key: 15 },
  ),
  buildBPlusTreeScenario(
    "bplus-root-split",
    "葉が根のまま分割する",
    "根が葉ノードのまま満杯だと、葉を 2 つに分けて内部ノードを新しい根にします。",
    [10, 20, 30],
    { type: "insert", key: 25 },
  ),
  buildBPlusTreeScenario(
    "bplus-child-split",
    "途中の葉ノードを分割する",
    "下降先の葉ノードが満杯なら、その葉を分割して右側の先頭キーを親のセパレータへ追加します。",
    [10, 20, 30, 40, 50, 60],
    { type: "insert", key: 35 },
  ),
  buildBPlusTreeScenario(
    "bplus-search-hit",
    "存在するキーを探す",
    "内部ノードは経路案内だけを行い、最終的な一致確認は葉ノードで行います。",
    [10, 20, 30, 40, 50, 60],
    { type: "search", key: 50 },
  ),
  buildBPlusTreeScenario(
    "bplus-search-miss",
    "存在しないキーを探す",
    "葉まで降りても見つからなければ、そのキーは B+ Tree に存在しません。",
    [10, 20, 30, 40, 50, 60],
    { type: "search", key: 55 },
  ),
  buildBPlusTreeScenario(
    "bplus-delete-leaf",
    "葉ノードからキーを削除する",
    "underflow が起きない葉ノードでは、葉からキーを取り除き、必要なら separator を更新します。",
    [10, 20, 30, 40, 50, 60],
    { type: "delete", key: 60 },
  ),
  buildBPlusTreeScenario(
    "bplus-delete-underflow",
    "削除で leaf merge が必要になる",
    "最小キー数の葉から削除しようとすると、leaf merge や親 separator の調整が必要になります。",
    [10, 20, 30, 40, 50, 60],
    { type: "delete", key: 10 },
  ),
  buildBPlusTreeScenario(
    "bplus-range-single-leaf",
    "1 枚の葉だけを範囲走査する",
    "開始キーを含む葉まで降り、その葉の中だけで範囲内のキーを回収します。",
    [10, 20, 30, 40, 50, 60],
    { type: "range-scan", startKey: 30, endKey: 40 },
  ),
  buildBPlusTreeScenario(
    "bplus-range-cross-leaves",
    "複数の葉をまたいで範囲走査する",
    "開始葉で読み始め、next leaf をたどって範囲内のキーを連続して回収します。",
    [5, 10, 15, 20, 25, 30, 35, 40, 45],
    { type: "range-scan", startKey: 12, endKey: 37 },
  ),
  buildBPlusTreeScenario(
    "bplus-sequential-scan",
    "先頭から順に読む",
    "広い範囲を指定すると、leaf chain を先頭付近から最後までたどる順次読み出しとして確認できます。",
    [5, 10, 15, 20, 25, 30, 35, 40, 45],
    { type: "range-scan", startKey: 0, endKey: 99 },
  ),
];

export const emptyBPlusTreeScenario: BPlusTreeScenario = {
  id: "bplus-empty",
  title: "通常の B+ Tree",
  description:
    "ここから挿入、探索、範囲走査を試せます。通常の B+ Tree として delete は省略しています。",
  baseState: createEmptyBPlusTreeState(),
  finalState: createEmptyBPlusTreeState(),
  steps: [],
};

export const seededBPlusTreeScenario: BPlusTreeScenario = {
  id: "bplus-seeded",
  title: "初期データ入りの B+ Tree",
  description: "内部ノードのセパレータと葉ノードの連結を確認しながら、手動で挿入、探索、範囲走査を試せます。",
  watchPoints: [
    "内部ノードは経路案内、実データは葉にあるという役割分担を見る。",
    "Range Scan では開始葉まで降りた後、leaf chain をたどる点を見る。",
  ],
  baseState: createBPlusTreeStateFromKeys([10, 20, 30, 40, 50, 60]),
  finalState: createBPlusTreeStateFromKeys([10, 20, 30, 40, 50, 60]),
  steps: [],
};
