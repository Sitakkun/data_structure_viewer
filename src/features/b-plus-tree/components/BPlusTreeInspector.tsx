import { TreeStepComparisonCard } from "../../../components/TreeStepComparisonCard";
import { getBPlusTreeCost } from "../../treeCost";
import { TreeStepComparisonSummary } from "../../treeStepComparison";
import { BPlusTreeState, BPlusTreeStep } from "../types";

interface BPlusTreeInspectorProps {
  step?: BPlusTreeStep;
  bplusTreeState: BPlusTreeState;
  scenarioTitle: string;
  scenarioDescription: string;
  comparison?: TreeStepComparisonSummary;
}

export function BPlusTreeInspector({
  step,
  bplusTreeState,
  scenarioTitle,
  scenarioDescription,
  comparison,
}: BPlusTreeInspectorProps) {
  const rangeLabel =
    bplusTreeState.activeRangeStart !== undefined &&
    bplusTreeState.activeRangeEnd !== undefined
      ? `${bplusTreeState.activeRangeStart}..${bplusTreeState.activeRangeEnd}`
      : undefined;
  const collectedKeys = bplusTreeState.collectedKeys ?? [];
  const cost = getBPlusTreeCost(step?.operation, collectedKeys.length);

  return (
    <aside className="panel panel-inspector">
      <div className="panel-header">
        <p className="eyebrow">Step Log</p>
        <h2>{step?.title ?? scenarioTitle}</h2>
        <p className="panel-copy">{step?.explanation ?? scenarioDescription}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Height</span>
          <strong>{step?.metrics.height ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Node count</span>
          <strong>{step?.metrics.nodeCount ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Leaf count</span>
          <strong>{step?.metrics.leafCount ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Cost</span>
          <strong>{cost.notation}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Cost breakdown</p>
        <strong>{cost.notation}</strong>
        <span>{cost.detail}</span>
      </div>

      <div className="detail-card">
        <p className="detail-label">Current target</p>
        <strong>{rangeLabel ?? bplusTreeState.activeKey ?? "-"}</strong>
        <span>
          {rangeLabel
            ? "範囲走査では、開始葉まで木を降りたあと leaf chain を右へたどります。"
            : step?.highlights.promotedKey !== undefined
            ? `このステップでは ${step.highlights.promotedKey} が親ノードのセパレータとして使われます。`
            : "探索または挿入の対象キーです。"}
        </span>
      </div>

      {rangeLabel ? (
        <div className="detail-card">
          <p className="detail-label">Collected keys</p>
          <strong>{collectedKeys.length ? collectedKeys.join(", ") : "-"}</strong>
          <span>
            範囲内に入った葉のキーだけを順番に追加します。終了キーを超えた時点で走査を止めます。
          </span>
        </div>
      ) : null}

      <div className="detail-card">
        <p className="detail-label">Path</p>
        <strong>
          {step?.highlights.pathNodeIds.length
            ? step.highlights.pathNodeIds.join(" -> ")
            : "-"}
        </strong>
        <span>
          B+ Tree では内部ノードは経路案内だけを行い、最後の葉ノードまでたどって結果を確定します。
        </span>
      </div>

      <div className="concept-card">
        <p className="detail-label">B+ tree note</p>
        <span>
          実データがすべて葉に集約され、葉同士が順番に連結されるので、範囲走査や順次読み出しに向いています。
        </span>
      </div>

      <TreeStepComparisonCard comparison={comparison} />
    </aside>
  );
}
