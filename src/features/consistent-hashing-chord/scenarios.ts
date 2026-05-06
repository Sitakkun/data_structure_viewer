import { buildChordScenario, createChordState } from "./simulation";
import { ChordScenario } from "./types";

const baseNodeSpecs = [
  { id: "Node 1", hash: 1 },
  { id: "Node 6", hash: 6 },
  { id: "Node 11", hash: 11 },
  { id: "Node 16", hash: 16 },
  { id: "Node 22", hash: 22 },
  { id: "Node 27", hash: 27 },
];

const baseResources = [
  "chunk-99",
  "metrics-rollup",
  "session-cache",
  "video-archive",
  "avatar-01",
  "profile-image",
];

export const chordScenarios: ChordScenario[] = [
  buildChordScenario(
    "chord-direct",
    "近いノードへ短く届く",
    "開始ノードがターゲットに近い場合、Chord はほとんど遠回りせず担当ノードへ着きます。",
    baseNodeSpecs,
    baseResources,
    { type: "lookup-resource", resourceId: "search-index", startNodeId: "Node 11" },
  ),
  buildChordScenario(
    "chord-finger-jump",
    "finger で大きくジャンプする",
    "遠いターゲットへ向かうときは、後継を 1 個ずつなぞらず、最も遠くまで進める finger を選びます。",
    baseNodeSpecs,
    baseResources,
    { type: "lookup-resource", resourceId: "profile-image", startNodeId: "Node 1" },
  ),
  buildChordScenario(
    "chord-wrap",
    "リング末尾から先頭へ回り込む",
    "ターゲットがリング先頭側にある場合、探索経路は末尾から先頭へ自然に巻き戻ります。",
    baseNodeSpecs,
    baseResources,
    { type: "lookup-resource", resourceId: "chunk-99", startNodeId: "Node 22" },
  ),
];

export const emptyChordScenario: ChordScenario = {
  id: "chord-empty",
  title: "Chord フィンガーテーブル",
  description:
    "開始ノードを選んでリソース探索を実行すると、finger table を使ったジャンプ経路を追えます。",
  baseState: createChordState(baseNodeSpecs, baseResources),
  finalState: createChordState(baseNodeSpecs, baseResources),
  steps: [],
};
