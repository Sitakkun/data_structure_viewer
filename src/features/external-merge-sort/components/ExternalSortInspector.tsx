import { ScenarioWatchPoints } from "../../../components/ScenarioWatchPoints";
import { ExternalSortState, ExternalSortStep } from "../types";

interface ExternalSortInspectorProps {
  step?: ExternalSortStep;
  sortState: ExternalSortState;
  scenarioTitle: string;
  scenarioDescription: string;
  watchPoints?: string[];
}

function formatPages(count: number) {
  return `${count} pages`;
}

export function ExternalSortInspector({
  step,
  sortState,
  scenarioTitle,
  scenarioDescription,
  watchPoints,
}: ExternalSortInspectorProps) {
  const { plan } = sortState;
  const currentRead = sortState.cumulativeReadPages;
  const currentWrite = sortState.cumulativeWritePages;

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
          <span>Initial runs</span>
          <strong>{plan.initialRuns.length}</strong>
        </div>
        <div className="stat-card">
          <span>Merge fan-in</span>
          <strong>{plan.mergeFanIn}</strong>
        </div>
        <div className="stat-card">
          <span>Merge passes</span>
          <strong>{plan.mergePasses.length}</strong>
        </div>
        <div className="stat-card">
          <span>Total I/O</span>
          <strong>{formatPages(plan.totalIoPages)}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Current cumulative cost</p>
        <strong>
          {formatPages(currentRead)} read / {formatPages(currentWrite)} write
        </strong>
        <span>
          run generation と各 merge pass は、教材モデルでは relation 全体を read/write する pass として数えます。
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">Buffer rule</p>
        <strong>B buffers → {plan.mergeFanIn}-way merge</strong>
        <span>
          output buffer を 1 つ確保するため、同時に merge できる input run は buffer count - 1 本です。
        </span>
      </div>

      <div className="concept-card">
        <p className="detail-label">Why more buffers help</p>
        <span>
          fan-in が大きいほど run 数が速く減ります。merge pass が 1 回減ると、
          このモデルでは read と write がそれぞれ record count 分だけ減ります。
        </span>
      </div>
    </aside>
  );
}
