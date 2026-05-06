import { RingScenario } from "../types";

interface HashRingControlPanelProps {
  resourceInput: string;
  nodeInput: string;
  onResourceInputChange: (value: string) => void;
  onNodeInputChange: (value: string) => void;
  onLookupResource: () => void;
  onAddResource: () => void;
  onAddNode: () => void;
  onRemoveNode: () => void;
  onLoadScenario: (scenarioId: string) => void;
  scenarios: RingScenario[];
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

export function HashRingControlPanel({
  resourceInput,
  nodeInput,
  onResourceInputChange,
  onNodeInputChange,
  onLookupResource,
  onAddResource,
  onAddNode,
  onRemoveNode,
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
}: HashRingControlPanelProps) {
  return (
    <aside className="panel panel-controls">
      <div className="panel-header">
        <p className="eyebrow">Operations</p>
        <h2>ハッシュリングを動かす</h2>
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
        <label className="field-label" htmlFor="ring-resource-input">
          Resource Id
        </label>
        <input
          id="ring-resource-input"
          className="text-input"
          type="text"
          value={resourceInput}
          onChange={(event) => onResourceInputChange(event.target.value)}
          placeholder="例: profile-image"
        />
        <div className="button-row">
          <button type="button" className="accent-button" onClick={onLookupResource}>
            Locate Resource
          </button>
          <button type="button" className="secondary-button" onClick={onAddResource}>
            Register Resource
          </button>
        </div>
      </section>

      <section className="panel-section">
        <label className="field-label" htmlFor="ring-node-input">
          Node Id
        </label>
        <input
          id="ring-node-input"
          className="text-input"
          type="text"
          value={nodeInput}
          onChange={(event) => onNodeInputChange(event.target.value)}
          placeholder="例: Node G"
        />
        <div className="button-row">
          <button type="button" className="accent-button" onClick={onAddNode}>
            Add Node
          </button>
          <button type="button" className="secondary-button" onClick={onRemoveNode}>
            Remove Node
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
