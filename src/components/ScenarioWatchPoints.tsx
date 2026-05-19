interface ScenarioWatchPointsProps {
  watchPoints?: string[];
  isVisible: boolean;
}

export function ScenarioWatchPoints({
  watchPoints,
  isVisible,
}: ScenarioWatchPointsProps) {
  if (!isVisible || !watchPoints?.length) {
    return null;
  }

  return (
    <section
      className="watch-points-card"
      aria-label="What to watch before playback"
    >
      <p className="detail-label">Before you press Play</p>
      <strong>What to watch</strong>
      <ul>
        {watchPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}
