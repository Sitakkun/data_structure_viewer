import { engineLabel } from "../simulation";
import {
  EngineWriteSummary,
  WriteEngine,
  WriteEvent,
  WriteAmplificationStep,
} from "../types";

interface WriteAmplificationFlowViewProps {
  step?: WriteAmplificationStep;
  summaries: Record<WriteEngine, EngineWriteSummary>;
}

const engineOrder: WriteEngine[] = ["btree", "bepsilon", "lsm"];

function formatUnits(units: number) {
  return units === 0 ? "0" : units.toFixed(units % 1 === 0 ? 0 : 2);
}

function layerLabel(event: WriteEvent) {
  return event.layer.replace("-", " ");
}

export function WriteAmplificationFlowView({
  step,
  summaries,
}: WriteAmplificationFlowViewProps) {
  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>Write Path Comparison</h2>
        <p className="panel-copy">
          同じ logical write が、各ストレージ構造でどの write path に分解されるかを比較します。
        </p>
      </div>

      <div className="wa-engine-grid">
        {engineOrder.map((engine) => {
          const summary = summaries[engine];
          const isActiveEngine = step?.activeEngine === engine;

          return (
            <article
              key={engine}
              className={[
                "wa-engine-card",
                `wa-engine-${engine}`,
                isActiveEngine ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="wa-engine-header">
                <div>
                  <p className="eyebrow">{engineLabel(engine)}</p>
                  <strong>{summary.writeAmplification.toFixed(2)}x WA</strong>
                </div>
                <span>{formatUnits(summary.physicalWriteUnits)} units</span>
              </div>

              <div className="wa-event-list">
                {summary.events.map((event) => (
                  <div
                    key={event.id}
                    className={[
                      "wa-event-row",
                      event.id === step?.activeEventId ? "is-active" : "",
                      event.units === 0 ? "is-memory" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="wa-event-layer">{layerLabel(event)}</span>
                    <strong>{event.label}</strong>
                    <span className="wa-event-units">
                      +{formatUnits(event.units)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="wa-model-note">
        この数値は教材用の normalized write units です。実際の DB では page size、
        WAL format、checkpoint、compression、replication、storage layout によって変わります。
      </div>
    </section>
  );
}
