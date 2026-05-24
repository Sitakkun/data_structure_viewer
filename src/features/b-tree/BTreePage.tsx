import { useEffect, useMemo, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { StepTimeline } from "../../components/StepTimeline";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { buildBTreeStepComparison } from "../treeStepComparison";
import { btreeCodeExamples } from "./codeExamples";
import { BTreeCodePanel } from "./components/BTreeCodePanel";
import { BTreeControlPanel } from "./components/BTreeControlPanel";
import { BTreeInspector } from "./components/BTreeInspector";
import { BTreeView } from "./components/BTreeView";
import { btreeScenarios, emptyBTreeScenario, seededBTreeScenario } from "./scenarios";
import {
  buildDeleteSteps,
  buildInsertSteps,
  buildRangeScanSteps,
  buildSearchSteps,
  cloneBTreeState,
} from "./simulation";
import {
  BTreeLanguage,
  BTreeOperation,
  BTreeScenario,
  BTreeState,
  BTreeStep,
} from "./types";

function findScenarioById(id: string): BTreeScenario {
  if (id === seededBTreeScenario.id) {
    return seededBTreeScenario;
  }

  return btreeScenarios.find((scenario) => scenario.id === id) ?? emptyBTreeScenario;
}

export function BTreePage() {
  const [baseState, setBaseState] = useState<BTreeState>(
    cloneBTreeState(seededBTreeScenario.baseState),
  );
  const [committedState, setCommittedState] = useState<BTreeState>(
    cloneBTreeState(seededBTreeScenario.finalState),
  );
  const [steps, setSteps] = useState<BTreeStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [keyInput, setKeyInput] = useState("35");
  const [rangeStartInput, setRangeStartInput] = useState("15");
  const [rangeEndInput, setRangeEndInput] = useState("45");
  const [selectedScenarioId, setSelectedScenarioId] = useState(seededBTreeScenario.id);
  const [scenarioTitle, setScenarioTitle] = useState(seededBTreeScenario.title);
  const [scenarioDescription, setScenarioDescription] = useState(
    seededBTreeScenario.description,
  );
  const [scenarioWatchPoints, setScenarioWatchPoints] = useState<string[]>(
    seededBTreeScenario.watchPoints ?? [],
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [selectedLanguage, setSelectedLanguage] =
    useState<BTreeLanguage>("python");

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const displayedState = activeStep?.btreeState ?? baseState;
  const fallbackOperation: BTreeOperation = steps[0]?.operation ?? "insert";
  const scenarios = [seededBTreeScenario, ...btreeScenarios];
  const comparison = useMemo(
    () => buildBTreeStepComparison(baseState, steps),
    [baseState, steps],
  );

  function clearRangePlaybackState(state: BTreeState): BTreeState {
    const clonedState = cloneBTreeState(state);
    clonedState.activeRangeStart = undefined;
    clonedState.activeRangeEnd = undefined;
    clonedState.collectedKeys = undefined;
    return clonedState;
  }

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
    setBaseState(cloneBTreeState(scenario.baseState));
    setCommittedState(cloneBTreeState(scenario.finalState));
    setSteps(
      scenario.steps.map((step) => ({
        ...step,
        btreeState: cloneBTreeState(step.btreeState),
      })),
    );
    setCurrentStepIndex(-1);
  }

  function commitSteps(nextSteps: BTreeStep[], operationLabel: string) {
    const finalState = nextSteps[nextSteps.length - 1]?.btreeState ?? committedState;

    setIsPlaying(false);
    setSelectedScenarioId(`btree-manual-${operationLabel}`);
    setScenarioTitle(operationLabel);
    setScenarioDescription(
      "手動操作で生成したステップです。Reset で操作前の木に戻れます。",
    );
    setScenarioWatchPoints([]);
    setBaseState(cloneBTreeState(committedState));
    setCommittedState(clearRangePlaybackState(finalState));
    setSteps(
      nextSteps.map((step) => ({
        ...step,
        btreeState: cloneBTreeState(step.btreeState),
      })),
    );
    setCurrentStepIndex(-1);
  }

  function handleInsert() {
    const key = Number(keyInput);
    if (!Number.isInteger(key)) {
      return;
    }

    commitSteps(buildInsertSteps(committedState, key), `INSERT ${key}`);
  }

  function handleSearch() {
    const key = Number(keyInput);
    if (!Number.isInteger(key)) {
      return;
    }

    commitSteps(buildSearchSteps(committedState, key), `SEARCH ${key}`);
  }

  function handleDelete() {
    const key = Number(keyInput);
    if (!Number.isInteger(key)) {
      return;
    }

    commitSteps(buildDeleteSteps(committedState, key), `DELETE ${key}`);
  }

  function handleRangeScan() {
    const startKey = Number(rangeStartInput);
    const endKey = Number(rangeEndInput);
    if (
      !Number.isInteger(startKey) ||
      !Number.isInteger(endKey) ||
      startKey > endKey
    ) {
      return;
    }

    commitSteps(
      buildRangeScanSteps(committedState, startKey, endKey),
      `RANGE ${startKey}..${endKey}`,
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
          <p className="eyebrow">Storage Engine Structure</p>
          <h1>Normal B-tree</h1>
          <p className="hero-copy">
            通常の B ツリーに対して、探索、挿入、分割、範囲走査でどの部分木やキーを読むかを 1 ステップずつ可視化します。
          </p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">Search</span>
          <span className="hero-badge">Insert</span>
          <span className="hero-badge">Delete</span>
          <span className="hero-badge">Range Scan</span>
          <span className="hero-badge">Split</span>
        </div>
      </header>

      <div className="workspace">
        <BTreeControlPanel
          keyInput={keyInput}
          onKeyInputChange={setKeyInput}
          rangeStartInput={rangeStartInput}
          rangeEndInput={rangeEndInput}
          onRangeStartInputChange={setRangeStartInput}
          onRangeEndInputChange={setRangeEndInput}
          onInsert={handleInsert}
          onSearch={handleSearch}
          onDelete={handleDelete}
          onRangeScan={handleRangeScan}
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
          <BTreeView btreeState={displayedState} step={activeStep} />
          <StepTimeline
            steps={steps}
            currentStepIndex={currentStepIndex}
            onSelectStep={(index) => {
              setIsPlaying(false);
              setCurrentStepIndex(index);
            }}
          />
          <BTreeCodePanel
            step={activeStep}
            fallbackOperation={fallbackOperation}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={btreeCodeExamples}
          />
        </div>

        <BTreeInspector
          step={activeStep}
          btreeState={displayedState}
          scenarioTitle={scenarioTitle}
          scenarioDescription={scenarioDescription}
          watchPoints={scenarioWatchPoints}
          comparison={comparison}
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
