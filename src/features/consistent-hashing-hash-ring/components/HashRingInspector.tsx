import { ScenarioWatchPoints } from "../../../components/ScenarioWatchPoints";
import { RingState, RingStep } from "../types";

interface HashRingInspectorProps {
  step?: RingStep;
  ringState: RingState;
  scenarioTitle: string;
  scenarioDescription: string;
  watchPoints?: string[];
}

export function HashRingInspector({
  step,
  ringState,
  scenarioTitle,
  scenarioDescription,
  watchPoints,
}: HashRingInspectorProps) {
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
          <span>Node count</span>
          <strong>{step?.metrics.nodeCount ?? ringState.nodes.length}</strong>
        </div>
        <div className="stat-card">
          <span>Resource count</span>
          <strong>{step?.metrics.resourceCount ?? ringState.resources.length}</strong>
        </div>
        <div className="stat-card">
          <span>Focus hash</span>
          <strong>{step?.highlights.activeResourceHash ?? "-"}</strong>
        </div>
        <div className="stat-card">
          <span>Comparisons</span>
          <strong>{step?.metrics.comparisons ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Assigned node</span>
          <strong>{ringState.activeResource?.assignedNodeId ?? "-"}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Current focus</p>
        <strong>
          {step?.highlights.activeResourceId ??
            step?.highlights.activeNodeId ??
            "リング全体"}
        </strong>
        <span>
          {step?.highlights.mode === "wrap"
            ? "右側に候補がないので、リングの先頭へ巻き戻っています。"
            : "リソース位置から時計回りに最初のノードを見つけるのが基本です。"}
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">What changed</p>
        <strong>{step?.highlights.mode ?? "idle"}</strong>
        <span>
          {step
            ? step.metrics.remappedResourcesHint
            : "サンプルを読み込むか、リソース登録やノード操作を試してみてください。"}
        </span>
      </div>

      <div className="concept-card">
        <p className="detail-label">Hash ring note</p>
        <span>
          コンシステントハッシュでは、1 ノードに複数リソースを持たせたまま、
          ノード追加や削除の影響を受ける区間だけを再配置します。
        </span>
      </div>
    </aside>
  );
}
