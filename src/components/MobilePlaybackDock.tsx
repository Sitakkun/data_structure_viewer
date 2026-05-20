import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface MobilePlaybackDockProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function MobilePlaybackDock({
  currentStepIndex,
  totalSteps,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  onReset,
}: MobilePlaybackDockProps) {
  const [isReadingContent, setIsReadingContent] = useState(false);

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

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <section
      className={
        isReadingContent
          ? "mobile-playback-dock is-reading-content"
          : "mobile-playback-dock"
      }
      aria-label="Mobile playback controls"
    >
      <div className="mobile-playback-dock-header">
        <p className="eyebrow">Playback</p>
        <span>
          Step {Math.max(currentStepIndex + 1, 0)} / {totalSteps}
        </span>
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
