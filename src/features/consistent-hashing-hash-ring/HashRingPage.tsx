import { useEffect, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { StepTimeline } from "../../components/StepTimeline";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { hashRingCodeExamples } from "./codeExamples";
import { HashRingCodePanel } from "./components/HashRingCodePanel";
import { HashRingControlPanel } from "./components/HashRingControlPanel";
import { HashRingInspector } from "./components/HashRingInspector";
import { HashRingView } from "./components/HashRingView";
import { emptyHashRingScenario, hashRingScenarios } from "./scenarios";
import {
  buildAddNodeSteps,
  buildAddResourceSteps,
  buildLookupSteps,
  buildRemoveNodeSteps,
  cloneRingState,
} from "./simulation";
import {
  HashRingLanguage,
  HashRingOperation,
  RingScenario,
  RingState,
  RingStep,
} from "./types";

function findScenarioById(id: string): RingScenario {
  return hashRingScenarios.find((scenario) => scenario.id === id) ?? emptyHashRingScenario;
}

export function HashRingPage() {
  const [baseState, setBaseState] = useState<RingState>(
    cloneRingState(emptyHashRingScenario.baseState),
  );
  const [committedState, setCommittedState] = useState<RingState>(
    cloneRingState(emptyHashRingScenario.finalState),
  );
  const [steps, setSteps] = useState<RingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [resourceInput, setResourceInput] = useState("profile-image");
  const [nodeInput, setNodeInput] = useState("Node G");
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    emptyHashRingScenario.id,
  );
  const [scenarioTitle, setScenarioTitle] = useState(emptyHashRingScenario.title);
  const [scenarioDescription, setScenarioDescription] = useState(
    emptyHashRingScenario.description,
  );
  const [scenarioWatchPoints, setScenarioWatchPoints] = useState<string[]>(
    emptyHashRingScenario.watchPoints ?? [],
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [selectedLanguage, setSelectedLanguage] =
    useState<HashRingLanguage>("python");

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const displayedState = activeStep?.ringState ?? baseState;
  const fallbackOperation: HashRingOperation =
    steps[0]?.operation ?? "lookup-resource";

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

    setIsPlaying(false);
    setSelectedScenarioId(scenario.id);
    setScenarioTitle(scenario.title);
    setScenarioDescription(scenario.description);
    setScenarioWatchPoints(scenario.watchPoints ?? []);
    setBaseState(cloneRingState(scenario.baseState));
    setCommittedState(cloneRingState(scenario.finalState));
    setSteps(
      scenario.steps.map((step) => ({
        ...step,
        ringState: cloneRingState(step.ringState),
      })),
    );
    setCurrentStepIndex(-1);
  }

  function commitSteps(nextSteps: RingStep[], operationLabel: string) {
    const finalState = nextSteps[nextSteps.length - 1]?.ringState ?? committedState;

    setIsPlaying(false);
    setSelectedScenarioId(`hash-ring-manual-${operationLabel}`);
    setScenarioTitle(operationLabel);
    setScenarioDescription(
      "手動操作で生成したステップです。Reset で操作前のリングに戻れます。",
    );
    setScenarioWatchPoints([]);
    setBaseState(cloneRingState(committedState));
    setCommittedState(cloneRingState(finalState));
    setSteps(
      nextSteps.map((step) => ({
        ...step,
        ringState: cloneRingState(step.ringState),
      })),
    );
    setCurrentStepIndex(-1);
  }

  function handleLookupResource() {
    const resourceId = resourceInput.trim();

    if (resourceId.length === 0) {
      return;
    }

    commitSteps(
      buildLookupSteps(committedState, resourceId),
      `LOOKUP ${resourceId}`,
    );
  }

  function handleAddResource() {
    const resourceId = resourceInput.trim();

    if (resourceId.length === 0) {
      return;
    }

    commitSteps(
      buildAddResourceSteps(committedState, resourceId),
      `ADD RESOURCE ${resourceId}`,
    );
  }

  function handleAddNode() {
    const nodeId = nodeInput.trim();
    if (nodeId.length === 0) {
      return;
    }

    commitSteps(buildAddNodeSteps(committedState, nodeId), `ADD ${nodeId}`);
  }

  function handleRemoveNode() {
    const nodeId = nodeInput.trim();
    if (nodeId.length === 0) {
      return;
    }

    commitSteps(buildRemoveNodeSteps(committedState, nodeId), `REMOVE ${nodeId}`);
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
          <h1>Hash Ring</h1>
          <p className="hero-copy">
            ノードとリソースを同じリングへ配置し、時計回りに最初のノードへ割り当てる仕組みを可視化します。
            1 つのノードに複数リソースを持たせながら、ノード追加や削除でどの範囲だけが動くのかも追えます。
          </p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">Hash Ring</span>
          <span className="hero-badge">Clockwise lookup</span>
          <span className="hero-badge">Minimal remapping</span>
        </div>
      </header>

      <div className="workspace">
        <HashRingControlPanel
          resourceInput={resourceInput}
          nodeInput={nodeInput}
          onResourceInputChange={setResourceInput}
          onNodeInputChange={setNodeInput}
          onLookupResource={handleLookupResource}
          onAddResource={handleAddResource}
          onAddNode={handleAddNode}
          onRemoveNode={handleRemoveNode}
          onLoadScenario={loadScenario}
          scenarios={hashRingScenarios}
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
          <HashRingView ringState={displayedState} step={activeStep} />
          <StepTimeline
            steps={steps}
            currentStepIndex={currentStepIndex}
            onSelectStep={(index) => {
              setIsPlaying(false);
              setCurrentStepIndex(index);
            }}
          />
          <HashRingCodePanel
            step={activeStep}
            fallbackOperation={fallbackOperation}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={hashRingCodeExamples}
          />
        </div>

        <HashRingInspector
          step={activeStep}
          ringState={displayedState}
          scenarioTitle={scenarioTitle}
          scenarioDescription={scenarioDescription}
          watchPoints={scenarioWatchPoints}
        />
      </div>
      <MobilePlaybackDock
        currentStepIndex={currentStepIndex}
        currentStepTitle={activeStep?.title}
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
