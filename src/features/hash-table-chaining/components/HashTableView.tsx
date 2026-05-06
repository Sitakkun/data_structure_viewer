import { Step, TableState } from "../types";

interface HashTableViewProps {
  tableState: TableState;
  step?: Step;
  title: string;
  subtitle: string;
}

function nodeClassName(step: Step | undefined, bucketIndex: number, nodeIndex: number) {
  if (
    step &&
    step.highlights.activeBucketIndex === bucketIndex &&
    step.highlights.activeNodeIndex === nodeIndex
  ) {
    switch (step.highlights.mode) {
      case "found":
        return "chain-node is-found";
      case "delete":
        return "chain-node is-delete";
      case "insert":
        return "chain-node is-insert";
      case "duplicate":
        return "chain-node is-duplicate";
      default:
        return "chain-node is-active";
    }
  }

  return "chain-node";
}

export function HashTableView({
  tableState,
  step,
  title,
  subtitle,
}: HashTableViewProps) {
  if (tableState.strategy === "linear-probing") {
    return (
      <section className="panel panel-visualizer">
        <div className="panel-header">
          <p className="eyebrow">Visualization</p>
          <h2>{title}</h2>
        </div>

        <div className="formula-strip">
          <span className="formula-pill">h(k) = abs(k) mod {tableState.bucketCount}</span>
          <span className="formula-note">{subtitle}</span>
        </div>

        <div className="slot-grid">
          {(tableState.slots ?? []).map((slot, slotIndex) => {
            const isActive = step?.highlights.activeBucketIndex === slotIndex;
            const className = [
              "slot-card",
              isActive ? "is-active" : "",
              slot === null ? "is-empty" : "",
              slot === "DELETED" ? "is-deleted" : "",
              step?.highlights.mode === "found" && isActive ? "is-found" : "",
              step?.highlights.mode === "insert" && isActive ? "is-insert" : "",
              step?.highlights.mode === "delete" && isActive ? "is-delete" : "",
              step?.highlights.mode === "duplicate" && isActive ? "is-duplicate" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div key={slotIndex} className={className}>
                <span className="slot-index">slot {slotIndex}</span>
                <strong>
                  {slot === null ? "empty" : slot === "DELETED" ? "tombstone" : slot}
                </strong>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>{title}</h2>
      </div>

      <div className="formula-strip">
        <span className="formula-pill">h(k) = abs(k) mod {tableState.bucketCount}</span>
        <span className="formula-note">{subtitle}</span>
      </div>

      <div className="bucket-list">
        {(tableState.buckets ?? []).map((bucket, bucketIndex) => {
          const isActive = step?.highlights.activeBucketIndex === bucketIndex;
          const bucketClassName = isActive ? "bucket-row is-active" : "bucket-row";

          return (
            <div key={bucketIndex} className={bucketClassName}>
              <div className="bucket-index">
                <span>bucket</span>
                <strong>{bucketIndex}</strong>
              </div>

              <div className="bucket-chain">
                {bucket.length === 0 ? (
                  <div className="empty-slot">empty</div>
                ) : (
                  bucket.map((value, nodeIndex) => (
                    <div key={`${bucketIndex}-${value}-${nodeIndex}`} className="chain-segment">
                      <div className={nodeClassName(step, bucketIndex, nodeIndex)}>{value}</div>
                      {nodeIndex < bucket.length - 1 ? (
                        <div className="chain-arrow" aria-hidden="true">
                          →
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
