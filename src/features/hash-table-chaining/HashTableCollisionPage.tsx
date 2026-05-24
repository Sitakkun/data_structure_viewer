import { useEffect, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { StepTimeline } from "../../components/StepTimeline";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { hashTableCodeExamplesByStrategy } from "./codeExamples";
import { CodeExamplesPanel } from "./components/CodeExamplesPanel";
import { ControlPanel } from "./components/ControlPanel";
import { HashTableView } from "./components/HashTableView";
import { StepInspector } from "./components/StepInspector";
import {
  emptyLinearProbingScenario,
  linearProbingSampleScenarios,
} from "./linearProbingScenarios";
import {
  chainingSampleScenarios,
  emptyChainingScenario,
} from "./sampleScenarios";
import {
  cloneTableState,
  runLinearProbingOperation,
  runOperation,
} from "./simulation";
import {
  CodeLanguage,
  HashStrategy,
  OperationType,
  Scenario,
  Step,
  TableState,
} from "./types";

const lessonConfigs = {
  chaining: {
    heroTitle: "Hash Table: Separate Chaining",
    heroCopy:
      "衝突したキーが同じバケットに集まり、チェーンとして保持される流れを 1 ステップずつ追えます。",
    visualizationSubtitle:
      "衝突したキーは、同じバケットのチェーンへ順番に入ります。",
    codeTitle: "Separate Chaining Code",
    conceptTitle: "Chaining note",
    conceptNote:
      "1 つのバケットに複数キーが集まったら、上書きせずチェーンを伸ばして保持します。平均性能は負荷率 α に依存し、チェーンが長いほど比較回数が増えます。",
    scenarios: chainingSampleScenarios,
    emptyScenario: emptyChainingScenario,
    runOperation,
    codeExamples: hashTableCodeExamplesByStrategy.chaining,
  },
  "linear-probing": {
    heroTitle: "Hash Table: Linear Probing",
    heroCopy:
      "衝突したときに隣のスロットへ順に進む流れと、tombstone を使った削除の意味を 1 ステップずつ追えます。",
    visualizationSubtitle:
      "衝突したキーは、空きスロットが見つかるまで右へ 1 つずつ進みます。",
    codeTitle: "Linear Probing Code",
    conceptTitle: "Linear probing note",
    conceptNote:
      "同じ開始位置に複数キーが集まるとクラスタが伸びます。削除時は空へ戻さず tombstone を置き、後ろにある要素の探索鎖を維持します。",
    scenarios: linearProbingSampleScenarios,
    emptyScenario: emptyLinearProbingScenario,
    runOperation: runLinearProbingOperation,
    codeExamples: hashTableCodeExamplesByStrategy["linear-probing"],
  },
} satisfies Record<
  HashStrategy,
  {
    heroTitle: string;
    heroCopy: string;
    visualizationSubtitle: string;
    codeTitle: string;
    conceptTitle: string;
    conceptNote: string;
    scenarios: Scenario[];
    emptyScenario: Scenario;
    runOperation: (
      operation: OperationType,
      key: number,
      initialState: TableState,
    ) => { finalState: TableState; steps: Step[] };
    codeExamples: (typeof hashTableCodeExamplesByStrategy)[HashStrategy];
  }
>;

function findScenarioById(strategy: HashStrategy, id: string): Scenario {
  return (
    lessonConfigs[strategy].scenarios.find((scenario) => scenario.id === id) ??
    lessonConfigs[strategy].emptyScenario
  );
}

export function HashTableCollisionPage() {
  const [selectedStrategy, setSelectedStrategy] =
    useState<HashStrategy>("chaining");
  const [baseState, setBaseState] = useState<TableState>(
    cloneTableState(emptyChainingScenario.baseState),
  );
  const [committedState, setCommittedState] = useState<TableState>(
    cloneTableState(emptyChainingScenario.finalState),
  );
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [keyInput, setKeyInput] = useState("17");
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    emptyChainingScenario.id,
  );
  const [scenarioTitle, setScenarioTitle] = useState(emptyChainingScenario.title);
  const [scenarioDescription, setScenarioDescription] = useState(
    emptyChainingScenario.description,
  );
  const [scenarioWatchPoints, setScenarioWatchPoints] = useState<string[]>(
    emptyChainingScenario.watchPoints ?? [],
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [selectedLanguage, setSelectedLanguage] =
    useState<CodeLanguage>("python");

  const currentLesson = lessonConfigs[selectedStrategy];
  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const displayedState = activeStep?.tableState ?? baseState;
  const fallbackOperation: OperationType = steps[0]?.operation ?? "insert";

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

  function loadScenario(scenarioId: string, strategy = selectedStrategy) {
    const scenario = findScenarioById(strategy, scenarioId);

    setIsPlaying(false);
    setSelectedScenarioId(scenario.id);
    setScenarioTitle(scenario.title);
    setScenarioDescription(scenario.description);
    setScenarioWatchPoints(scenario.watchPoints ?? []);
    setBaseState(cloneTableState(scenario.baseState));
    setCommittedState(cloneTableState(scenario.finalState));
    setSteps(
      scenario.steps.map((step) => ({
        ...step,
        tableState: cloneTableState(step.tableState),
      })),
    );
    setCurrentStepIndex(-1);
  }

  function handleStrategyChange(strategy: HashStrategy) {
    if (strategy === selectedStrategy) {
      return;
    }

    setSelectedStrategy(strategy);
    const emptyScenario = lessonConfigs[strategy].emptyScenario;
    loadScenario(emptyScenario.id, strategy);
  }

  function runManualOperation(operation: OperationType) {
    const key = Number(keyInput);

    if (!Number.isInteger(key)) {
      return;
    }

    const result = currentLesson.runOperation(operation, key, committedState);

    setIsPlaying(false);
    setSelectedScenarioId(`${selectedStrategy}-manual`);
    setScenarioTitle(`${operation.toUpperCase()} ${key}`);
    setScenarioDescription(
      "手動操作で生成したステップです。Reset で操作前の状態に戻れます。",
    );
    setScenarioWatchPoints([]);
    setBaseState(cloneTableState(committedState));
    setCommittedState(cloneTableState(result.finalState));
    setSteps(
      result.steps.map((step) => ({
        ...step,
        tableState: cloneTableState(step.tableState),
      })),
    );
    setCurrentStepIndex(-1);
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
          <p className="eyebrow">Algorithm Study Board</p>
          <h1>{currentLesson.heroTitle}</h1>
          <p className="hero-copy">{currentLesson.heroCopy}</p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">Personal MVP</span>
          <span className="hero-badge">Fixed bucket count</span>
          <span className="hero-badge">Integer keys</span>
        </div>
      </header>

      <div className="workspace">
        <ControlPanel
          selectedStrategy={selectedStrategy}
          onStrategyChange={handleStrategyChange}
          keyInput={keyInput}
          onKeyInputChange={setKeyInput}
          onInsert={() => runManualOperation("insert")}
          onSearch={() => runManualOperation("search")}
          onDelete={() => runManualOperation("delete")}
          onLoadScenario={loadScenario}
          scenarios={currentLesson.scenarios}
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
          <HashTableView
            tableState={displayedState}
            step={activeStep}
            title={currentLesson.heroTitle}
            subtitle={currentLesson.visualizationSubtitle}
          />
          <StepTimeline
            steps={steps}
            currentStepIndex={currentStepIndex}
            onSelectStep={(index) => {
              setIsPlaying(false);
              setCurrentStepIndex(index);
            }}
          />
          <CodeExamplesPanel
            step={activeStep}
            fallbackOperation={fallbackOperation}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={currentLesson.codeExamples}
            title={currentLesson.codeTitle}
          />
        </div>

        <StepInspector
          step={activeStep}
          tableState={displayedState}
          currentScenarioTitle={scenarioTitle}
          currentScenarioDescription={scenarioDescription}
          watchPoints={scenarioWatchPoints}
          conceptTitle={currentLesson.conceptTitle}
          conceptNote={currentLesson.conceptNote}
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
