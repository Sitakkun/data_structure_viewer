import { useEffect, useState } from "react";
import { MobilePlaybackDock } from "../../components/MobilePlaybackDock";
import { StepTimeline } from "../../components/StepTimeline";
import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";
import { writeAmplificationCodeExamples } from "./codeExamples";
import { WriteAmplificationCodePanel } from "./components/WriteAmplificationCodePanel";
import { WriteAmplificationControlPanel } from "./components/WriteAmplificationControlPanel";
import { WriteAmplificationFlowView } from "./components/WriteAmplificationFlowView";
import { WriteAmplificationInspector } from "./components/WriteAmplificationInspector";
import {
  findWriteAmplificationScenarioById,
  writeAmplificationScenarios,
} from "./scenarios";
import {
  buildWriteAmplificationSteps,
  buildWriteAmplificationSummaries,
  defaultWorkloadConfig,
} from "./simulation";
import {
  WorkloadConfig,
  WriteAmplificationLanguage,
  WriteAmplificationStep,
  WriteEngine,
} from "./types";

function cloneSteps(steps: WriteAmplificationStep[]) {
  return steps.map((step) => ({
    ...step,
    summaries: {
      btree: {
        ...step.summaries.btree,
        events: step.summaries.btree.events.map((event) => ({ ...event })),
      },
      bepsilon: {
        ...step.summaries.bepsilon,
        events: step.summaries.bepsilon.events.map((event) => ({ ...event })),
      },
      lsm: {
        ...step.summaries.lsm,
        events: step.summaries.lsm.events.map((event) => ({ ...event })),
      },
    },
  }));
}

export function WriteAmplificationPage() {
  const initialScenario = writeAmplificationScenarios[0];
  const [config, setConfig] = useState<WorkloadConfig>(defaultWorkloadConfig);
  const [steps, setSteps] = useState<WriteAmplificationStep[]>(
    cloneSteps(initialScenario.steps),
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    initialScenario.id,
  );
  const [scenarioTitle, setScenarioTitle] = useState(initialScenario.title);
  const [scenarioDescription, setScenarioDescription] = useState(
    initialScenario.description,
  );
  const [scenarioWatchPoints, setScenarioWatchPoints] = useState<string[]>(
    initialScenario.watchPoints ?? [],
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [selectedCodeEngine, setSelectedCodeEngine] =
    useState<WriteEngine>("btree");
  const [selectedLanguage, setSelectedLanguage] =
    useState<WriteAmplificationLanguage>("pseudo");

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const summaries =
    activeStep?.summaries ?? buildWriteAmplificationSummaries(config);

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
    const scenario = findWriteAmplificationScenarioById(scenarioId);

    setIsPlaying(false);
    setSelectedScenarioId(scenario.id);
    setScenarioTitle(scenario.title);
    setScenarioDescription(scenario.description);
    setScenarioWatchPoints(scenario.watchPoints ?? []);
    setConfig(scenario.config);
    setSteps(cloneSteps(scenario.steps));
    setCurrentStepIndex(-1);
  }

  function handleRun() {
    const nextSteps = buildWriteAmplificationSteps(config);

    setIsPlaying(false);
    setSelectedScenarioId("wa-manual");
    setScenarioTitle("Manual write amplification comparison");
    setScenarioDescription(
      "操作パネルの設定で生成した比較です。Reset でステップ先頭前に戻れます。",
    );
    setScenarioWatchPoints([]);
    setSteps(cloneSteps(nextSteps));
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
          <p className="eyebrow">Storage Cost Model</p>
          <h1>Write Amplification</h1>
          <p className="hero-copy">
            同じ logical write が B-tree / Bε tree / LSM-tree でどの物理書き込みへ変換されるかを、
            教材用の normalized write units で比較します。
          </p>
        </div>
        <div className="hero-meta">
          <span className="hero-badge">B-tree</span>
          <span className="hero-badge">Bε tree</span>
          <span className="hero-badge">LSM-tree</span>
          <span className="hero-badge">RUM</span>
        </div>
      </header>

      <div className="workspace">
        <WriteAmplificationControlPanel
          config={config}
          onConfigChange={setConfig}
          onRun={handleRun}
          onLoadScenario={loadScenario}
          scenarios={writeAmplificationScenarios}
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
          <WriteAmplificationFlowView step={activeStep} summaries={summaries} />
          <StepTimeline
            steps={steps}
            currentStepIndex={currentStepIndex}
            onSelectStep={(index) => {
              setIsPlaying(false);
              setCurrentStepIndex(index);
            }}
          />
          <WriteAmplificationCodePanel
            selectedEngine={selectedCodeEngine}
            onEngineChange={setSelectedCodeEngine}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            codeExamples={writeAmplificationCodeExamples}
          />
        </div>

        <WriteAmplificationInspector
          step={activeStep}
          summaries={summaries}
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
