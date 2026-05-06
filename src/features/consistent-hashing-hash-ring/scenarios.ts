import { buildRingScenario, createEmptyRingState } from "./simulation";
import { RingScenario } from "./types";

export const hashRingScenarios: RingScenario[] = [
  buildRingScenario(
    "hash-ring-lookup-resource",
    "リソースの担当ノードを探す",
    "登録済みリソースも新規リソースも、位置から時計回りに最初のノードへ割り当てます。",
    ["Node A", "Node D", "Node K"],
    ["avatar-01", "feed-202", "video-archive"],
    { type: "lookup-resource", resourceId: "user-profile" },
  ),
  buildRingScenario(
    "hash-ring-add-resource",
    "新しいリソースを登録する",
    "リング上の位置を求めたあと、時計回りで最初のノードへ新しいリソースを割り当てます。",
    ["Node A", "Node D", "Node K"],
    ["avatar-01", "feed-202", "video-archive"],
    { type: "add-resource", resourceId: "log-segment-9" },
  ),
  buildRingScenario(
    "hash-ring-join",
    "ノード追加で一部だけ動く",
    "新しいノードが入っても、その直前から新ノードまでの区間にあるリソースだけが再割り当てされます。",
    ["Node A", "Node D", "Node K"],
    ["avatar-01", "feed-202", "video-archive", "search-index", "metrics-rollup"],
    { type: "add-node", nodeId: "Node G" },
  ),
  buildRingScenario(
    "hash-ring-leave",
    "ノード削除で後継へ引き継ぐ",
    "削除されたノードが持っていた範囲だけを、時計回りの次ノードが引き継ぎます。",
    ["Node A", "Node D", "Node G", "Node K"],
    ["avatar-01", "feed-202", "video-archive", "search-index", "metrics-rollup"],
    { type: "remove-node", nodeId: "Node G" },
  ),
];

export const emptyHashRingScenario: RingScenario = {
  id: "hash-ring-empty",
  title: "空のハッシュリング",
  description: "ここからリソース登録、担当ノード探索、ノード追加・削除を試せます。",
  baseState: createEmptyRingState(),
  finalState: createEmptyRingState(),
  steps: [],
};
