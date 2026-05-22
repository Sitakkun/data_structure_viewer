import { useState } from "react";

interface StepTimelineItem {
  id: string;
  title: string;
}

interface StepTimelineProps {
  steps: ReadonlyArray<StepTimelineItem>;
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
}

const compactTimelineMediaQuery = "(max-width: 720px)";

function isCompactTimelineViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(compactTimelineMediaQuery).matches
  );
}

export function StepTimeline({
  steps,
  currentStepIndex,
  onSelectStep,
}: StepTimelineProps) {
  const [isOpen, setIsOpen] = useState(() => {
    return !isCompactTimelineViewport();
  });

  if (steps.length === 0) {
    return null;
  }

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const upcomingStep =
    currentStepIndex >= 0 ? steps[currentStepIndex + 1] : steps[0];
  const currentLabel = activeStep
    ? `Step ${currentStepIndex + 1} / ${steps.length}`
    : `Before playback / ${steps.length} steps`;
  const railTitle = activeStep?.title ?? "Ready for playback";
  const upcomingLabel = upcomingStep
    ? `${activeStep ? "Next" : "First"}: ${upcomingStep.title}`
    : "Final milestone";

  function handleSelectStep(index: number) {
    onSelectStep(index);

    if (isCompactTimelineViewport()) {
      setIsOpen(false);
    }
  }

  return (
    <details
      className="panel panel-timeline"
      aria-label="Step timeline"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="step-timeline-summary">
        <span className="step-timeline-summary-main">
          <span className="eyebrow">Timeline</span>
          <strong className="step-timeline-heading">Named milestones</strong>
          <span className="step-timeline-active-title">{railTitle}</span>
          <span className="step-timeline-next">{upcomingLabel}</span>
        </span>
        <span className="step-timeline-current">{currentLabel}</span>
      </summary>

      <ol className="step-timeline-list">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;

          return (
            <li key={`${step.id}-${index}`}>
              <button
                type="button"
                className={
                  isActive
                    ? "step-timeline-button is-active"
                    : "step-timeline-button"
                }
                aria-current={isActive ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${step.title}`}
                onClick={() => handleSelectStep(index)}
              >
                <span className="step-timeline-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="step-timeline-title">{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </details>
  );
}
