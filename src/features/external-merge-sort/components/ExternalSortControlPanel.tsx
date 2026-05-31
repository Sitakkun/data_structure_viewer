import { ExternalSortScenarioDefinition } from "../types";

interface ExternalSortControlPanelProps {
  recordCountInput: string;
  runSizeInput: string;
  bufferCountInput: string;
  configError?: string;
  onRecordCountInputChange: (value: string) => void;
  onRunSizeInputChange: (value: string) => void;
  onBufferCountInputChange: (value: string) => void;
  onBuildPlan: () => void;
  onLoadScenario: (scenarioId: string) => void;
  scenarios: ExternalSortScenarioDefinition[];
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

export function ExternalSortControlPanel({
  recordCountInput,
  runSizeInput,
  bufferCountInput,
  configError,
  onRecordCountInputChange,
  onRunSizeInputChange,
  onBufferCountInputChange,
  onBuildPlan,
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
}: ExternalSortControlPanelProps) {
  return (
    <aside className="panel panel-controls">
      <div className="panel-header">
        <p className="eyebrow">Operations</p>
        <h2>External Sort を動かす</h2>
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
        <div className="external-sort-input-grid">
          <div>
            <label className="field-label" htmlFor="external-sort-record-count">
              Records / pages
            </label>
            <input
              id="external-sort-record-count"
              className="text-input"
              type="number"
              value={recordCountInput}
              aria-invalid={configError ? true : undefined}
              aria-describedby={configError ? "external-sort-config-error" : undefined}
              onChange={(event) => onRecordCountInputChange(event.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="external-sort-run-size">
              Run size
            </label>
            <input
              id="external-sort-run-size"
              className="text-input"
              type="number"
              value={runSizeInput}
              aria-invalid={configError ? true : undefined}
              aria-describedby={configError ? "external-sort-config-error" : undefined}
              onChange={(event) => onRunSizeInputChange(event.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="external-sort-buffer-count">
              Buffers
            </label>
            <input
              id="external-sort-buffer-count"
              className="text-input"
              type="number"
              value={bufferCountInput}
              aria-invalid={configError ? true : undefined}
              aria-describedby={configError ? "external-sort-config-error" : undefined}
              onChange={(event) => onBufferCountInputChange(event.target.value)}
            />
          </div>
        </div>

        {configError ? (
          <p id="external-sort-config-error" className="field-error">
            {configError}
          </p>
        ) : null}

        <button type="button" className="accent-button single-action" onClick={onBuildPlan}>
          Build sort plan
        </button>
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
