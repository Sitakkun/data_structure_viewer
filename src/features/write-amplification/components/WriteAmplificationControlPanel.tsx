import {
  WorkloadConfig,
  WriteAmplificationScenario,
  WriteOperation,
} from "../types";

interface WriteAmplificationControlPanelProps {
  config: WorkloadConfig;
  onConfigChange: (config: WorkloadConfig) => void;
  onRun: () => void;
  onLoadScenario: (scenarioId: string) => void;
  scenarios: WriteAmplificationScenario[];
  selectedScenarioId: string;
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}

const speedOptions = [
  { label: "Slow", value: 1400 },
  { label: "Medium", value: 900 },
  { label: "Fast", value: 500 },
];

function clampInteger(value: string, min: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }
  return Math.max(min, parsed);
}

export function WriteAmplificationControlPanel({
  config,
  onConfigChange,
  onRun,
  onLoadScenario,
  scenarios,
  selectedScenarioId,
  currentStepIndex,
  totalSteps,
  isPlaying,
  playbackSpeed,
  onPlaybackSpeedChange,
  onPlayPause,
  onPrev,
  onNext,
  onReset,
}: WriteAmplificationControlPanelProps) {
  function updateConfig(nextConfig: Partial<WorkloadConfig>) {
    onConfigChange({ ...config, ...nextConfig });
  }

  return (
    <aside className="panel panel-controls">
      <div className="panel-header">
        <p className="eyebrow">Workload</p>
        <h2>WA を比較する</h2>
      </div>

      <section className="panel-section">
        <div className="section-heading">
          <p className="eyebrow">Playback</p>
          <span>
            Step {Math.max(currentStepIndex + 1, 0)} / {totalSteps}
          </span>
        </div>
        <p className="section-subtitle">Shortcuts: ← Prev / → Next / R Reset</p>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={onReset}>
            Reset
          </button>
          <button type="button" className="secondary-button" onClick={onPrev}>
            Prev
          </button>
          <button type="button" className="accent-button" onClick={onPlayPause}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button type="button" className="secondary-button" onClick={onNext}>
            Next
          </button>
        </div>

        <div className="speed-row" role="group" aria-label="Playback speed">
          {speedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                option.value === playbackSpeed
                  ? "speed-button is-selected"
                  : "speed-button"
              }
              onClick={() => onPlaybackSpeedChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <label className="field-label" htmlFor="wa-operation">
          Operation
        </label>
        <select
          id="wa-operation"
          className="text-input select-input"
          value={config.operation}
          onChange={(event) =>
            updateConfig({ operation: event.target.value as WriteOperation })
          }
        >
          <option value="insert">Insert</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>

        <label className="field-label field-label-spaced" htmlFor="wa-count">
          Logical writes
        </label>
        <input
          id="wa-count"
          className="text-input"
          type="number"
          min={1}
          value={config.count}
          onChange={(event) =>
            updateConfig({
              count: clampInteger(event.target.value, 1, config.count),
            })
          }
        />

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={config.walEnabled}
            onChange={(event) => updateConfig({ walEnabled: event.target.checked })}
          />
          WAL enabled
        </label>

        <button
          type="button"
          className="accent-button single-action"
          onClick={onRun}
        >
          Run Comparison
        </button>
      </section>

      <section className="panel-section">
        <div className="section-heading">
          <p className="eyebrow">Model knobs</p>
        </div>
        <label className="field-label" htmlFor="wa-btree-split">
          B-tree split every N writes
        </label>
        <input
          id="wa-btree-split"
          className="text-input"
          type="number"
          min={1}
          value={config.btreeSplitEvery}
          onChange={(event) =>
            updateConfig({
              btreeSplitEvery: clampInteger(
                event.target.value,
                1,
                config.btreeSplitEvery,
              ),
            })
          }
        />

        <label className="field-label field-label-spaced" htmlFor="wa-be-buffer">
          Bε buffer capacity
        </label>
        <input
          id="wa-be-buffer"
          className="text-input"
          type="number"
          min={1}
          value={config.bepsilonBufferCapacity}
          onChange={(event) =>
            updateConfig({
              bepsilonBufferCapacity: clampInteger(
                event.target.value,
                1,
                config.bepsilonBufferCapacity,
              ),
            })
          }
        />

        <label className="field-label field-label-spaced" htmlFor="wa-lsm-memtable">
          LSM memtable capacity
        </label>
        <input
          id="wa-lsm-memtable"
          className="text-input"
          type="number"
          min={1}
          value={config.lsmMemtableCapacity}
          onChange={(event) =>
            updateConfig({
              lsmMemtableCapacity: clampInteger(
                event.target.value,
                1,
                config.lsmMemtableCapacity,
              ),
            })
          }
        />

        <label className="field-label field-label-spaced" htmlFor="wa-lsm-fanout">
          LSM compaction fanout
        </label>
        <input
          id="wa-lsm-fanout"
          className="text-input"
          type="number"
          min={2}
          value={config.lsmCompactionFanout}
          onChange={(event) =>
            updateConfig({
              lsmCompactionFanout: clampInteger(
                event.target.value,
                2,
                config.lsmCompactionFanout,
              ),
            })
          }
        />
      </section>

      <section className="panel-section">
        <div className="section-heading">
          <p className="eyebrow">Samples</p>
          <span>{scenarios.length} scenarios</span>
        </div>
        <div className="scenario-list">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className={
                scenario.id === selectedScenarioId
                  ? "scenario-card is-selected"
                  : "scenario-card"
              }
              onClick={() => onLoadScenario(scenario.id)}
            >
              <strong>{scenario.title}</strong>
              <span>{scenario.description}</span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
