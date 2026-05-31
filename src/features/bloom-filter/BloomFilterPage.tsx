import { useEffect, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { StepTimeline } from "../../components/StepTimeline";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { bloomCodeExamples } from "./codeExamples";
import { BloomFilterCodePanel } from "./components/BloomFilterCodePanel";
import { BloomFilterControlPanel } from "./components/BloomFilterControlPanel";
import { BloomFilterInspector } from "./components/BloomFilterInspector";
import { BloomFilterView } from "./components/BloomFilterView";
import { bloomScenarios, emptyBloomScenario } from "./scenarios";
import {
  buildInsertSteps,
  buildQuerySteps,
  cloneBloomState,
} from "./simulation";
import {
  BloomLanguage,
  BloomOperation,
  BloomScenario,
  BloomState,
  BloomStep,
} from "./types";

function findScenarioById(id: string): BloomScenario {
  return bloomScenarios.find((scenario) => scenario.id === id) ?? emptyBloomScenario;
}

export function BloomFilterPage() {
  const [baseState, setBaseState] = useState<BloomState>(
    cloneBloomState(emptyBloomScenario.baseState),
  );
  const [committedState, setCommittedState] = useState<BloomState>(
    cloneBloomState(emptyBloomScenario.finalState),
  );
  const [steps, setSteps] = useState<BloomStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [itemInput, setItemInput] = useState("cherry");
  const [itemInputError, setItemInputError] = useState<string>();
  const [selectedScenarioId, setSelectedScenarioId] = useState(emptyBloomScenario.id);
  const [scenarioTitle, setScenarioTitle] = useState(emptyBloomScenario.title);
  const [scenarioDescription, setScenarioDescription] = useState(
    emptyBloomScenario.description,
  );
  const [scenarioWatchPoints, setScenarioWatchPoints] = useState<string[]>(
    emptyBloomScenario.watchPoints ?? [],
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [selectedLanguage, setSelectedLanguage] =
    useState<BloomLanguage>("python");

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const displayedState = activeStep?.bloomState ?? baseState;
  const fallbackOperation: BloomOperation = steps[0]?.operation ?? "insert";

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

    setItemInputError(undefined);
    setIsPlaying(false);
    setSelectedScenarioId(scenario.id);
    setScenarioTitle(scenario.title);
    setScenarioDescription(scenario.description);
    setScenarioWatchPoints(scenario.watchPoints ?? []);
    setBaseState(cloneBloomState(scenario.baseState));
    setCommittedState(cloneBloomState(scenario.finalState));
    setSteps(
      scenario.steps.map((step) => ({
        ...step,
        bloomState: cloneBloomState(step.bloomState),
      })),
    );
    setCurrentStepIndex(-1);
  }

  function commitSteps(nextSteps: BloomStep[], operationLabel: string) {
    const finalState = nextSteps[nextSteps.length - 1]?.bloomState ?? committedState;

    setItemInputError(undefined);
    setIsPlaying(false);
    setSelectedScenarioId(`bloom-manual-${operationLabel}`);
    setScenarioTitle(operationLabel);
    setScenarioDescription(
      "手動操作で生成したステップです。Reset で操作前のフィルター状態に戻れます。",
    );
    setScenarioWatchPoints([]);
    setBaseState(cloneBloomState(committedState));
    setCommittedState(cloneBloomState(finalState));
    setSteps(
      nextSteps.map((step) => ({
        ...step,
        bloomState: cloneBloomState(step.bloomState),
      })),
    );
    setCurrentStepIndex(-1);
  }

  function handleInsert() {
    const item = itemInput.trim();
    if (item.length === 0) {
      setItemInputError("Item is required.");
      return;
    }

    setItemInputError(undefined);
    commitSteps(buildInsertSteps(committedState, item), `INSERT ${item}`);
  }

  function handleQuery() {
    const item = itemInput.trim();
    if (item.length === 0) {
      setItemInputError("Item is required.");
      return;
    }

    setItemInputError(undefined);
    commitSteps(buildQuerySteps(committedState, item), `QUERY ${item}`);
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
          <p className="eyebrow">Probabilistic Data Structure</p>
          <h1>Bloom Filter</h1>
          <p className="hero-copy">
            複数ハッシュ位置のビットだけで集合を近似し、「ない」は正確に、「ある」は確率的に答える流れを可視化します。
            false positive がどう起きるかも同じ画面で確認できます。
          </p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">Bit Array</span>
          <span className="hero-badge">Multiple Hashes</span>
          <span className="hero-badge">False Positive</span>
        </div>
      </header>

      <div className="workspace">
        <BloomFilterControlPanel
          itemInput={itemInput}
          itemInputError={itemInputError}
          onItemInputChange={(value) => {
            setItemInput(value);
            setItemInputError(undefined);
          }}
          onInsert={handleInsert}
          onQuery={handleQuery}
          onLoadScenario={loadScenario}
          scenarios={bloomScenarios}
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
          <BloomFilterView bloomState={displayedState} step={activeStep} />
          <StepTimeline
            steps={steps}
            currentStepIndex={currentStepIndex}
            onSelectStep={(index) => {
              setIsPlaying(false);
              setCurrentStepIndex(index);
            }}
          />
          <BloomFilterCodePanel
            step={activeStep}
            fallbackOperation={fallbackOperation}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={bloomCodeExamples}
          />
        </div>

        <BloomFilterInspector
          step={activeStep}
          bloomState={displayedState}
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
