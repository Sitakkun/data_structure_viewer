import { BloomState, BloomStep } from "../types";

interface BloomFilterViewProps {
  bloomState: BloomState;
  step?: BloomStep;
}

export function BloomFilterView({ bloomState, step }: BloomFilterViewProps) {
  const activeBitIndexes = new Set(step?.highlights.activeBitIndexes ?? []);

  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>Bloom Filter</h2>
      </div>

      <div className="formula-strip">
        <span className="formula-pill">m = {bloomState.bitCount}</span>
        <span className="formula-pill">k = {bloomState.hashCount}</span>
        <span className="formula-note">
          1 つの要素に対して複数ハッシュ位置を使い、ビット配列だけで集合を近似します。
        </span>
      </div>

      <div className="bloom-hash-list">
        {bloomState.activeHashes.length === 0 ? (
          <div className="empty-slot">Run insert or query to see hash outputs</div>
        ) : (
          bloomState.activeHashes.map((hash, index) => (
            <div
              key={`${hash.label}-${hash.index}`}
              className={
                step?.highlights.activeHashIndex === index
                  ? "bloom-hash-card is-active"
                  : "bloom-hash-card"
              }
            >
              <span>{hash.label}</span>
              <strong>{hash.index}</strong>
            </div>
          ))
        )}
      </div>

      <div className="bloom-bit-grid">
        {bloomState.bits.map((bit, index) => (
          <div
            key={index}
            className={[
              "bloom-bit-card",
              bit ? "is-set" : "is-unset",
              activeBitIndexes.has(index) ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span>{index}</span>
            <strong>{bit ? "1" : "0"}</strong>
          </div>
        ))}
      </div>

      <div className="bloom-item-list">
        {bloomState.items.length === 0 ? (
          <div className="empty-slot">No inserted items yet</div>
        ) : (
          bloomState.items.map((item) => (
            <span
              key={item}
              className={
                item === bloomState.activeItem
                  ? "bloom-item-chip is-active"
                  : "bloom-item-chip"
              }
            >
              {item}
            </span>
          ))
        )}
      </div>
    </section>
  );
}
