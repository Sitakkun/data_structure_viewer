import { HashStrategy, Scenario } from "../types";

interface ControlPanelProps {
  selectedStrategy: HashStrategy;
  onStrategyChange: (strategy: HashStrategy) => void;
  keyInput: string;
  keyInputError?: string;
  onKeyInputChange: (value: string) => void;
  onInsert: () => void;
  onSearch: () => void;
  onDelete: () => void;
  onLoadScenario: (scenarioId: string) => void;
  scenarios: Scenario[];
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

export function ControlPanel({
  selectedStrategy,
  onStrategyChange,
  keyInput,
  keyInputError,
  onKeyInputChange,
  onInsert,
  onSearch,
  onDelete,
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
}: ControlPanelProps) {
  const strategyTitle =
    selectedStrategy === "chaining" ? "チェーン法を動かす" : "線形探索法を動かす";

  return (
    <aside className="panel panel-controls">
      <div className="panel-header">
        <p className="eyebrow">Operations</p>
        <h2>{strategyTitle}</h2>
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
        <div className="section-heading">
          <p className="eyebrow">Collision Strategy</p>
        </div>
        <div className="strategy-toggle">
          <button
            type="button"
            className={
              selectedStrategy === "chaining"
                ? "strategy-button is-selected"
                : "strategy-button"
            }
            onClick={() => onStrategyChange("chaining")}
          >
            Separate Chaining
          </button>
          <button
            type="button"
            className={
              selectedStrategy === "linear-probing"
                ? "strategy-button is-selected"
                : "strategy-button"
            }
            onClick={() => onStrategyChange("linear-probing")}
          >
            Linear Probing
          </button>
        </div>
      </section>

      <section className="panel-section">
        <label className="field-label" htmlFor="key-input">
          Key
        </label>
        <input
          id="key-input"
          className="text-input"
          type="number"
          value={keyInput}
          aria-invalid={keyInputError ? true : undefined}
          aria-describedby={keyInputError ? "key-input-error" : undefined}
          onChange={(event) => onKeyInputChange(event.target.value)}
          placeholder="例: 17"
        />
        {keyInputError ? (
          <p id="key-input-error" className="field-error">
            {keyInputError}
          </p>
        ) : null}

        <div className="button-row">
          <button type="button" className="accent-button" onClick={onInsert}>
            Insert
          </button>
          <button type="button" className="secondary-button" onClick={onSearch}>
            Search
          </button>
          <button type="button" className="secondary-button" onClick={onDelete}>
            Delete
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
