import { useEffect, useMemo, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { chordCodeExamples } from "./codeExamples";
import { ChordCodePanel } from "./components/ChordCodePanel";
import { ChordControlPanel } from "./components/ChordControlPanel";
import { ChordInspector } from "./components/ChordInspector";
import { ChordView } from "./components/ChordView";
import { emptyChordScenario, chordScenarios } from "./scenarios";
import { buildChordLookupSteps, cloneChordState } from "./simulation";
import {
  ChordLanguage,
  ChordOperation,
  ChordScenario,
  ChordState,
  ChordStep,
} from "./types";

function findScenarioById(id: string): ChordScenario {
  return chordScenarios.find((scenario) => scenario.id === id) ?? emptyChordScenario;
}

export function ChordPage() {
  const [baseState, setBaseState] = useState<ChordState>(
    cloneChordState(emptyChordScenario.baseState),
  );
  const [committedState, setCommittedState] = useState<ChordState>(
    cloneChordState(emptyChordScenario.finalState),
  );
  const [steps, setSteps] = useState<ChordStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [resourceInput, setResourceInput] = useState("profile-image");
  const [startNodeId, setStartNodeId] = useState(
    emptyChordScenario.baseState.nodes[0]?.id ?? "",
  );
  const [inspectedNodeId, setInspectedNodeId] = useState(
    emptyChordScenario.baseState.nodes[0]?.id ?? "",
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState(emptyChordScenario.id);
  const [scenarioTitle, setScenarioTitle] = useState(emptyChordScenario.title);
  const [scenarioDescription, setScenarioDescription] = useState(
    emptyChordScenario.description,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [selectedLanguage, setSelectedLanguage] =
    useState<ChordLanguage>("python");

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const displayedState = activeStep?.chordState ?? baseState;
  const fallbackOperation: ChordOperation = steps[0]?.operation ?? "lookup-resource";
  const availableNodes = useMemo(
    () => committedState.nodes.map((node) => ({ id: node.id, hash: node.hash })),
    [committedState.nodes],
  );
  const focusedNodeId = activeStep?.highlights.activeNodeId ?? inspectedNodeId;

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
    const scenario = findScenarioById(scenarioId);
    const defaultNodeId = scenario.baseState.nodes[0]?.id ?? "";

    setIsPlaying(false);
    setSelectedScenarioId(scenario.id);
    setScenarioTitle(scenario.title);
    setScenarioDescription(scenario.description);
    setBaseState(cloneChordState(scenario.baseState));
    setCommittedState(cloneChordState(scenario.finalState));
    setStartNodeId(defaultNodeId);
    setInspectedNodeId(defaultNodeId);
    setSteps(
      scenario.steps.map((step) => ({
        ...step,
        chordState: cloneChordState(step.chordState),
      })),
    );
    setCurrentStepIndex(-1);
  }

  function commitSteps(nextSteps: ChordStep[], operationLabel: string) {
    const finalState = nextSteps[nextSteps.length - 1]?.chordState ?? committedState;

    setIsPlaying(false);
    setSelectedScenarioId(`chord-manual-${operationLabel}`);
    setScenarioTitle(operationLabel);
    setScenarioDescription(
      "手動操作で生成したステップです。Reset で操作前のリングに戻れます。",
    );
    setBaseState(cloneChordState(committedState));
    setCommittedState(cloneChordState(finalState));
    setSteps(
      nextSteps.map((step) => ({
        ...step,
        chordState: cloneChordState(step.chordState),
      })),
    );
    setCurrentStepIndex(-1);
  }

  function handleLookupResource() {
    const resourceId = resourceInput.trim();

    if (resourceId.length === 0 || startNodeId.length === 0) {
      return;
    }

    commitSteps(
      buildChordLookupSteps(committedState, resourceId, startNodeId),
      `LOOKUP ${resourceId} FROM ${startNodeId}`,
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
          <p className="eyebrow">Consistent Hashing</p>
          <h1>Chord Finger Table</h1>
          <p className="hero-copy">
            Chord の各ノードが持つ finger table を見ながら、`find_successor` がどの
            entry を使って次のノードへジャンプするかを追えます。
          </p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">Chord</span>
          <span className="hero-badge">Finger Table</span>
          <span className="hero-badge">O(log N) lookup</span>
        </div>
      </header>

      <div className="workspace">
        <ChordControlPanel
          resourceInput={resourceInput}
          startNodeId={startNodeId}
          inspectedNodeId={inspectedNodeId}
          availableNodes={availableNodes}
          onResourceInputChange={setResourceInput}
          onStartNodeChange={setStartNodeId}
          onInspectedNodeChange={setInspectedNodeId}
          onLookupResource={handleLookupResource}
          onLoadScenario={loadScenario}
          scenarios={chordScenarios}
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
          <ChordView
            chordState={displayedState}
            step={activeStep}
            focusedNodeId={focusedNodeId}
            onFocusedNodeChange={setInspectedNodeId}
          />
          <ChordCodePanel
            step={activeStep}
            fallbackOperation={fallbackOperation}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={chordCodeExamples}
          />
        </div>

        <ChordInspector
          step={activeStep}
          chordState={displayedState}
          scenarioTitle={scenarioTitle}
          scenarioDescription={scenarioDescription}
          focusedNodeId={focusedNodeId}
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
