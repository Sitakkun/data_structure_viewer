import { Step, TableState } from "../types";
import {
  calculateSize,
  calculateTotalCollisions,
} from "../simulation";

interface StepInspectorProps {
  step?: Step;
  tableState: TableState;
  currentScenarioTitle: string;
  currentScenarioDescription: string;
  conceptTitle: string;
  conceptNote: string;
}

function formatLoadFactor(tableState: TableState) {
  return (calculateSize(tableState) / tableState.bucketCount).toFixed(2);
}

export function StepInspector({
  step,
  tableState,
  currentScenarioTitle,
  currentScenarioDescription,
  conceptTitle,
  conceptNote,
}: StepInspectorProps) {
  const size = calculateSize(tableState);
  const totalCollisions = calculateTotalCollisions(tableState);

  return (
    <aside className="panel panel-inspector">
      <div className="panel-header">
        <p className="eyebrow">Step Log</p>
        <h2>{step?.title ?? currentScenarioTitle}</h2>
        <p className="panel-copy">
          {step?.explanation ?? currentScenarioDescription}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Hash value</span>
          <strong>{step ? step.hashValue : "-"}</strong>
        </div>
        <div className="stat-card">
          <span>Index</span>
          <strong>{step ? step.bucketIndex : "-"}</strong>
        </div>
        <div className="stat-card">
          <span>Comparisons</span>
          <strong>{step ? step.metrics.comparisons : 0}</strong>
        </div>
        <div className="stat-card">
          <span>Load factor α</span>
          <strong>{step ? step.metrics.loadFactor.toFixed(2) : formatLoadFactor(tableState)}</strong>
        </div>
        <div className="stat-card">
          <span>Total collisions</span>
          <strong>{step ? step.metrics.totalCollisions : totalCollisions}</strong>
        </div>
        <div className="stat-card">
          <span>Operation collision</span>
          <strong>{step ? step.metrics.operationCollisions : 0}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Current focus</p>
        <strong>
          {step
            ? `Index ${step.bucketIndex}`
            : "Insert / Search / Delete を実行すると詳細が出ます"}
        </strong>
        <span>
          {step?.highlights.activeNodeValue !== undefined
            ? `比較中のノード: ${step.highlights.activeNodeValue}`
            : "全体の配置よりも、いま見ている 1 箇所の比較や移動を追うのがポイントです。"}
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">What changed</p>
        <strong>{step?.highlights.mode ?? "idle"}</strong>
        <span>
          {step
            ? step.explanation
            : "サンプルを読み込むか、キーを入れて操作を始めてください。"}
        </span>
      </div>

      <div className="concept-card">
        <p className="detail-label">{conceptTitle}</p>
        <span>{conceptNote}</span>
      </div>
    </aside>
  );
}
