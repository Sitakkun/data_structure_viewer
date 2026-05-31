import { BPlusTreeScenario } from "../types";

interface BPlusTreeControlPanelProps {
  keyInput: string;
  keyInputError?: string;
  onKeyInputChange: (value: string) => void;
  rangeStartInput: string;
  rangeEndInput: string;
  rangeInputError?: string;
  onRangeStartInputChange: (value: string) => void;
  onRangeEndInputChange: (value: string) => void;
  onInsert: () => void;
  onSearch: () => void;
  onDelete: () => void;
  onRangeScan: () => void;
  onLoadScenario: (scenarioId: string) => void;
  scenarios: BPlusTreeScenario[];
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

export function BPlusTreeControlPanel({
  keyInput,
  keyInputError,
  onKeyInputChange,
  rangeStartInput,
  rangeEndInput,
  rangeInputError,
  onRangeStartInputChange,
  onRangeEndInputChange,
  onInsert,
  onSearch,
  onDelete,
  onRangeScan,
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
}: BPlusTreeControlPanelProps) {
  return (
    <aside className="panel panel-controls">
      <div className="panel-header">
        <p className="eyebrow">Operations</p>
        <h2>B+ Tree を動かす</h2>
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
        <label className="field-label" htmlFor="bplustree-key-input">
          Key
        </label>
        <input
          id="bplustree-key-input"
          className="text-input"
          type="number"
          value={keyInput}
          aria-invalid={keyInputError ? true : undefined}
          aria-describedby={
            keyInputError ? "bplustree-key-input-error" : undefined
          }
          onChange={(event) => onKeyInputChange(event.target.value)}
          placeholder="例: 35"
        />
        {keyInputError ? (
          <p id="bplustree-key-input-error" className="field-error">
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
          <p className="eyebrow">Range Scan</p>
        </div>
        <div className="range-input-grid">
          <label className="field-label" htmlFor="bplustree-range-start-input">
            Start
            <input
              id="bplustree-range-start-input"
              className="text-input"
              type="number"
              value={rangeStartInput}
              aria-invalid={rangeInputError ? true : undefined}
              aria-describedby={
                rangeInputError ? "bplustree-range-input-error" : undefined
              }
              onChange={(event) => onRangeStartInputChange(event.target.value)}
              placeholder="例: 15"
            />
          </label>
          <label className="field-label" htmlFor="bplustree-range-end-input">
            End
            <input
              id="bplustree-range-end-input"
              className="text-input"
              type="number"
              value={rangeEndInput}
              aria-invalid={rangeInputError ? true : undefined}
              aria-describedby={
                rangeInputError ? "bplustree-range-input-error" : undefined
              }
              onChange={(event) => onRangeEndInputChange(event.target.value)}
              placeholder="例: 45"
            />
          </label>
        </div>
        {rangeInputError ? (
          <p id="bplustree-range-input-error" className="field-error">
            {rangeInputError}
          </p>
        ) : null}
        <button
          type="button"
          className="accent-button single-action"
          onClick={onRangeScan}
        >
          Range Scan
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
