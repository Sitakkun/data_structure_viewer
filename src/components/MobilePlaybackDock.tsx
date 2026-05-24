import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface MobilePlaybackDockProps {
  currentStepIndex: number;
  currentStepTitle?: string;
  totalSteps: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function MobilePlaybackDock({
  currentStepIndex,
  currentStepTitle,
  totalSteps,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  onReset,
}: MobilePlaybackDockProps) {
  const [isReadingContent, setIsReadingContent] = useState(false);
  const isPlaybackModeActive = isPlaying || currentStepIndex >= 0;
  const stepLabel =
    currentStepIndex >= 0
      ? `Step ${currentStepIndex + 1} / ${totalSteps}`
      : `Ready / ${totalSteps} steps`;
  const stepTitle =
    currentStepTitle ?? (totalSteps > 0 ? "Ready for playback" : "Choose a scenario");

  useEffect(() => {
    function updateDockMode() {
      const nextIsReadingContent = window.scrollY > window.innerHeight * 0.45;
      setIsReadingContent((currentIsReadingContent) =>
        currentIsReadingContent === nextIsReadingContent
          ? currentIsReadingContent
          : nextIsReadingContent,
      );
    }

    updateDockMode();
    const intervalId = window.setInterval(updateDockMode, 250);
    window.addEventListener("scroll", updateDockMode, { passive: true });
    window.addEventListener("resize", updateDockMode);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("scroll", updateDockMode);
      window.removeEventListener("resize", updateDockMode);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    document.body.classList.toggle(
      "mobile-playback-active",
      isPlaybackModeActive,
    );

    return () => {
      document.body.classList.remove("mobile-playback-active");
    };
  }, [isPlaybackModeActive]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <section
      className={[
        "mobile-playback-dock",
        isReadingContent
          ? "is-reading-content"
          : "",
        isPlaybackModeActive ? "is-playback-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Mobile playback controls"
    >
      <div className="mobile-playback-dock-header">
        <span className="mobile-playback-dock-step">{stepLabel}</span>
        <strong className="mobile-playback-dock-title" aria-live="polite">
          {stepTitle}
        </strong>
      </div>
      <div className="mobile-playback-buttons">
        <button type="button" className="secondary-button" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="secondary-button" onClick={onPrev}>
          Prev
        </button>
        <button type="button" className="accent-button" onClick={onPlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" className="secondary-button" onClick={onNext}>
          Next
        </button>
      </div>
    </section>,
    document.body,
  );
}
