import { useEffect, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { paxosCodeExamples } from "./codeExamples";
import { PaxosCodePanel } from "./components/PaxosCodePanel";
import { PaxosControlPanel } from "./components/PaxosControlPanel";
import { PaxosInspector } from "./components/PaxosInspector";
import { PaxosView } from "./components/PaxosView";
import {
  clonePaxosSteps,
  findPaxosScenarioById,
  paxosScenarios,
  seededPaxosScenario,
} from "./scenarios";
import {
  buildSingleProposerSteps,
  clonePaxosState,
} from "./simulation";
import { PaxosLanguage, PaxosOperation, PaxosState, PaxosStep } from "./types";

function cloneSteps(steps: PaxosStep[]) {
  return steps.map((step) => ({
    ...step,
    paxosState: clonePaxosState(step.paxosState),
    highlights: {
      ...step.highlights,
      activeAcceptorIds: step.highlights.activeAcceptorIds
        ? [...step.highlights.activeAcceptorIds]
        : undefined,
      activeMessageIds: step.highlights.activeMessageIds
        ? [...step.highlights.activeMessageIds]
        : undefined,
    },
    metrics: { ...step.metrics },
  }));
}

export function PaxosPage() {
  const [baseState, setBaseState] = useState<PaxosState>(
    clonePaxosState(seededPaxosScenario.baseState),
  );
  const [committedState, setCommittedState] = useState<PaxosState>(
    clonePaxosState(seededPaxosScenario.finalState),
  );
  const [steps, setSteps] = useState<PaxosStep[]>(
    clonePaxosSteps(seededPaxosScenario.steps),
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [proposalInput, setProposalInput] = useState("3");
  const [valueInput, setValueInput] = useState("A");
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    seededPaxosScenario.id,
  );
  const [scenarioTitle, setScenarioTitle] = useState(seededPaxosScenario.title);
  const [scenarioDescription, setScenarioDescription] = useState(
    seededPaxosScenario.description,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [selectedLanguage, setSelectedLanguage] =
    useState<PaxosLanguage>("pseudo");

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const displayedState = activeStep?.paxosState ?? baseState;
  const fallbackOperation: PaxosOperation = steps[0]?.operation ?? "propose";
  const scenarios = [seededPaxosScenario, ...paxosScenarios];

  useEffect(() => {
    if (!isPlaying || steps.length === 0) {
      return undefined;
    }

    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setCurrentStepIndex((current) => Math.min(current + 1, steps.length - 1));
    }, playbackSpeed);

    return () => window.clearTimeout(timerId);
  }, [currentStepIndex, isPlaying, playbackSpeed, steps.length]);

  function loadScenario(scenarioId: string) {
    const scenario = findPaxosScenarioById(scenarioId);

    setIsPlaying(false);
    setSelectedScenarioId(scenario.id);
    setScenarioTitle(scenario.title);
    setScenarioDescription(scenario.description);
    setBaseState(clonePaxosState(scenario.baseState));
    setCommittedState(clonePaxosState(scenario.finalState));
    setSteps(clonePaxosSteps(scenario.steps));
    setCurrentStepIndex(-1);
  }

  function commitSteps(nextSteps: PaxosStep[], operationLabel: string) {
    const finalState = nextSteps[nextSteps.length - 1]?.paxosState ?? committedState;

    setIsPlaying(false);
    setSelectedScenarioId(`paxos-manual-${operationLabel}`);
    setScenarioTitle(operationLabel);
    setScenarioDescription(
      "手動操作で生成した Paxos ステップです。Reset で操作前の状態に戻れます。",
    );
    setBaseState(clonePaxosState(committedState));
    setCommittedState(clonePaxosState(finalState));
    setSteps(cloneSteps(nextSteps));
    setCurrentStepIndex(-1);
  }

  function parseProposalNumber() {
    const proposalNumber = Number(proposalInput);
    return Number.isInteger(proposalNumber) && proposalNumber > 0
      ? proposalNumber
      : undefined;
  }

  function handleStart(proposerId: "P1" | "P2") {
    const proposalNumber = parseProposalNumber();
    const value = valueInput.trim() || (proposerId === "P1" ? "A" : "B");
    if (proposalNumber === undefined) {
      return;
    }

    commitSteps(
      buildSingleProposerSteps(committedState, proposerId, proposalNumber, value),
      `${proposerId} PROPOSE n=${proposalNumber}, v=${value}`,
    );
  }

  function handlePlayPause() {
    if (steps.length === 0) {
      return;
    }

    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(-1);
      setIsPlaying(true);
      return;
    }

    setIsPlaying((current) => !current);
  }

  function handlePrev() {
    setIsPlaying(false);
    setCurrentStepIndex((current) => Math.max(current - 1, -1));
  }

  function handleNext() {
    if (steps.length === 0) {
      return;
    }

    setIsPlaying(false);
    setCurrentStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleReset() {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
  }

  usePlaybackShortcuts({
    onPrev: handlePrev,
    onNext: handleNext,
    onReset: handleReset,
  });

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Consensus</p>
          <h1>Paxos</h1>
          <p className="hero-copy">
            Single-Decree Paxos の prepare / promise / accept request / accepted を追い、
            quorum と proposal number が safety を守る仕組みを確認します。
          </p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">Prepare</span>
          <span className="hero-badge">Promise</span>
          <span className="hero-badge">Accept</span>
          <span className="hero-badge">Quorum</span>
          <span className="hero-badge">Chosen</span>
        </div>
      </header>

      <div className="workspace">
        <PaxosControlPanel
          proposalInput={proposalInput}
          onProposalInputChange={setProposalInput}
          valueInput={valueInput}
          onValueInputChange={setValueInput}
          onStartP1={() => handleStart("P1")}
          onStartP2={() => handleStart("P2")}
          onLoadScenario={loadScenario}
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          currentStepIndex={currentStepIndex}
          totalSteps={steps.length}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onPlaybackSpeedChange={setPlaybackSpeed}
          onPlayPause={handlePlayPause}
          onPrev={handlePrev}
          onNext={handleNext}
          onReset={handleReset}
        />

        <div className="visual-column">
          <PaxosView paxosState={displayedState} step={activeStep} />
          <PaxosCodePanel
            step={activeStep}
            fallbackOperation={fallbackOperation}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={paxosCodeExamples}
          />
        </div>

        <PaxosInspector
          step={activeStep}
          paxosState={displayedState}
          scenarioTitle={scenarioTitle}
          scenarioDescription={scenarioDescription}
        />
      </div>
      <MobilePlaybackDock
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onPrev={handlePrev}
        onNext={handleNext}
        onReset={handleReset}
      />
    </>
  );
}
