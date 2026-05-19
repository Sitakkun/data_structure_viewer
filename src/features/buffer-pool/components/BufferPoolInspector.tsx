import { ScenarioWatchPoints } from "../../../components/ScenarioWatchPoints";
import { BufferPoolState, BufferPoolStep } from "../types";

interface BufferPoolInspectorProps {
  step?: BufferPoolStep;
  bufferState: BufferPoolState;
  scenarioTitle: string;
  scenarioDescription: string;
  watchPoints?: string[];
}

function formatHitRatio(state: BufferPoolState) {
  const total = state.metrics.hits + state.metrics.misses;
  if (total === 0) {
    return "0%";
  }
  return `${Math.round((state.metrics.hits / total) * 100)}%`;
}

export function BufferPoolInspector({
  step,
  bufferState,
  scenarioTitle,
  scenarioDescription,
  watchPoints,
}: BufferPoolInspectorProps) {
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
          <span>Hit ratio</span>
          <strong>{formatHitRatio(bufferState)}</strong>
        </div>
        <div className="stat-card">
          <span>Physical reads</span>
          <strong>{bufferState.metrics.physicalReads}</strong>
        </div>
        <div className="stat-card">
          <span>Physical writes</span>
          <strong>{bufferState.metrics.physicalWrites}</strong>
        </div>
        <div className="stat-card">
          <span>Evictions</span>
          <strong>{bufferState.metrics.evictions}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Current page</p>
        <strong>{step?.highlights.activePageId ?? "-"}</strong>
        <span>
          page が frame にあれば hit、なければ miss です。miss 時は free frame または victim frame が必要です。
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">Replacement policy</p>
        <strong>{bufferState.policy.toUpperCase()}</strong>
        <span>
          LRU は最も古く使われた unpinned page を選び、CLOCK は reference bit を落としながら second chance を与えます。
        </span>
      </div>

      <div className="concept-card">
        <p className="detail-label">DB note</p>
        <span>
          実際の DBMS は単純な LRU/CLOCK だけでなく、scan や hot page を考慮した改良を持ちます。
          このページでは基本の replacement cost と dirty writeback を学習対象にしています。
        </span>
      </div>
    </aside>
  );
}
