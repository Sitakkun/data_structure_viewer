import { collectLeaves } from "../simulation";
import { BPlusTreeNode, BPlusTreeState, BPlusTreeStep } from "../types";

interface BPlusTreeViewProps {
  bplusTreeState: BPlusTreeState;
  step?: BPlusTreeStep;
}

function BPlusTreeNodeView({
  node,
  activeNodeId,
  activeKeyIndex,
  promotedKey,
}: {
  node: BPlusTreeNode;
  activeNodeId?: string;
  activeKeyIndex?: number;
  promotedKey?: number;
}) {
  const isActive = node.id === activeNodeId;

  return (
    <div className="btree-node-wrapper">
      <div
        className={[
          "btree-node",
          "bplus-node",
          isActive ? "is-active" : "",
          node.isLeaf ? "is-leaf" : "is-internal",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="bplus-node-kind">{node.isLeaf ? "Leaf" : "Internal"}</span>
        {node.keys.map((key, index) => (
          <span
            key={`${node.id}-${key}-${index}`}
            className={[
              "btree-key-chip",
              isActive && activeKeyIndex === index ? "is-active" : "",
              promotedKey === key ? "is-promoted" : "",
              node.isLeaf ? "bplus-leaf-key" : "bplus-separator-key",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {key}
          </span>
        ))}
      </div>

      {node.children.length > 0 ? (
        <div className="btree-children">
          {node.children.map((child) => (
            <BPlusTreeNodeView
              key={child.id}
              node={child}
              activeNodeId={activeNodeId}
              activeKeyIndex={activeKeyIndex}
              promotedKey={promotedKey}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BPlusTreeView({ bplusTreeState, step }: BPlusTreeViewProps) {
  const leaves = collectLeaves(bplusTreeState.root);
  const collectedKeys = bplusTreeState.collectedKeys ?? [];

  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>Normal B+ Tree</h2>
      </div>

      <div className="formula-strip">
        <span className="formula-pill">min degree = {bplusTreeState.minDegree}</span>
        <span className="formula-pill">
          max keys / node = {bplusTreeState.maxKeysPerNode}
        </span>
        <span className="formula-note">
          内部ノードはセパレータ、実データは葉ノード、そして葉は順番に連結されます。
        </span>
      </div>

      <div className="btree-visual">
        {bplusTreeState.root ? (
          <BPlusTreeNodeView
            node={bplusTreeState.root}
            activeNodeId={step?.highlights.activeNodeId}
            activeKeyIndex={step?.highlights.activeKeyIndex}
            promotedKey={step?.highlights.promotedKey}
          />
        ) : (
          <div className="empty-slot">Tree is empty</div>
        )}
      </div>

      <div className="bplus-leaf-strip">
        <p className="detail-label">Leaf chain</p>
        <div className="bplus-leaf-row">
          {leaves.length === 0 ? (
            <div className="empty-slot">No leaves yet</div>
          ) : (
            leaves.map((leaf, index) => (
              <div key={leaf.id} className="bplus-leaf-chain-item">
                <div
                  className={[
                    "btree-node",
                    "bplus-node",
                    "is-leaf",
                    leaf.id === step?.highlights.activeNodeId ? "is-active" : "",
                    leaf.id === step?.highlights.nextLeafId ? "is-next" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {leaf.keys.map((key, keyIndex) => (
                    <span
                      key={`${leaf.id}-${key}`}
                      className={[
                        "btree-key-chip",
                        "bplus-leaf-key",
                        leaf.id === step?.highlights.activeNodeId &&
                        keyIndex === step.highlights.activeKeyIndex
                          ? "is-active"
                          : "",
                        collectedKeys.includes(key) ? "is-collected" : "",
                        step?.highlights.collectedKeyIndices?.includes(keyIndex) &&
                        leaf.id === step.highlights.activeNodeId
                          ? "is-current-collect"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {key}
                    </span>
                  ))}
                </div>
                {index < leaves.length - 1 ? <span className="chain-arrow">→</span> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
