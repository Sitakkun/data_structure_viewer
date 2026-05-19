import { TreeStepComparisonCard } from "../../../components/TreeStepComparisonCard";
import { ScenarioWatchPoints } from "../../../components/ScenarioWatchPoints";
import { getBTreeCost } from "../../treeCost";
import { TreeStepComparisonSummary } from "../../treeStepComparison";
import { BTreeState, BTreeStep } from "../types";

interface BTreeInspectorProps {
  step?: BTreeStep;
  btreeState: BTreeState;
  scenarioTitle: string;
  scenarioDescription: string;
  watchPoints?: string[];
  comparison?: TreeStepComparisonSummary;
}

export function BTreeInspector({
  step,
  btreeState,
  scenarioTitle,
  scenarioDescription,
  watchPoints,
  comparison,
}: BTreeInspectorProps) {
  const rangeLabel =
    btreeState.activeRangeStart !== undefined &&
    btreeState.activeRangeEnd !== undefined
      ? `${btreeState.activeRangeStart}..${btreeState.activeRangeEnd}`
      : undefined;
  const collectedKeys = btreeState.collectedKeys ?? [];
  const cost = getBTreeCost(step?.operation, collectedKeys.length);

  return (
    <aside className="panel panel-inspector">
      <div className="panel-header">
        <p className="eyebrow">Step Log</p>
        <h2>{step?.title ?? scenarioTitle}</h2>
        <p className="panel-copy">{step?.explanation ?? scenarioDescription}</p>
      </div>

      <ScenarioWatchPoints watchPoints={watchPoints} isVisible={!step} />

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
          <span>Cost</span>
          <strong>{cost.notation}</strong>
        </div>
        <div className="stat-card">
          <span>Max keys / node</span>
          <strong>{btreeState.maxKeysPerNode}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Current target</p>
        <strong>{rangeLabel ?? btreeState.activeKey ?? "-"}</strong>
        <span>
          {rangeLabel
            ? "範囲走査では、開始位置の近くから順序に沿ってキーを読みます。sibling pointer がある実装では隣接ノードへ進みます。"
            : step?.highlights.promotedKey !== undefined
            ? `このステップでは中央値 ${step.highlights.promotedKey} が親へ昇格します。`
            : "探索中または挿入中のキーです。"}
        </span>
      </div>

      {rangeLabel ? (
        <div className="detail-card">
          <p className="detail-label">Collected keys</p>
          <strong>{collectedKeys.length ? collectedKeys.join(", ") : "-"}</strong>
          <span>
            この可視化では通常構造を順序どおりにたどります。B ツリーの亜種では範囲スキャン用にリーフ間の sibling pointer を持つことがあります。
          </span>
        </div>
      ) : null}

      <div className="detail-card">
        <p className="detail-label">Cost breakdown</p>
        <strong>{cost.notation}</strong>
        <span>{cost.detail}</span>
      </div>

      <div className="detail-card">
        <p className="detail-label">Path</p>
        <strong>
          {step?.highlights.pathNodeIds.length
            ? step.highlights.pathNodeIds.join(" -> ")
            : "-"}
        </strong>
        <span>
          B ツリーは根から葉へ必要な部分木だけをたどります。経路を見ると、なぜ対数的に絞り込めるかが分かります。
        </span>
      </div>

      <div className="concept-card">
        <p className="detail-label">B-tree note</p>
        <span>
          通常の B ツリーでは、満杯のノードを先に分割しながら降下することで、最終的な挿入先の葉には必ず空きがあります。
        </span>
      </div>

      <TreeStepComparisonCard comparison={comparison} />
    </aside>
  );
}
