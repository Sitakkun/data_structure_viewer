import { LSMRecord, LSMState, LSMStep, SSTable } from "../types";

interface LSMViewProps {
  lsmState: LSMState;
  step?: LSMStep;
}

function RecordChip({
  record,
  activeKey,
  activeSequence,
}: {
  record: LSMRecord;
  activeKey?: number;
  activeSequence?: number;
}) {
  return (
    <span
      className={[
        "lsm-record-chip",
        record.tombstone ? "is-tombstone" : "",
        record.key === activeKey || record.sequence === activeSequence ? "is-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {record.tombstone ? "del" : record.value} : {record.key}
      <small>seq {record.sequence}</small>
    </span>
  );
}

function SSTableCard({
  table,
  activeSSTableId,
  activeKey,
  activeSequence,
}: {
  table: SSTable;
  activeSSTableId?: string;
  activeKey?: number;
  activeSequence?: number;
}) {
  return (
    <article
      className={[
        "lsm-layer-card",
        "lsm-sstable-card",
        table.id === activeSSTableId ? "is-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="lsm-layer-header">
        <strong>{table.id}</strong>
        <span>level {table.level}</span>
      </div>
      <div className="lsm-record-row">
        {table.records.map((record) => (
          <RecordChip
            key={`${table.id}-${record.key}-${record.sequence}`}
            record={record}
            activeKey={activeKey}
            activeSequence={activeSequence}
          />
        ))}
      </div>
    </article>
  );
}

export function LSMView({ lsmState, step }: LSMViewProps) {
  const activeLayer = step?.highlights.activeLayer;
  const activeKey = step?.highlights.activeKey;
  const activeSequence = step?.highlights.activeSequence;

  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>LSM-tree write path</h2>
      </div>

      <div className="formula-strip">
        <span className="formula-pill">
          memtable capacity = {lsmState.memtableCapacity}
        </span>
        <span className="formula-pill">
          SSTables = {lsmState.sstables.length}
        </span>
        <span className="formula-note">
          WAL と memtable に受け、flush で immutable SSTable を作り、compaction で古い record を整理します。
        </span>
      </div>

      <div className="lsm-flow">
        <article
          className={[
            "lsm-layer-card",
            activeLayer === "wal" ? "is-active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="lsm-layer-header">
            <strong>WAL</strong>
            <span>{lsmState.wal.length} entries</span>
          </div>
          <div className="lsm-record-row">
            {lsmState.wal.length ? (
              lsmState.wal.map((record) => (
                <RecordChip
                  key={`wal-${record.key}-${record.sequence}`}
                  record={record}
                  activeKey={activeKey}
                  activeSequence={activeSequence}
                />
              ))
            ) : (
              <span className="lsm-empty-chip">empty</span>
            )}
          </div>
        </article>

        <span className="lsm-flow-arrow">↓</span>

        <article
          className={[
            "lsm-layer-card",
            activeLayer === "memtable" ? "is-active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="lsm-layer-header">
            <strong>Memtable</strong>
            <span>{lsmState.memtable.length} / {lsmState.memtableCapacity}</span>
          </div>
          <div className="lsm-record-row">
            {lsmState.memtable.length ? (
              lsmState.memtable.map((record) => (
                <RecordChip
                  key={`mem-${record.key}-${record.sequence}`}
                  record={record}
                  activeKey={activeKey}
                  activeSequence={activeSequence}
                />
              ))
            ) : (
              <span className="lsm-empty-chip">empty</span>
            )}
          </div>
        </article>

        {lsmState.immutableMemtable ? (
          <>
            <span className="lsm-flow-arrow">↓</span>
            <article
              className={[
                "lsm-layer-card",
                activeLayer === "immutable" ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="lsm-layer-header">
                <strong>Immutable memtable</strong>
                <span>flush target</span>
              </div>
              <div className="lsm-record-row">
                {lsmState.immutableMemtable.map((record) => (
                  <RecordChip
                    key={`imm-${record.key}-${record.sequence}`}
                    record={record}
                    activeKey={activeKey}
                    activeSequence={activeSequence}
                  />
                ))}
              </div>
            </article>
          </>
        ) : null}

        <span className="lsm-flow-arrow">↓</span>

        <div className="lsm-sstable-stack">
          {lsmState.sstables.length ? (
            lsmState.sstables.map((table) => (
              <SSTableCard
                key={table.id}
                table={table}
                activeSSTableId={step?.highlights.activeSSTableId}
                activeKey={activeKey}
                activeSequence={activeSequence}
              />
            ))
          ) : (
            <article className="lsm-layer-card">
              <div className="lsm-layer-header">
                <strong>SSTables</strong>
                <span>none</span>
              </div>
              <span className="lsm-empty-chip">No flushed files yet</span>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
