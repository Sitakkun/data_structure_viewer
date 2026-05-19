import { getBEpsilonMetrics } from "../simulation";
import { ScenarioWatchPoints } from "../../../components/ScenarioWatchPoints";
import { BEpsilonState, BEpsilonStep } from "../types";

interface BEpsilonTreeInspectorProps {
  step?: BEpsilonStep;
  bepsilonState: BEpsilonState;
  scenarioTitle: string;
  scenarioDescription: string;
  watchPoints?: string[];
}

export function BEpsilonTreeInspector({
  step,
  bepsilonState,
  scenarioTitle,
  scenarioDescription,
  watchPoints,
}: BEpsilonTreeInspectorProps) {
  const metrics = step?.metrics ?? getBEpsilonMetrics(bepsilonState);

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
          <strong>{metrics.height}</strong>
        </div>
        <div className="stat-card">
          <span>Buffered messages</span>
          <strong>{metrics.bufferedMessageCount}</strong>
        </div>
        <div className="stat-card">
          <span>Records</span>
          <strong>{metrics.recordCount}</strong>
        </div>
        <div className="stat-card">
          <span>Flush count</span>
          <strong>{metrics.flushCount}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Current target</p>
        <strong>{step?.highlights.activeKey ?? bepsilonState.activeKey ?? "-"}</strong>
        <span>
          insert/delete は対象 key を message にして root buffer へ追加します。
          search は path 上の buffer を確認してから leaf record を見ます。
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">Path</p>
        <strong>
          {step?.highlights.pathNodeIds.length
            ? step.highlights.pathNodeIds.join(" -> ")
            : "-"}
        </strong>
        <span>
          buffer に残る message は leaf record より新しい状態を表すため、検索時の path 確認が重要です。
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">Cost intuition</p>
        <strong>write: amortized batch flush</strong>
        <span>
          Bε tree は小さな更新を buffer にまとめてから下げることで write amplification を抑えます。
          overflow 時には B-tree 系と同じく split で高さや中間ノードが増えます。
        </span>
      </div>

      <div className="concept-card">
        <p className="detail-label">Book connection</p>
        <span>
          詳説データベースでは Bε tree という名称そのものより、遅延 B-tree、
          update buffer、FD-tree などの write-optimized な関連構造として説明されます。
          この画面はその buffer propagation の核だけを切り出しています。
        </span>
      </div>
    </aside>
  );
}
