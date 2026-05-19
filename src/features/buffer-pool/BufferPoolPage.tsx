import { useEffect, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { StepTimeline } from "../../components/StepTimeline";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { bufferPoolCodeExamples } from "./codeExamples";
import { BufferPoolCodePanel } from "./components/BufferPoolCodePanel";
import { BufferPoolControlPanel } from "./components/BufferPoolControlPanel";
import { BufferPoolInspector } from "./components/BufferPoolInspector";
import { BufferPoolView } from "./components/BufferPoolView";
import {
  bufferPoolScenarioDefinitions,
  cloneBufferPoolSteps,
  createSeededBufferPoolScenario,
  findBufferPoolScenarioById,
} from "./scenarios";
import {
  buildBufferPoolSteps,
  cloneBufferPoolState,
  withPolicy,
} from "./simulation";
import {
  BufferPolicy,
  BufferPoolLanguage,
  BufferPoolOperation,
  BufferPoolState,
  BufferPoolStep,
} from "./types";

function cloneSteps(steps: BufferPoolStep[]) {
  return steps.map((step) => ({
    ...step,
    bufferState: cloneBufferPoolState(step.bufferState),
    highlights: { ...step.highlights },
  }));
}

export function BufferPoolPage() {
  const initialScenario = createSeededBufferPoolScenario("lru");
  const [selectedPolicy, setSelectedPolicy] = useState<BufferPolicy>("lru");
  const [baseState, setBaseState] = useState<BufferPoolState>(
    cloneBufferPoolState(initialScenario.baseState),
  );
  const [committedState, setCommittedState] = useState<BufferPoolState>(
    cloneBufferPoolState(initialScenario.finalState),
  );
  const [steps, setSteps] = useState<BufferPoolStep[]>(
    cloneBufferPoolSteps(initialScenario.steps),
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [pageInput, setPageInput] = useState("7");
  const [rangeStartInput, setRangeStartInput] = useState("10");
  const [rangeEndInput, setRangeEndInput] = useState("13");
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
    useState<BufferPoolLanguage>("pseudo");

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const displayedState = activeStep?.bufferState ?? baseState;
  const fallbackOperation: BufferPoolOperation = steps[0]?.operation ?? "read";

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

  function applyScenario(scenarioId: string, policy = selectedPolicy) {
    const scenario = findBufferPoolScenarioById(scenarioId, policy);

    setIsPlaying(false);
    setSelectedScenarioId(scenario.id);
    setScenarioTitle(scenario.title);
    setScenarioDescription(scenario.description);
    setScenarioWatchPoints(scenario.watchPoints ?? []);
    setBaseState(cloneBufferPoolState(scenario.baseState));
    setCommittedState(cloneBufferPoolState(scenario.finalState));
    setSteps(cloneBufferPoolSteps(scenario.steps));
    setCurrentStepIndex(-1);
  }

  function handlePolicyChange(policy: BufferPolicy) {
    setSelectedPolicy(policy);
    applyScenario(selectedScenarioId, policy);
  }

  function commitSteps(nextSteps: BufferPoolStep[], operationLabel: string) {
    const finalState = nextSteps[nextSteps.length - 1]?.bufferState ?? committedState;

    setIsPlaying(false);
    setSelectedScenarioId(`buffer-manual-${operationLabel}`);
    setScenarioTitle(operationLabel);
    setScenarioDescription(
      "手動操作で生成した buffer pool ステップです。Reset で操作前の状態に戻れます。",
    );
    setScenarioWatchPoints([]);
    setBaseState(withPolicy(committedState, selectedPolicy));
    setCommittedState(cloneBufferPoolState(finalState));
    setSteps(cloneSteps(nextSteps));
    setCurrentStepIndex(-1);
  }

  function parsePageId(value: string) {
    const pageId = Number(value);
    return Number.isInteger(pageId) && pageId > 0 ? pageId : undefined;
  }

  function handleSinglePageOperation(operation: Exclude<BufferPoolOperation, "range-scan" | "checkpoint">) {
    const pageId = parsePageId(pageInput);
    if (pageId === undefined) {
      return;
    }

    const base = withPolicy(committedState, selectedPolicy);
    const nextSteps = buildBufferPoolSteps(base, [{ operation, pageId }]);
    commitSteps(nextSteps, `${operation.toUpperCase()} P${pageId}`);
  }

  function handleRangeScan() {
    const start = parsePageId(rangeStartInput);
    const end = parsePageId(rangeEndInput);
    if (start === undefined || end === undefined) {
      return;
    }

    const min = Math.min(start, end);
    const max = Math.max(start, end);
    const cappedMax = Math.min(max, min + 11);
    const actions = Array.from(
      { length: cappedMax - min + 1 },
      (_, index) => ({
        operation: "range-scan" as const,
        pageId: min + index,
      }),
    );

    const base = withPolicy(committedState, selectedPolicy);
    const nextSteps = buildBufferPoolSteps(base, actions);
    commitSteps(nextSteps, `RANGE SCAN P${min}..P${cappedMax}`);
  }

  function handleCheckpoint() {
    const base = withPolicy(committedState, selectedPolicy);
    const nextSteps = buildBufferPoolSteps(base, [{ operation: "checkpoint" }]);
    commitSteps(nextSteps, "CHECKPOINT");
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
          <p className="eyebrow">Database Storage</p>
          <h1>Buffer Pool</h1>
          <p className="hero-copy">
            DB の page cache で hit / miss / eviction / dirty writeback がどう発生するかを、
            LRU と CLOCK の置換 policy で比較します。
          </p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">LRU</span>
          <span className="hero-badge">CLOCK</span>
          <span className="hero-badge">Dirty Page</span>
          <span className="hero-badge">Pin Count</span>
          <span className="hero-badge">Checkpoint</span>
        </div>
      </header>

      <div className="workspace">
        <BufferPoolControlPanel
          selectedPolicy={selectedPolicy}
          onPolicyChange={handlePolicyChange}
          pageInput={pageInput}
          onPageInputChange={setPageInput}
          rangeStartInput={rangeStartInput}
          onRangeStartInputChange={setRangeStartInput}
          rangeEndInput={rangeEndInput}
          onRangeEndInputChange={setRangeEndInput}
          onRead={() => handleSinglePageOperation("read")}
          onUpdate={() => handleSinglePageOperation("update")}
          onPin={() => handleSinglePageOperation("pin")}
          onUnpin={() => handleSinglePageOperation("unpin")}
          onRangeScan={handleRangeScan}
          onCheckpoint={handleCheckpoint}
          onLoadScenario={applyScenario}
          scenarios={bufferPoolScenarioDefinitions}
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
          <BufferPoolView bufferState={displayedState} step={activeStep} />
          <StepTimeline
            steps={steps}
            currentStepIndex={currentStepIndex}
            onSelectStep={(index) => {
              setIsPlaying(false);
              setCurrentStepIndex(index);
            }}
          />
          <BufferPoolCodePanel
            step={activeStep}
            fallbackOperation={fallbackOperation}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={bufferPoolCodeExamples}
          />
        </div>

        <BufferPoolInspector
          step={activeStep}
          bufferState={displayedState}
          scenarioTitle={scenarioTitle}
          scenarioDescription={scenarioDescription}
          watchPoints={scenarioWatchPoints}
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
