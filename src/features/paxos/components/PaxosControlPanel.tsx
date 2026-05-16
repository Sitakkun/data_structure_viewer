import { PaxosScenario } from "../types";

interface PaxosControlPanelProps {
  proposalInput: string;
  onProposalInputChange: (value: string) => void;
  valueInput: string;
  onValueInputChange: (value: string) => void;
  onStartP1: () => void;
  onStartP2: () => void;
  onLoadScenario: (scenarioId: string) => void;
  scenarios: PaxosScenario[];
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

export function PaxosControlPanel({
  proposalInput,
  onProposalInputChange,
  valueInput,
  onValueInputChange,
  onStartP1,
  onStartP2,
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
}: PaxosControlPanelProps) {
  return (
    <aside className="panel panel-controls">
      <div className="panel-header">
        <p className="eyebrow">Operations</p>
        <h2>Paxos を動かす</h2>
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
        <label className="field-label" htmlFor="paxos-proposal-input">
          Proposal number
        </label>
        <input
          id="paxos-proposal-input"
          className="text-input"
          type="number"
          value={proposalInput}
          onChange={(event) => onProposalInputChange(event.target.value)}
          placeholder="例: 3"
        />

        <label className="field-label field-label-spaced" htmlFor="paxos-value-input">
          Value
        </label>
        <input
          id="paxos-value-input"
          className="text-input"
          value={valueInput}
          onChange={(event) => onValueInputChange(event.target.value)}
          placeholder="例: A"
        />

        <div className="button-row">
          <button type="button" className="accent-button" onClick={onStartP1}>
            Start P1
          </button>
          <button type="button" className="secondary-button" onClick={onStartP2}>
            Start P2
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
