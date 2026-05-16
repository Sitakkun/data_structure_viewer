import { LSMScenario } from "../types";

interface LSMControlPanelProps {
  keyInput: string;
  onKeyInputChange: (value: string) => void;
  onPut: () => void;
  onSearch: () => void;
  onDelete: () => void;
  onFlush: () => void;
  onCompact: () => void;
  onLoadScenario: (scenarioId: string) => void;
  scenarios: LSMScenario[];
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

export function LSMControlPanel({
  keyInput,
  onKeyInputChange,
  onPut,
  onSearch,
  onDelete,
  onFlush,
  onCompact,
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
}: LSMControlPanelProps) {
  return (
    <aside className="panel panel-controls">
      <div className="panel-header">
        <p className="eyebrow">Operations</p>
        <h2>LSM-tree を動かす</h2>
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
        <label className="field-label" htmlFor="lsm-key-input">
          Key
        </label>
        <input
          id="lsm-key-input"
          className="text-input"
          type="number"
          value={keyInput}
          onChange={(event) => onKeyInputChange(event.target.value)}
          placeholder="例: 35"
        />
        <div className="button-row">
          <button type="button" className="accent-button" onClick={onPut}>
            Put
          </button>
          <button type="button" className="secondary-button" onClick={onSearch}>
            Search
          </button>
          <button type="button" className="secondary-button" onClick={onDelete}>
            Delete
          </button>
        </div>
        <div className="button-row">
          <button type="button" className="accent-button" onClick={onFlush}>
            Flush
          </button>
          <button type="button" className="secondary-button" onClick={onCompact}>
            Compact
          </button>
        </div>
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
