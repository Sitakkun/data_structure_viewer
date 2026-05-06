import { RingState, RingStep } from "../types";

interface HashRingViewProps {
  ringState: RingState;
  step?: RingStep;
}

function polarToCartesian(radius: number, hash: number) {
  const angle = ((hash - 90) * Math.PI) / 180;
  const center = 240;

  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

export function HashRingView({ ringState, step }: HashRingViewProps) {
  const activeNodeIds = new Set(step?.highlights.candidateNodeIds ?? []);
  const activeResourceId =
    step?.highlights.activeResourceId ?? ringState.activeResource?.id;
  const activeAssignedNodeId = ringState.activeResource?.assignedNodeId;

  if (step?.highlights.activeNodeId) {
    activeNodeIds.add(step.highlights.activeNodeId);
  }

  if (activeAssignedNodeId) {
    activeNodeIds.add(activeAssignedNodeId);
  }

  const hasRegisteredActiveResource = ringState.activeResource
    ? ringState.resources.some((resource) => resource.id === ringState.activeResource?.id)
    : false;

  const renderedResources =
    ringState.activeResource && !hasRegisteredActiveResource
      ? [...ringState.resources, ringState.activeResource]
      : ringState.resources;

  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>Consistent Hashing: Hash Ring</h2>
      </div>

      <div className="formula-strip">
        <span className="formula-pill">ring size = {ringState.ringSize}</span>
        <span className="formula-note">
          リソースもノードも同じリングへ配置し、時計回りに最初のノードが担当します。
        </span>
      </div>

      <div className="ring-visual">
        <svg viewBox="0 0 480 480" className="ring-svg" aria-label="Hash ring">
          <circle cx="240" cy="240" r="162" className="ring-outline" />
          <circle cx="240" cy="240" r="118" className="ring-inner" />

          {renderedResources.map((resource) => {
            const point = polarToCartesian(
              resource.id === activeResourceId ? 140 : 134,
              resource.hash,
            );
            const isActive = resource.id === activeResourceId;
            const isAssigned = resource.assignedNodeId !== undefined;
            const isRegistered = ringState.resources.some(
              (entry) => entry.id === resource.id,
            );

            return (
              <g key={resource.id}>
                <line
                  x1="240"
                  y1="240"
                  x2={point.x}
                  y2={point.y}
                  className={
                    isActive ? "ring-resource-line is-active" : "ring-resource-line"
                  }
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 9 : 6}
                  className={[
                    "ring-resource-dot",
                    isActive ? "is-active" : "",
                    isAssigned ? "is-assigned" : "is-unassigned",
                    isRegistered ? "is-registered" : "is-preview",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
                {isActive ? (
                  <text x={point.x + 12} y={point.y} className="ring-resource-label">
                    {resource.id} @ {resource.hash}
                  </text>
                ) : null}
              </g>
            );
          })}

          {ringState.nodes.map((node) => {
            const point = polarToCartesian(162, node.hash);
            const isActive = activeNodeIds.has(node.id);
            const isAssigned = activeAssignedNodeId === node.id;

            return (
              <g key={node.id}>
                <line
                  x1="240"
                  y1="240"
                  x2={point.x}
                  y2={point.y}
                  className={isAssigned ? "ring-node-line is-assigned" : "ring-node-line"}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isAssigned ? 15 : 12}
                  fill={node.color}
                  className={isActive ? "ring-node-dot is-active" : "ring-node-dot"}
                />
                <text x={point.x + 14} y={point.y + 4} className="ring-node-label">
                  {node.id} ({node.hash})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="ring-node-list">
        {ringState.nodes.length === 0 ? (
          <div className="empty-slot">No nodes on the ring yet</div>
        ) : (
          ringState.nodes.map((node) => {
            const assignedResources = ringState.resources.filter(
              (resource) => resource.assignedNodeId === node.id,
            );

            return (
              <div
                key={node.id}
                className={
                  activeNodeIds.has(node.id)
                    ? "ring-node-chip is-active"
                    : "ring-node-chip"
                }
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
                <div className="ring-resource-list">
                  {assignedResources.length === 0 ? (
                    <span className="ring-resource-chip is-empty">No resources</span>
                  ) : (
                    assignedResources.map((resource) => (
                      <span
                        key={resource.id}
                        className={
                          resource.id === activeResourceId
                            ? "ring-resource-chip is-active"
                            : "ring-resource-chip"
                        }
                      >
                        {resource.id}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {ringState.resources.some((resource) => resource.assignedNodeId === undefined) ? (
        <div className="ring-unassigned">
          <p className="detail-label">Unassigned resources</p>
          <div className="ring-resource-list">
            {ringState.resources
              .filter((resource) => resource.assignedNodeId === undefined)
              .map((resource) => (
                <span key={resource.id} className="ring-resource-chip is-unassigned">
                  {resource.id}
                </span>
              ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
