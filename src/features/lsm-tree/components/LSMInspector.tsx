import { ScenarioWatchPoints } from "../../../components/ScenarioWatchPoints";
import { getLSMMetrics } from "../simulation";
import { LSMState, LSMStep } from "../types";

interface LSMInspectorProps {
  step?: LSMStep;
  lsmState: LSMState;
  scenarioTitle: string;
  scenarioDescription: string;
  watchPoints?: string[];
}

export function LSMInspector({
  step,
  lsmState,
  scenarioTitle,
  scenarioDescription,
  watchPoints,
}: LSMInspectorProps) {
  const metrics = step?.metrics ?? getLSMMetrics(lsmState);

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
          <span>WAL entries</span>
          <strong>{metrics.walEntries}</strong>
        </div>
        <div className="stat-card">
          <span>Memtable</span>
          <strong>{metrics.memtableEntries}</strong>
        </div>
        <div className="stat-card">
          <span>SSTables</span>
          <strong>{metrics.sstableCount}</strong>
        </div>
        <div className="stat-card">
          <span>Read sources</span>
          <strong>{metrics.readSources}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Current target</p>
        <strong>{step?.highlights.activeKey ?? lsmState.activeKey ?? "-"}</strong>
        <span>
          search は memtable から始まり、新しい SSTable から古い SSTable へ順番に確認します。
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">Search result</p>
        <strong>{lsmState.searchResult ?? "-"}</strong>
        <span>
          tombstone が見つかると、古い SSTable に値が残っていても削除済みとして扱います。
        </span>
      </div>

      <div className="concept-card">
        <p className="detail-label">LSM-tree note</p>
        <span>
          LSM-tree は write を memtable に集めて sequential flush します。
          その代わり SSTable が増えると read amplification が増え、compaction が必要になります。
        </span>
      </div>
    </aside>
  );
}
