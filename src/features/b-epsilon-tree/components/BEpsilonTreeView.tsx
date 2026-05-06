import { BEpsilonMessage, BEpsilonNode, BEpsilonState, BEpsilonStep } from "../types";

interface BEpsilonTreeViewProps {
  bepsilonState: BEpsilonState;
  step?: BEpsilonStep;
}

function MessageChip({
  message,
  activeMessageId,
}: {
  message: BEpsilonMessage;
  activeMessageId?: string;
}) {
  return (
    <span
      className={[
        "bepsilon-message-chip",
        message.type === "delete" ? "is-delete" : "is-insert",
        message.id === activeMessageId ? "is-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      title={`seq ${message.sequence}`}
    >
      {message.type === "delete" ? "del" : "ins"} {message.key}
    </span>
  );
}

function BEpsilonNodeView({
  node,
  activeNodeId,
  targetChildId,
  activeMessageId,
}: {
  node: BEpsilonNode;
  activeNodeId?: string;
  targetChildId?: string;
  activeMessageId?: string;
}) {
  const isActive = node.id === activeNodeId;
  const isTarget = node.id === targetChildId;

  return (
    <div className="btree-node-wrapper">
      <div
        className={[
          "bepsilon-node",
          isActive ? "is-active" : "",
          isTarget ? "is-target" : "",
          node.isLeaf ? "is-leaf" : "is-internal",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="bepsilon-node-head">
          <span>{node.isLeaf ? "Leaf" : "Internal"}</span>
          <strong>{node.id}</strong>
        </div>

        {!node.isLeaf ? (
          <div className="bepsilon-separator-row">
            <span className="detail-label">separators</span>
            <div className="bepsilon-chip-row">
              {node.keys.map((key) => (
                <span key={`${node.id}-sep-${key}`} className="btree-key-chip">
                  {key}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="bepsilon-record-row">
            <span className="detail-label">records</span>
            <div className="bepsilon-chip-row">
              {node.records.map((record) => (
                <span
                  key={`${node.id}-record-${record}`}
                  className="btree-key-chip bplus-leaf-key"
                >
                  {record}
                </span>
              ))}
              {node.records.length === 0 ? (
                <span className="btree-key-chip is-empty">empty</span>
              ) : null}
            </div>
          </div>
        )}

        <div className="bepsilon-buffer-row">
          <span className="detail-label">buffer</span>
          <div className="bepsilon-chip-row">
            {node.buffer.map((message) => (
              <MessageChip
                key={message.id}
                message={message}
                activeMessageId={activeMessageId}
              />
            ))}
            {node.buffer.length === 0 ? (
              <span className="bepsilon-message-chip is-empty">empty</span>
            ) : null}
          </div>
        </div>
      </div>

      {node.children.length > 0 ? (
        <div className="btree-children">
          {node.children.map((child) => (
            <BEpsilonNodeView
              key={child.id}
              node={child}
              activeNodeId={activeNodeId}
              targetChildId={targetChildId}
              activeMessageId={activeMessageId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BEpsilonTreeView({
  bepsilonState,
  step,
}: BEpsilonTreeViewProps) {
  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>Bε-style Buffered Tree</h2>
      </div>

      <div className="formula-strip">
        <span className="formula-pill">ε = {bepsilonState.epsilon}</span>
        <span className="formula-pill">fanout = {bepsilonState.fanout}</span>
        <span className="formula-pill">
          buffer capacity = {bepsilonState.bufferCapacity}
        </span>
        <span className="formula-pill">
          leaf record capacity = {bepsilonState.maxRecordsPerLeaf}
        </span>
        <span className="formula-note">
          この MVP は leaf/internal split まで対応し、merge はまだ省略しています。
        </span>
      </div>

      <div className="btree-visual bepsilon-visual">
        <BEpsilonNodeView
          node={bepsilonState.root}
          activeNodeId={step?.highlights.activeNodeId}
          targetChildId={step?.highlights.targetChildId}
          activeMessageId={step?.highlights.activeMessageId}
        />
      </div>
    </section>
  );
}
