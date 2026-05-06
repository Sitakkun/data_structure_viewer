import { ChordScenario } from "../types";

interface ChordControlPanelProps {
  resourceInput: string;
  startNodeId: string;
  inspectedNodeId: string;
  availableNodes: { id: string; hash: number }[];
  onResourceInputChange: (value: string) => void;
  onStartNodeChange: (value: string) => void;
  onInspectedNodeChange: (value: string) => void;
  onLookupResource: () => void;
  onLoadScenario: (scenarioId: string) => void;
  scenarios: ChordScenario[];
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

export function ChordControlPanel({
  resourceInput,
  startNodeId,
  inspectedNodeId,
  availableNodes,
  onResourceInputChange,
  onStartNodeChange,
  onInspectedNodeChange,
  onLookupResource,
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
}: ChordControlPanelProps) {
  return (
    <aside className="panel panel-controls">
      <div className="panel-header">
        <p className="eyebrow">Operations</p>
        <h2>Chord を動かす</h2>
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
        <label className="field-label" htmlFor="chord-resource-input">
          Resource Id
        </label>
        <input
          id="chord-resource-input"
          className="text-input"
          type="text"
          value={resourceInput}
          onChange={(event) => onResourceInputChange(event.target.value)}
          placeholder="例: profile-image"
        />
      </section>

      <section className="panel-section">
        <label className="field-label" htmlFor="chord-start-node">
          Start Node
        </label>
        <select
          id="chord-start-node"
          className="text-input"
          value={startNodeId}
          onChange={(event) => onStartNodeChange(event.target.value)}
        >
          {availableNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.id} ({node.hash})
            </option>
          ))}
        </select>
        <button type="button" className="accent-button single-action" onClick={onLookupResource}>
          Lookup With Chord
        </button>
      </section>

      <section className="panel-section">
        <label className="field-label" htmlFor="chord-inspect-node">
          Inspect Finger Table
        </label>
        <select
          id="chord-inspect-node"
          className="text-input"
          value={inspectedNodeId}
          onChange={(event) => onInspectedNodeChange(event.target.value)}
        >
          {availableNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.id} ({node.hash})
            </option>
          ))}
        </select>
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
