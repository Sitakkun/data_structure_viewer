import { TreeStepComparisonSummary } from "../features/treeStepComparison";

interface TreeStepComparisonCardProps {
  comparison?: TreeStepComparisonSummary;
}

export function TreeStepComparisonCard({
  comparison,
}: TreeStepComparisonCardProps) {
  if (!comparison) {
    return (
      <div className="concept-card">
        <p className="detail-label">Step comparison</p>
        <span>
          Search / Insert / Delete / Range Scan を実行するか、サンプルを読み込むと
          B-tree と B+ Tree の step 数を比較できます。
        </span>
      </div>
    );
  }

  const stepDelta = comparison.primarySteps - comparison.counterpartSteps;
  const deltaLabel =
    stepDelta === 0
      ? "同じ step 数です。"
      : stepDelta > 0
        ? `${comparison.primaryLabel} のほうが ${stepDelta} step 多いです。`
        : `${comparison.primaryLabel} のほうが ${Math.abs(stepDelta)} step 少ないです。`;

  return (
    <div className="detail-card comparison-card">
      <p className="detail-label">Step comparison</p>
      <strong>
        {comparison.operation.toUpperCase()} {comparison.targetLabel}
      </strong>
      <div className="comparison-grid">
        <div className="comparison-metric">
          <span>{comparison.primaryLabel}</span>
          <strong>{comparison.primaryCost}</strong>
          <small>{comparison.primarySteps} steps</small>
        </div>
        <div className="comparison-metric">
          <span>{comparison.counterpartLabel}</span>
          <strong>{comparison.counterpartCost}</strong>
          <small>{comparison.counterpartSteps} steps</small>
        </div>
      </div>
      <span>
        同じ挿入履歴から再構成した木で比較しています。計算量の形は同じでも、可視化 step 数は実際の経路や split の有無で変わります。{deltaLabel}
      </span>
    </div>
  );
}
