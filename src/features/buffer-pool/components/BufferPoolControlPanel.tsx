import {
  BufferPolicy,
  BufferPoolScenarioDefinition,
} from "../types";

interface BufferPoolControlPanelProps {
  selectedPolicy: BufferPolicy;
  onPolicyChange: (policy: BufferPolicy) => void;
  pageInput: string;
  onPageInputChange: (value: string) => void;
  rangeStartInput: string;
  onRangeStartInputChange: (value: string) => void;
  rangeEndInput: string;
  onRangeEndInputChange: (value: string) => void;
  onRead: () => void;
  onUpdate: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onRangeScan: () => void;
  onCheckpoint: () => void;
  onLoadScenario: (scenarioId: string) => void;
  scenarios: BufferPoolScenarioDefinition[];
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

export function BufferPoolControlPanel({
  selectedPolicy,
  onPolicyChange,
  pageInput,
  onPageInputChange,
  rangeStartInput,
  onRangeStartInputChange,
  rangeEndInput,
  onRangeEndInputChange,
  onRead,
  onUpdate,
  onPin,
  onUnpin,
  onRangeScan,
  onCheckpoint,
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
}: BufferPoolControlPanelProps) {
  return (
    <aside className="panel panel-controls">
      <div className="panel-header">
        <p className="eyebrow">Operations</p>
        <h2>Buffer Pool を動かす</h2>
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
          <p className="eyebrow">Policy</p>
          <span>{selectedPolicy.toUpperCase()}</span>
        </div>
        <div className="language-toggle buffer-policy-toggle" role="group" aria-label="Buffer policy">
          {(["lru", "clock"] as const).map((policy) => (
            <button
              key={policy}
              type="button"
              className={
                policy === selectedPolicy
                  ? "language-button is-selected"
                  : "language-button"
              }
              onClick={() => onPolicyChange(policy)}
            >
              {policy.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <label className="field-label" htmlFor="buffer-page-input">
          Page ID
        </label>
        <input
          id="buffer-page-input"
          className="text-input"
          type="number"
          value={pageInput}
          onChange={(event) => onPageInputChange(event.target.value)}
          placeholder="例: 7"
        />
        <div className="button-row">
          <button type="button" className="accent-button" onClick={onRead}>
            Read
          </button>
          <button type="button" className="secondary-button" onClick={onUpdate}>
            Update
          </button>
          <button type="button" className="secondary-button" onClick={onPin}>
            Pin
          </button>
          <button type="button" className="secondary-button" onClick={onUnpin}>
            Unpin
          </button>
        </div>
      </section>

      <section className="panel-section">
        <div className="range-input-grid">
          <div>
            <label className="field-label" htmlFor="buffer-range-start">
              Range start
            </label>
            <input
              id="buffer-range-start"
              className="text-input"
              type="number"
              value={rangeStartInput}
              onChange={(event) => onRangeStartInputChange(event.target.value)}
              placeholder="10"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="buffer-range-end">
              Range end
            </label>
            <input
              id="buffer-range-end"
              className="text-input"
              type="number"
              value={rangeEndInput}
              onChange={(event) => onRangeEndInputChange(event.target.value)}
              placeholder="13"
            />
          </div>
        </div>
        <div className="button-row">
          <button type="button" className="accent-button" onClick={onRangeScan}>
            Range Scan
          </button>
          <button type="button" className="secondary-button" onClick={onCheckpoint}>
            Checkpoint
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
