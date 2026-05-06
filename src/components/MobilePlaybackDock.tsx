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
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <section className="mobile-playback-dock" aria-label="Mobile playback controls">
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
