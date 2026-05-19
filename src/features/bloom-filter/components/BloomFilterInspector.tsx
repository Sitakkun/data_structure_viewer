import { ScenarioWatchPoints } from "../../../components/ScenarioWatchPoints";
import { BloomState, BloomStep } from "../types";

interface BloomFilterInspectorProps {
  step?: BloomStep;
  bloomState: BloomState;
  scenarioTitle: string;
  scenarioDescription: string;
  watchPoints?: string[];
}

export function BloomFilterInspector({
  step,
  bloomState,
  scenarioTitle,
  scenarioDescription,
  watchPoints,
}: BloomFilterInspectorProps) {
  return (
    <aside className="panel panel-inspector">
      <div className="panel-header">
        <p className="eyebrow">Step Log</p>
        <h2>{step?.title ?? scenarioTitle}</h2>
        <p className="panel-copy">{step?.explanation ?? scenarioDescription}</p>
      </div>

      <ScenarioWatchPoints watchPoints={watchPoints} isVisible={!step} />

      <div className="stats-grid">
        <div className="stat-card">
          <span>Item count</span>
          <strong>{step?.metrics.itemCount ?? bloomState.items.length}</strong>
        </div>
        <div className="stat-card">
          <span>Set bits</span>
          <strong>{step?.metrics.setBitCount ?? bloomState.bits.filter(Boolean).length}</strong>
        </div>
        <div className="stat-card">
          <span>Load factor</span>
          <strong>{(step?.metrics.loadFactor ?? 0).toFixed(2)}</strong>
        </div>
        <div className="stat-card">
          <span>Hash count</span>
          <strong>{bloomState.hashCount}</strong>
        </div>
      </div>

      <div className="detail-card">
        <p className="detail-label">Current item</p>
        <strong>{bloomState.activeItem ?? "-"}</strong>
        <span>
          {bloomState.activeHashes.length > 0
            ? bloomState.activeHashes
                .map((hash) => `${hash.label}=${hash.index}`)
                .join(", ")
            : "まだハッシュ計算は実行していません。"}
        </span>
      </div>

      <div className="detail-card">
        <p className="detail-label">What this means</p>
        <strong>{step?.highlights.mode ?? "idle"}</strong>
        <span>
          {step
            ? step.metrics.falsePositiveHint
            : "Insert でビットを立て、Query で存在しないことを否定できるかを確かめます。"}
        </span>
      </div>

      <div className="concept-card">
        <p className="detail-label">Bloom filter note</p>
        <span>
          Bloom Filter は、空間効率の代わりに false positive を許容する集合近似です。
          「ない」は正確に言えますが、「ある」は確率的です。
        </span>
      </div>
    </aside>
  );
}
