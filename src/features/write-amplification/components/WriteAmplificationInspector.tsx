import { ScenarioWatchPoints } from "../../../components/ScenarioWatchPoints";
import { engineLabel } from "../simulation";
import {
  EngineWriteSummary,
  WriteEngine,
  WriteAmplificationStep,
} from "../types";

interface WriteAmplificationInspectorProps {
  step?: WriteAmplificationStep;
  summaries: Record<WriteEngine, EngineWriteSummary>;
  scenarioTitle: string;
  scenarioDescription: string;
  watchPoints?: string[];
}

const engineOrder: WriteEngine[] = ["btree", "bepsilon", "lsm"];

export function WriteAmplificationInspector({
  step,
  summaries,
  scenarioTitle,
  scenarioDescription,
  watchPoints,
}: WriteAmplificationInspectorProps) {
  const bestEngine = [...engineOrder].sort(
    (left, right) =>
      summaries[left].writeAmplification - summaries[right].writeAmplification,
  )[0];

  return (
    <aside className="panel panel-inspector">
      <div className="panel-header">
        <p className="eyebrow">Step Log</p>
        <h2>{step?.title ?? scenarioTitle}</h2>
        <p className="panel-copy">{step?.explanation ?? scenarioDescription}</p>
      </div>

      <ScenarioWatchPoints watchPoints={watchPoints} isVisible={!step} />

      <div className="stats-grid">
        {engineOrder.map((engine) => (
          <div key={engine} className="stat-card">
            <span>{engineLabel(engine)}</span>
            <strong>{summaries[engine].writeAmplification.toFixed(2)}x</strong>
          </div>
        ))}
        <div className="stat-card">
          <span>Best in model</span>
          <strong>{engineLabel(bestEngine)}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Formula</p>
        <strong>WA = physical write units / logical writes</strong>
        <span>
          分母はユーザーが投げた論理更新数、分子は WAL、page write-back、
          flush、compaction などを教材用単位で足したものです。
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">Book reference</p>
        <strong>詳説データベース 7.2</strong>
        <span>
          書籍では、B-tree の書き込み増幅は書き戻しや同一ノード更新、
          LSM-tree の書き込み増幅は compaction によるファイル間のデータ移動が主因として説明されています。
        </span>
      </div>

      <div className="concept-card">
        <p className="detail-label">Interpretation</p>
        <span>
          Bε tree と LSM-tree は小さなランダム更新を buffer / memtable に集めます。
          ただし、後段の flush、split、compaction で別の形の write amplification が発生します。
        </span>
      </div>
    </aside>
  );
}
