import { BTreeNode, BTreeState, BTreeStep } from "../types";

interface BTreeViewProps {
  btreeState: BTreeState;
  step?: BTreeStep;
}

function BTreeNodeView({
  node,
  activeNodeId,
  activeKeyIndex,
  promotedKey,
  collectedKeys,
}: {
  node: BTreeNode;
  activeNodeId?: string;
  activeKeyIndex?: number;
  promotedKey?: number;
  collectedKeys: number[];
}) {
  const isActive = node.id === activeNodeId;

  return (
    <div className="btree-node-wrapper">
      <div className={isActive ? "btree-node is-active" : "btree-node"}>
        {node.keys.map((key, index) => (
          <span
            key={`${node.id}-${key}-${index}`}
            className={[
              "btree-key-chip",
              isActive && activeKeyIndex === index ? "is-active" : "",
              promotedKey === key ? "is-promoted" : "",
              collectedKeys.includes(key) ? "is-collected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {key}
          </span>
        ))}
        {node.keys.length === 0 ? <span className="btree-key-chip is-empty">empty</span> : null}
      </div>

      {node.children.length > 0 ? (
        <div className="btree-children">
          {node.children.map((child) => (
            <BTreeNodeView
              key={child.id}
              node={child}
              activeNodeId={activeNodeId}
              activeKeyIndex={activeKeyIndex}
              promotedKey={promotedKey}
              collectedKeys={collectedKeys}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BTreeView({ btreeState, step }: BTreeViewProps) {
  const collectedKeys = btreeState.collectedKeys ?? [];

  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>Normal B-tree</h2>
      </div>

      <div className="formula-strip">
        <span className="formula-pill">min degree = {btreeState.minDegree}</span>
        <span className="formula-pill">
          max keys / node = {btreeState.maxKeysPerNode}
        </span>
        <span className="formula-note">
          根から葉へ降りながら、満杯ノードは事前に分割してバランスを保ちます。
        </span>
      </div>

      <div className="btree-visual">
        {btreeState.root ? (
          <BTreeNodeView
            node={btreeState.root}
            activeNodeId={step?.highlights.activeNodeId}
            activeKeyIndex={step?.highlights.activeKeyIndex}
            promotedKey={step?.highlights.promotedKey}
            collectedKeys={collectedKeys}
          />
        ) : (
          <div className="empty-slot">Tree is empty</div>
        )}
      </div>
    </section>
  );
}
