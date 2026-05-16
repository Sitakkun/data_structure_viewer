import { useEffect, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { lsmCodeExamples } from "./codeExamples";
import { LSMCodePanel } from "./components/LSMCodePanel";
import { LSMControlPanel } from "./components/LSMControlPanel";
import { LSMInspector } from "./components/LSMInspector";
import { LSMView } from "./components/LSMView";
import {
  cloneLSMScenarioSteps,
  findLSMScenarioById,
  lsmScenarios,
  seededLSMScenario,
} from "./scenarios";
import {
  buildCompactSteps,
  buildDeleteSteps,
  buildFlushSteps,
  buildPutSteps,
  buildSearchSteps,
  cloneLSMState,
} from "./simulation";
import { LSMLanguage, LSMOperation, LSMState, LSMStep } from "./types";

function cloneSteps(steps: LSMStep[]) {
  return steps.map((step) => ({
    ...step,
    lsmState: cloneLSMState(step.lsmState),
  }));
}

export function LSMTreePage() {
  const [baseState, setBaseState] = useState<LSMState>(
    cloneLSMState(seededLSMScenario.baseState),
  );
  const [committedState, setCommittedState] = useState<LSMState>(
    cloneLSMState(seededLSMScenario.finalState),
  );
  const [steps, setSteps] = useState<LSMStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [keyInput, setKeyInput] = useState("35");
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    seededLSMScenario.id,
  );
  const [scenarioTitle, setScenarioTitle] = useState(seededLSMScenario.title);
  const [scenarioDescription, setScenarioDescription] = useState(
    seededLSMScenario.description,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [selectedLanguage, setSelectedLanguage] =
    useState<LSMLanguage>("pseudo");

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const displayedState = activeStep?.lsmState ?? baseState;
  const fallbackOperation: LSMOperation = steps[0]?.operation ?? "put";
  const scenarios = [seededLSMScenario, ...lsmScenarios];

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
    const scenario = findLSMScenarioById(scenarioId);

    setIsPlaying(false);
    setSelectedScenarioId(scenario.id);
    setScenarioTitle(scenario.title);
    setScenarioDescription(scenario.description);
    setBaseState(cloneLSMState(scenario.baseState));
    setCommittedState(cloneLSMState(scenario.finalState));
    setSteps(cloneLSMScenarioSteps(scenario));
    setCurrentStepIndex(-1);
  }

  function commitSteps(nextSteps: LSMStep[], operationLabel: string) {
    const finalState = nextSteps[nextSteps.length - 1]?.lsmState ?? committedState;

    setIsPlaying(false);
    setSelectedScenarioId(`lsm-manual-${operationLabel}`);
    setScenarioTitle(operationLabel);
    setScenarioDescription(
      "手動操作で生成したステップです。Reset で操作前の状態に戻れます。",
    );
    setBaseState(cloneLSMState(committedState));
    setCommittedState(cloneLSMState(finalState));
    setSteps(cloneSteps(nextSteps));
    setCurrentStepIndex(-1);
  }

  function parseKey() {
    const key = Number(keyInput);
    return Number.isInteger(key) ? key : undefined;
  }

  function handlePut() {
    const key = parseKey();
    if (key === undefined) {
      return;
    }
    commitSteps(buildPutSteps(committedState, key), `PUT ${key}`);
  }

  function handleSearch() {
    const key = parseKey();
    if (key === undefined) {
      return;
    }
    commitSteps(buildSearchSteps(committedState, key), `SEARCH ${key}`);
  }

  function handleDelete() {
    const key = parseKey();
    if (key === undefined) {
      return;
    }
    commitSteps(buildDeleteSteps(committedState, key), `DELETE ${key}`);
  }

  function handleFlush() {
    commitSteps(buildFlushSteps(committedState), "FLUSH MEMTABLE");
  }

  function handleCompact() {
    commitSteps(buildCompactSteps(committedState), "COMPACT SSTABLES");
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
          <p className="eyebrow">Log-Structured Storage</p>
          <h1>LSM-tree</h1>
          <p className="hero-copy">
            write を WAL と memtable に受け、flush で SSTable を作り、search と compaction で
            read/write amplification のトレードオフを確認します。
          </p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">WAL</span>
          <span className="hero-badge">Memtable</span>
          <span className="hero-badge">SSTable</span>
          <span className="hero-badge">Compaction</span>
          <span className="hero-badge">Tombstone</span>
        </div>
      </header>

      <div className="workspace">
        <LSMControlPanel
          keyInput={keyInput}
          onKeyInputChange={setKeyInput}
          onPut={handlePut}
          onSearch={handleSearch}
          onDelete={handleDelete}
          onFlush={handleFlush}
          onCompact={handleCompact}
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
          <LSMView lsmState={displayedState} step={activeStep} />
          <LSMCodePanel
            step={activeStep}
            fallbackOperation={fallbackOperation}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={lsmCodeExamples}
          />
        </div>

        <LSMInspector
          step={activeStep}
          lsmState={displayedState}
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
