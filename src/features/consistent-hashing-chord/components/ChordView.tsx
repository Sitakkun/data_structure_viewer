import { ChordState, ChordStep } from "../types";

interface ChordViewProps {
  chordState: ChordState;
  step?: ChordStep;
  focusedNodeId?: string;
  onFocusedNodeChange: (nodeId: string) => void;
}

function polarToCartesian(radius: number, hash: number) {
  const angle = ((hash / 32) * 360 - 90) * (Math.PI / 180);
  const center = 240;

  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

export function ChordView({
  chordState,
  step,
  focusedNodeId,
  onFocusedNodeChange,
}: ChordViewProps) {
  const activeNodeId = step?.highlights.activeNodeId ?? chordState.currentNodeId;
  const nextNodeId = step?.highlights.nextNodeId ?? chordState.activeHop?.toNodeId;
  const ownerNodeId = chordState.activeResource?.ownerNodeId;
  const currentHop = chordState.activeHop;

  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>Chord Finger Table Lookup</h2>
      </div>

      <div className="formula-strip">
        <span className="formula-pill">
          ring size = 2^{chordState.ringBits} = {chordState.ringSize}
        </span>
        <span className="formula-note">
          各ノードは `2^i` 先の区間を指す finger table を持ち、そこから最も遠くまで進める entry を選びます。
        </span>
      </div>

      <div className="ring-visual">
        <svg viewBox="0 0 480 480" className="ring-svg" aria-label="Chord ring">
          <circle cx="240" cy="240" r="162" className="ring-outline" />
          <circle cx="240" cy="240" r="118" className="ring-inner" />

          {chordState.activeResource ? (() => {
            const point = polarToCartesian(138, chordState.activeResource.hash);

            return (
              <g>
                <line
                  x1="240"
                  y1="240"
                  x2={point.x}
                  y2={point.y}
                  className="ring-resource-line is-active"
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="9"
                  className="ring-resource-dot is-active is-registered"
                />
                <text x={point.x + 12} y={point.y} className="ring-resource-label">
                  {chordState.activeResource.id} @ {chordState.activeResource.hash}
                </text>
              </g>
            );
          })() : null}

          {currentHop ? (() => {
            const fromNode = chordState.nodes.find((node) => node.id === currentHop.fromNodeId);
            const toNode = chordState.nodes.find((node) => node.id === currentHop.toNodeId);

            if (!fromNode || !toNode) {
              return null;
            }

            const fromPoint = polarToCartesian(162, fromNode.hash);
            const toPoint = polarToCartesian(162, toNode.hash);

            return (
              <line
                x1={fromPoint.x}
                y1={fromPoint.y}
                x2={toPoint.x}
                y2={toPoint.y}
                className="chord-hop-line"
              />
            );
          })() : null}

          {chordState.nodes.map((node) => {
            const point = polarToCartesian(162, node.hash);
            const isActive = node.id === activeNodeId;
            const isNext = node.id === nextNodeId;
            const isOwner = node.id === ownerNodeId;

            return (
              <g key={node.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isOwner ? 15 : 12}
                  fill={node.color}
                  className={[
                    "ring-node-dot",
                    isActive ? "is-active" : "",
                    isNext ? "chord-node-dot-next" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
                <text x={point.x + 14} y={point.y + 4} className="ring-node-label">
                  {node.id} ({node.hash})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="chord-path-row">
        {chordState.pathNodeIds.length === 0 ? (
          <span className="empty-slot">Run lookup to see the Chord path</span>
        ) : (
          chordState.pathNodeIds.map((nodeId) => (
            <span key={nodeId} className="chord-path-pill">
              {nodeId}
            </span>
          ))
        )}
      </div>

      <div className="ring-node-list">
        {chordState.nodes.map((node) => {
          const assignedResources = chordState.resources.filter(
            (resource) => resource.ownerNodeId === node.id,
          );

          return (
            <button
              key={node.id}
              type="button"
              className={
                node.id === focusedNodeId
                  ? "ring-node-chip is-active chord-node-card"
                  : "ring-node-chip chord-node-card"
              }
              onClick={() => onFocusedNodeChange(node.id)}
            >
              <div className="ring-node-chip-header">
                <span
                  className="ring-node-swatch"
                  style={{ backgroundColor: node.color }}
                  aria-hidden="true"
                />
                <strong>{node.id}</strong>
                <span>{node.hash}</span>
              </div>
              <div className="chord-node-meta">
                <span>succ: {node.successorId}</span>
                <span>pred: {node.predecessorId}</span>
              </div>
              <div className="ring-resource-list">
                {assignedResources.map((resource) => (
                  <span
                    key={resource.id}
                    className={
                      resource.id === chordState.activeResource?.id
                        ? "ring-resource-chip is-active"
                        : "ring-resource-chip"
                    }
                  >
                    {resource.id}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
