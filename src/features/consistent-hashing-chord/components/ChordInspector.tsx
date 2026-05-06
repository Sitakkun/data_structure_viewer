import { ChordState, ChordStep } from "../types";

interface ChordInspectorProps {
  step?: ChordStep;
  chordState: ChordState;
  scenarioTitle: string;
  scenarioDescription: string;
  focusedNodeId?: string;
}

export function ChordInspector({
  step,
  chordState,
  scenarioTitle,
  scenarioDescription,
  focusedNodeId,
}: ChordInspectorProps) {
  const focusedNode =
    chordState.nodes.find((node) => node.id === focusedNodeId) ?? chordState.nodes[0];

  return (
    <aside className="panel panel-inspector">
      <div className="panel-header">
        <p className="eyebrow">Step Log</p>
        <h2>{step?.title ?? scenarioTitle}</h2>
        <p className="panel-copy">{step?.explanation ?? scenarioDescription}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Node count</span>
          <strong>{step?.metrics.nodeCount ?? chordState.nodes.length}</strong>
        </div>
        <div className="stat-card">
          <span>Resource count</span>
          <strong>{step?.metrics.resourceCount ?? chordState.resources.length}</strong>
        </div>
        <div className="stat-card">
          <span>Target hash</span>
          <strong>{step?.highlights.activeResourceHash ?? "-"}</strong>
        </div>
        <div className="stat-card">
          <span>Hop count</span>
          <strong>{step?.metrics.hopCount ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Owner node</span>
          <strong>{chordState.activeResource?.ownerNodeId ?? "-"}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Lookup path</p>
        <strong>{step?.metrics.lookupPath ?? "-"}</strong>
        <span>
          finger table を使うと、後継ノードを 1 台ずつたどる代わりに大きくジャンプできます。
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">Focused node</p>
        <strong>{focusedNode ? `${focusedNode.id} (${focusedNode.hash})` : "-"}</strong>
        <span>
          {step?.highlights.activeFingerIndex
            ? `現在は finger[${step.highlights.activeFingerIndex}] を参照しています。`
            : "下の finger table で、このノードがどの区間へ飛べるかを確認できます。"}
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">Finger table</p>
        {focusedNode ? (
          <div className="finger-table">
            <div className="finger-table-row is-header">
              <span>i</span>
              <span>start</span>
              <span>interval</span>
              <span>successor</span>
            </div>
            {focusedNode.fingerTable.map((entry) => (
              <div
                key={`${focusedNode.id}-${entry.index}`}
                className={
                  entry.index === step?.highlights.activeFingerIndex
                    ? "finger-table-row is-active"
                    : "finger-table-row"
                }
              >
                <span>{entry.index}</span>
                <span>{entry.start}</span>
                <span>
                  [{entry.start}, {entry.intervalEnd})
                </span>
                <span>
                  {entry.successorNodeId} ({entry.successorHash})
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="panel-copy">表示できるノードがありません。</span>
        )}
      </div>

      <div className="concept-card">
        <p className="detail-label">Chord note</p>
        <span>
          Chord は各ノードが `O(log N)` 個の finger entry を持ち、lookup でも毎回その中から最も遠く進める候補を選ぶことで、探索ホップ数を抑えます。
        </span>
      </div>
    </aside>
  );
}
