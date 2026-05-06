import type { BPlusTreeOperation } from "./b-plus-tree/types";
import type { BTreeOperation } from "./b-tree/types";

export interface TreeCostInfo {
  notation: string;
  detail: string;
}

export function getBTreeCost(
  operation?: BTreeOperation,
  collectedCount = 0,
): TreeCostInfo {
  if (operation === "range-scan") {
    return {
      notation: "O(log n + k)",
      detail: `開始位置へ近づいたあと、順序に沿って k 個の結果を読みます。sibling pointer がある実装では隣接ノードへ進みます。現在 k = ${collectedCount} です。`,
    };
  }

  if (operation === "insert") {
    return {
      notation: "O(log n)",
      detail: "根から挿入先までの高さに比例します。満杯ノードでは split が追加で起きます。",
    };
  }

  if (operation === "delete") {
    return {
      notation: "O(log n)",
      detail: "根から削除対象まで降ります。underflow が起きる場合は借用やマージが追加で必要です。",
    };
  }

  if (operation === "search") {
    return {
      notation: "O(log n)",
      detail: "根から目的キーのある位置まで、必要な部分木だけを降ります。",
    };
  }

  return {
    notation: "-",
    detail: "操作を実行すると計算量の目安が表示されます。",
  };
}

export function getBPlusTreeCost(
  operation?: BPlusTreeOperation,
  collectedCount = 0,
): TreeCostInfo {
  if (operation === "range-scan") {
    return {
      notation: "O(log n + k)",
      detail: `log n で開始葉を探し、k 個の結果を leaf chain から読みます。現在 k = ${collectedCount} です。`,
    };
  }

  if (operation === "insert") {
    return {
      notation: "O(log n)",
      detail: "根から挿入先の葉まで降ります。葉や内部ノードが満杯なら split が追加で起きます。",
    };
  }

  if (operation === "delete") {
    return {
      notation: "O(log n)",
      detail: "根から削除対象の葉まで降ります。underflow が起きる場合は leaf merge や separator 更新が必要です。",
    };
  }

  if (operation === "search") {
    return {
      notation: "O(log n)",
      detail: "内部ノードで経路を絞り、最後に葉ノードで一致を確認します。",
    };
  }

  return {
    notation: "-",
    detail: "操作を実行すると計算量の目安が表示されます。",
  };
}
