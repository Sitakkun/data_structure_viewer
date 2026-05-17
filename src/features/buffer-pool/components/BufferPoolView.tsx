import {
  BufferFrame,
  BufferPoolState,
  BufferPoolStep,
} from "../types";

interface BufferPoolViewProps {
  bufferState: BufferPoolState;
  step?: BufferPoolStep;
}

const diskPages = Array.from({ length: 16 }, (_, index) => index + 1);

function pageLabel(pageId?: number) {
  return pageId === undefined ? "empty" : `P${pageId}`;
}

function FrameCard({
  frame,
  step,
}: {
  frame: BufferFrame;
  step?: BufferPoolStep;
}) {
  const isActive = step?.highlights.activeFrameIndex === frame.frameIndex;
  const isVictim = step?.highlights.victimFrameIndex === frame.frameIndex;
  const classes = [
    "buffer-frame-card",
    isActive ? "is-active" : "",
    isVictim ? "is-victim" : "",
    frame.dirty ? "is-dirty" : "",
    frame.pinCount > 0 ? "is-pinned" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes}>
      <div className="buffer-frame-header">
        <strong>Frame {frame.frameIndex}</strong>
        <span>{pageLabel(frame.pageId)}</span>
      </div>
      <div className="buffer-frame-flags">
        <span className={frame.dirty ? "buffer-flag is-on" : "buffer-flag"}>
          dirty
        </span>
        <span className={frame.referenceBit ? "buffer-flag is-on" : "buffer-flag"}>
          ref={frame.referenceBit ? 1 : 0}
        </span>
        <span className={frame.pinCount > 0 ? "buffer-flag is-on" : "buffer-flag"}>
          pin={frame.pinCount}
        </span>
      </div>
      <div className="buffer-frame-meta">
        <span>last access {frame.lastAccessTick || "-"}</span>
        <span>count {frame.accessCount}</span>
      </div>
    </article>
  );
}

function LruList({ bufferState }: { bufferState: BufferPoolState }) {
  return (
    <div className="buffer-policy-strip">
      <span className="buffer-policy-label">LRU</span>
      <div className="buffer-policy-chain">
        <span className="buffer-end-chip">oldest</span>
        {bufferState.lruOrder.map((frameIndex) => {
          const frame = bufferState.frames[frameIndex];
          return (
            <span key={frameIndex} className="buffer-page-chip">
              {pageLabel(frame.pageId)}
              <small>F{frameIndex}</small>
            </span>
          );
        })}
        <span className="buffer-end-chip">newest</span>
      </div>
    </div>
  );
}

function ClockRing({
  bufferState,
  step,
}: {
  bufferState: BufferPoolState;
  step?: BufferPoolStep;
}) {
  return (
    <div className="buffer-policy-strip">
      <span className="buffer-policy-label">CLOCK</span>
      <div className="buffer-clock-ring">
        {bufferState.frames.map((frame) => (
          <span
            key={frame.frameIndex}
            className={
              frame.frameIndex === (step?.highlights.clockHandIndex ?? bufferState.clockHand)
                ? "buffer-clock-slot is-hand"
                : "buffer-clock-slot"
            }
          >
            <strong>{pageLabel(frame.pageId)}</strong>
            <small>F{frame.frameIndex} / ref {frame.referenceBit ? 1 : 0}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

export function BufferPoolView({ bufferState, step }: BufferPoolViewProps) {
  const activePageId = step?.highlights.activePageId;

  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>Buffer Pool Page Replacement</h2>
      </div>

      <div className="formula-strip">
        <span className="formula-pill">Policy = {bufferState.policy.toUpperCase()}</span>
        <span className="formula-pill">Frames = {bufferState.capacity}</span>
        <span className="formula-pill">Clock hand = F{bufferState.clockHand}</span>
        <span className="formula-note">
          hit は logical read だけで済み、miss は disk から page を frame に読み込みます。
        </span>
      </div>

      <div className="buffer-disk-row">
        {diskPages.map((pageId) => (
          <span
            key={pageId}
            className={
              pageId === activePageId
                ? "buffer-disk-page is-active"
                : "buffer-disk-page"
            }
          >
            P{pageId}
          </span>
        ))}
      </div>

      <div className="buffer-frame-grid">
        {bufferState.frames.map((frame) => (
          <FrameCard key={frame.frameIndex} frame={frame} step={step} />
        ))}
      </div>

      {bufferState.policy === "lru" ? (
        <LruList bufferState={bufferState} />
      ) : (
        <ClockRing bufferState={bufferState} step={step} />
      )}
    </section>
  );
}
