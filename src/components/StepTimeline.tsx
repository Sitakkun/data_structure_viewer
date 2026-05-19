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

export function StepTimeline({
  steps,
  currentStepIndex,
  onSelectStep,
}: StepTimelineProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (steps.length === 0) {
    return null;
  }

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const currentLabel = activeStep
    ? `Step ${currentStepIndex + 1} / ${steps.length}`
    : `Before playback / ${steps.length} steps`;

  return (
    <details
      className="panel panel-timeline"
      aria-label="Step timeline"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="step-timeline-summary">
        <span>
          <span className="eyebrow">Timeline</span>
          <strong>Named milestones</strong>
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
                onClick={() => onSelectStep(index)}
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
