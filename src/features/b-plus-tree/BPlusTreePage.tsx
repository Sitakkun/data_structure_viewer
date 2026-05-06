import { useEffect, useMemo, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { buildBPlusTreeStepComparison } from "../treeStepComparison";
import { bplusTreeCodeExamples } from "./codeExamples";
import { BPlusTreeCodePanel } from "./components/BPlusTreeCodePanel";
import { BPlusTreeControlPanel } from "./components/BPlusTreeControlPanel";
import { BPlusTreeInspector } from "./components/BPlusTreeInspector";
import { BPlusTreeView } from "./components/BPlusTreeView";
import {
  bplusTreeScenarios,
  emptyBPlusTreeScenario,
  seededBPlusTreeScenario,
} from "./scenarios";
import {
  buildDeleteSteps,
  buildInsertSteps,
  buildRangeScanSteps,
  buildSearchSteps,
  cloneBPlusTreeState,
} from "./simulation";
import {
  BPlusTreeLanguage,
  BPlusTreeOperation,
  BPlusTreeScenario,
  BPlusTreeState,
  BPlusTreeStep,
} from "./types";

function findScenarioById(id: string): BPlusTreeScenario {
  if (id === seededBPlusTreeScenario.id) {
    return seededBPlusTreeScenario;
  }

  return (
    bplusTreeScenarios.find((scenario) => scenario.id === id) ??
    emptyBPlusTreeScenario
  );
}

export function BPlusTreePage() {
  const [baseState, setBaseState] = useState<BPlusTreeState>(
    cloneBPlusTreeState(seededBPlusTreeScenario.baseState),
  );
  const [committedState, setCommittedState] = useState<BPlusTreeState>(
    cloneBPlusTreeState(seededBPlusTreeScenario.finalState),
  );
  const [steps, setSteps] = useState<BPlusTreeStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [keyInput, setKeyInput] = useState("35");
  const [rangeStartInput, setRangeStartInput] = useState("15");
  const [rangeEndInput, setRangeEndInput] = useState("45");
  const [selectedScenarioId, setSelectedScenarioId] =
    useState(seededBPlusTreeScenario.id);
  const [scenarioTitle, setScenarioTitle] = useState(
    seededBPlusTreeScenario.title,
  );
  const [scenarioDescription, setScenarioDescription] = useState(
    seededBPlusTreeScenario.description,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [selectedLanguage, setSelectedLanguage] =
    useState<BPlusTreeLanguage>("python");

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const displayedState = activeStep?.bplusTreeState ?? baseState;
  const fallbackOperation: BPlusTreeOperation = steps[0]?.operation ?? "insert";
  const scenarios = [seededBPlusTreeScenario, ...bplusTreeScenarios];
  const comparison = useMemo(
    () => buildBPlusTreeStepComparison(baseState, steps),
    [baseState, steps],
  );

  function clearRangePlaybackState(state: BPlusTreeState): BPlusTreeState {
    const clonedState = cloneBPlusTreeState(state);
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
    setBaseState(cloneBPlusTreeState(scenario.baseState));
    setCommittedState(cloneBPlusTreeState(scenario.finalState));
    setSteps(
      scenario.steps.map((step) => ({
        ...step,
        bplusTreeState: cloneBPlusTreeState(step.bplusTreeState),
      })),
    );
    setCurrentStepIndex(-1);
  }

  function commitSteps(nextSteps: BPlusTreeStep[], operationLabel: string) {
    const finalState =
      nextSteps[nextSteps.length - 1]?.bplusTreeState ?? committedState;

    setIsPlaying(false);
    setSelectedScenarioId(`bplustree-manual-${operationLabel}`);
    setScenarioTitle(operationLabel);
    setScenarioDescription(
      "手動操作で生成したステップです。Reset で操作前の木に戻れます。",
    );
    setBaseState(cloneBPlusTreeState(committedState));
    setCommittedState(clearRangePlaybackState(finalState));
    setSteps(
      nextSteps.map((step) => ({
        ...step,
        bplusTreeState: cloneBPlusTreeState(step.bplusTreeState),
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
          <h1>Normal B+ Tree</h1>
          <p className="hero-copy">
            通常の B+ Tree に対して、内部ノードのセパレータと葉ノードの実データ、
            そして葉の連結順を見ながら search / insert / range scan を追えます。
          </p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">Search</span>
          <span className="hero-badge">Insert</span>
          <span className="hero-badge">Delete</span>
          <span className="hero-badge">Range Scan</span>
          <span className="hero-badge">Leaf Chain</span>
        </div>
      </header>

      <div className="workspace">
        <BPlusTreeControlPanel
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
          <BPlusTreeView bplusTreeState={displayedState} step={activeStep} />
          <BPlusTreeCodePanel
            step={activeStep}
            fallbackOperation={fallbackOperation}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={bplusTreeCodeExamples}
          />
        </div>

        <BPlusTreeInspector
          step={activeStep}
          bplusTreeState={displayedState}
          scenarioTitle={scenarioTitle}
          scenarioDescription={scenarioDescription}
          comparison={comparison}
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
