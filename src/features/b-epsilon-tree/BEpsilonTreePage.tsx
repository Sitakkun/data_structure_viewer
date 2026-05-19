import { useEffect, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { bEpsilonCodeExamples } from "./codeExamples";
import { BEpsilonTreeCodePanel } from "./components/BEpsilonTreeCodePanel";
import { BEpsilonTreeControlPanel } from "./components/BEpsilonTreeControlPanel";
import { BEpsilonTreeInspector } from "./components/BEpsilonTreeInspector";
import { BEpsilonTreeView } from "./components/BEpsilonTreeView";
import {
  bEpsilonScenarios,
  cloneScenarioSteps,
  findBEpsilonScenarioById,
  seededBEpsilonScenario,
} from "./scenarios";
import {
  buildDeleteSteps,
  buildFlushSteps,
  buildInsertSteps,
  buildSearchSteps,
  cloneBEpsilonState,
} from "./simulation";
import {
  BEpsilonLanguage,
  BEpsilonOperation,
  BEpsilonScenario,
  BEpsilonState,
  BEpsilonStep,
} from "./types";

function cloneSteps(steps: BEpsilonStep[]) {
  return steps.map((step) => ({
    ...step,
    bepsilonState: cloneBEpsilonState(step.bepsilonState),
  }));
}

function cloneScenarioState(scenario: BEpsilonScenario): BEpsilonState {
  return cloneBEpsilonState(scenario.finalState);
}

export function BEpsilonTreePage() {
  const [baseState, setBaseState] = useState<BEpsilonState>(
    cloneBEpsilonState(seededBEpsilonScenario.baseState),
  );
  const [committedState, setCommittedState] = useState<BEpsilonState>(
    cloneScenarioState(seededBEpsilonScenario),
  );
  const [steps, setSteps] = useState<BEpsilonStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [keyInput, setKeyInput] = useState("42");
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    seededBEpsilonScenario.id,
  );
  const [scenarioTitle, setScenarioTitle] = useState(
    seededBEpsilonScenario.title,
  );
  const [scenarioDescription, setScenarioDescription] = useState(
    seededBEpsilonScenario.description,
  );
  const [scenarioWatchPoints, setScenarioWatchPoints] = useState<string[]>(
    seededBEpsilonScenario.watchPoints ?? [],
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [selectedLanguage, setSelectedLanguage] =
    useState<BEpsilonLanguage>("python");

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const displayedState = activeStep?.bepsilonState ?? baseState;
  const fallbackOperation: BEpsilonOperation = steps[0]?.operation ?? "insert";
  const scenarios = [seededBEpsilonScenario, ...bEpsilonScenarios];

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
    const scenario = findBEpsilonScenarioById(scenarioId);

    setIsPlaying(false);
    setSelectedScenarioId(scenario.id);
    setScenarioTitle(scenario.title);
    setScenarioDescription(scenario.description);
    setScenarioWatchPoints(scenario.watchPoints ?? []);
    setBaseState(cloneBEpsilonState(scenario.baseState));
    setCommittedState(cloneBEpsilonState(scenario.finalState));
    setSteps(cloneScenarioSteps(scenario));
    setCurrentStepIndex(-1);
  }

  function commitSteps(nextSteps: BEpsilonStep[], operationLabel: string) {
    const finalState =
      nextSteps[nextSteps.length - 1]?.bepsilonState ?? committedState;

    setIsPlaying(false);
    setSelectedScenarioId(`bepsilon-manual-${operationLabel}`);
    setScenarioTitle(operationLabel);
    setScenarioDescription(
      "手動操作で生成したステップです。Reset で操作前の木に戻れます。",
    );
    setScenarioWatchPoints([]);
    setBaseState(cloneBEpsilonState(committedState));
    setCommittedState(cloneBEpsilonState(finalState));
    setSteps(cloneSteps(nextSteps));
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

  function handleFlush() {
    commitSteps(buildFlushSteps(committedState), "FLUSH NEXT BUFFER");
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
          <p className="eyebrow">Write-Optimized Index</p>
          <h1>Bε Tree</h1>
          <p className="hero-copy">
            B-tree に buffer を持たせた write-optimized な構造として、
            更新メッセージの蓄積、batch flush、検索時の buffer 確認を追えます。
          </p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">Buffered Insert</span>
          <span className="hero-badge">Flush</span>
          <span className="hero-badge">Search Buffer</span>
          <span className="hero-badge">Tombstone</span>
        </div>
      </header>

      <div className="workspace">
        <BEpsilonTreeControlPanel
          keyInput={keyInput}
          onKeyInputChange={setKeyInput}
          onInsert={handleInsert}
          onSearch={handleSearch}
          onDelete={handleDelete}
          onFlush={handleFlush}
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
          <BEpsilonTreeView bepsilonState={displayedState} step={activeStep} />
          <BEpsilonTreeCodePanel
            step={activeStep}
            fallbackOperation={fallbackOperation}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={bEpsilonCodeExamples}
          />
        </div>

        <BEpsilonTreeInspector
          step={activeStep}
          bepsilonState={displayedState}
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
