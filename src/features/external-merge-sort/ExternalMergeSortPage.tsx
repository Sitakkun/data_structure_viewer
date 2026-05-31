import { useEffect, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { StepTimeline } from "../../components/StepTimeline";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { externalSortCodeExamples } from "./codeExamples";
import { ExternalSortCodePanel } from "./components/ExternalSortCodePanel";
import { ExternalSortControlPanel } from "./components/ExternalSortControlPanel";
import { ExternalSortInspector } from "./components/ExternalSortInspector";
import { ExternalSortView } from "./components/ExternalSortView";
import {
  cloneExternalSortSteps,
  createSeededExternalSortScenario,
  externalSortScenarioDefinitions,
  findExternalSortScenarioById,
} from "./scenarios";
import {
  buildExternalSortSteps,
  createExternalSortBaseState,
} from "./simulation";
import {
  ExternalSortConfig,
  ExternalSortLanguage,
  ExternalSortStep,
} from "./types";

function parsePositiveInteger(value: string) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0
    ? numberValue
    : undefined;
}

function validateConfig(config: Partial<ExternalSortConfig>) {
  if (
    config.recordCount === undefined ||
    config.runSize === undefined ||
    config.bufferCount === undefined
  ) {
    return "Records, run size, and buffers must be positive integers.";
  }

  if (config.bufferCount < 3) {
    return "Buffers must be at least 3: two input buffers and one output buffer.";
  }

  if (config.recordCount > 240) {
    return "Records/pages must be 240 or fewer for this visualizer.";
  }

  if (config.runSize > config.recordCount) {
    return "Run size must be less than or equal to records/pages.";
  }

  return undefined;
}

function configToInputs(config: ExternalSortConfig) {
  return {
    recordCountInput: String(config.recordCount),
    runSizeInput: String(config.runSize),
    bufferCountInput: String(config.bufferCount),
  };
}

function cloneSteps(steps: ExternalSortStep[]) {
  return cloneExternalSortSteps(steps);
}

export function ExternalMergeSortPage() {
  const initialScenario = createSeededExternalSortScenario();
  const initialInputs = configToInputs(initialScenario.config);
  const [baseState, setBaseState] = useState(initialScenario.baseState);
  const [steps, setSteps] = useState<ExternalSortStep[]>(
    cloneSteps(initialScenario.steps),
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [recordCountInput, setRecordCountInput] = useState(
    initialInputs.recordCountInput,
  );
  const [runSizeInput, setRunSizeInput] = useState(initialInputs.runSizeInput);
  const [bufferCountInput, setBufferCountInput] = useState(
    initialInputs.bufferCountInput,
  );
  const [configError, setConfigError] = useState<string>();
  const [selectedScenarioId, setSelectedScenarioId] = useState(initialScenario.id);
  const [scenarioTitle, setScenarioTitle] = useState(initialScenario.title);
  const [scenarioDescription, setScenarioDescription] = useState(
    initialScenario.description,
  );
  const [scenarioWatchPoints, setScenarioWatchPoints] = useState<string[]>(
    initialScenario.watchPoints ?? [],
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [selectedLanguage, setSelectedLanguage] =
    useState<ExternalSortLanguage>("pseudo");

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const displayedState = activeStep?.sortState ?? baseState;

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

  function applyConfig(
    config: ExternalSortConfig,
    scenarioId: string,
    label: string,
    description: string,
  ) {
    const nextBaseState = createExternalSortBaseState(config);
    const nextSteps = buildExternalSortSteps(config);

    setConfigError(undefined);
    setIsPlaying(false);
    setSelectedScenarioId(scenarioId);
    setScenarioTitle(label);
    setScenarioDescription(description);
    setScenarioWatchPoints([]);
    setBaseState(nextBaseState);
    setSteps(cloneSteps(nextSteps));
    setCurrentStepIndex(-1);
  }

  function applyScenario(scenarioId: string) {
    const scenario = findExternalSortScenarioById(scenarioId);
    const inputs = configToInputs(scenario.config);

    setConfigError(undefined);
    setIsPlaying(false);
    setSelectedScenarioId(scenario.id);
    setScenarioTitle(scenario.title);
    setScenarioDescription(scenario.description);
    setScenarioWatchPoints(scenario.watchPoints ?? []);
    setRecordCountInput(inputs.recordCountInput);
    setRunSizeInput(inputs.runSizeInput);
    setBufferCountInput(inputs.bufferCountInput);
    setBaseState(scenario.baseState);
    setSteps(cloneSteps(scenario.steps));
    setCurrentStepIndex(-1);
  }

  function handleBuildPlan() {
    const nextConfig = {
      recordCount: parsePositiveInteger(recordCountInput),
      runSize: parsePositiveInteger(runSizeInput),
      bufferCount: parsePositiveInteger(bufferCountInput),
    };
    const nextError = validateConfig(nextConfig);

    if (nextError) {
      setConfigError(nextError);
      return;
    }

    const config = nextConfig as ExternalSortConfig;
    applyConfig(
      config,
      "external-sort-manual",
      "Manual external sort plan",
      "手動設定で生成した external merge sort の計画です。Reset で最初の pass 前に戻れます。",
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
          <p className="eyebrow">Database Operators</p>
          <h1>External Merge Sort</h1>
          <p className="hero-copy">
            memory より大きな relation を sorted runs に分け、限られた buffer pages で
            k-way merge する DB sort operator の I/O cost を追います。
          </p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">Run Generation</span>
          <span className="hero-badge">K-way Merge</span>
          <span className="hero-badge">I/O Cost</span>
          <span className="hero-badge">Buffer Pages</span>
        </div>
      </header>

      <div className="workspace">
        <ExternalSortControlPanel
          recordCountInput={recordCountInput}
          runSizeInput={runSizeInput}
          bufferCountInput={bufferCountInput}
          configError={configError}
          onRecordCountInputChange={(value) => {
            setRecordCountInput(value);
            setConfigError(undefined);
          }}
          onRunSizeInputChange={(value) => {
            setRunSizeInput(value);
            setConfigError(undefined);
          }}
          onBufferCountInputChange={(value) => {
            setBufferCountInput(value);
            setConfigError(undefined);
          }}
          onBuildPlan={handleBuildPlan}
          onLoadScenario={applyScenario}
          scenarios={externalSortScenarioDefinitions}
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
          <ExternalSortView sortState={displayedState} step={activeStep} />
          <StepTimeline
            steps={steps}
            currentStepIndex={currentStepIndex}
            onSelectStep={(index) => {
              setIsPlaying(false);
              setCurrentStepIndex(index);
            }}
          />
          <ExternalSortCodePanel
            step={activeStep}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={externalSortCodeExamples}
          />
        </div>

        <ExternalSortInspector
          step={activeStep}
          sortState={displayedState}
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
