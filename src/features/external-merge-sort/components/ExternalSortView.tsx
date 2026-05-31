import {
  ExternalSortState,
  ExternalSortStep,
  MergePass,
  SortRun,
} from "../types";

interface ExternalSortViewProps {
  sortState: ExternalSortState;
  step?: ExternalSortStep;
}

function formatPages(count: number) {
  return `${count}p`;
}

function RunChip({
  run,
  sortState,
}: {
  run: SortRun;
  sortState: ExternalSortState;
}) {
  const isActive =
    sortState.activeRunIds.includes(run.id) ||
    sortState.activeInputRunIds.includes(run.id) ||
    sortState.activeOutputRunIds.includes(run.id);
  const isOutput = sortState.activeOutputRunIds.includes(run.id);

  return (
    <span
      className={[
        "external-sort-run-chip",
        isActive ? "is-active" : "",
        isOutput ? "is-output" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <strong>{run.label}</strong>
      <small>{formatPages(run.size)}</small>
    </span>
  );
}

function MergePassCard({
  pass,
  sortState,
}: {
  pass: MergePass;
  sortState: ExternalSortState;
}) {
  const isActive =
    pass.id === sortState.completedPassIds[sortState.completedPassIds.length - 1];
  const isCompleted = sortState.completedPassIds.includes(pass.id);

  return (
    <article
      className={[
        "external-sort-pass-card",
        isActive ? "is-active" : "",
        isCompleted ? "is-completed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="external-sort-pass-header">
        <strong>Pass {pass.passNumber}</strong>
        <span>
          {pass.inputRunCount} runs → {pass.outputRunCount}
        </span>
      </div>
      <div className="external-sort-merge-groups">
        {pass.groups.map((group) => (
          <div key={group.id} className="external-sort-merge-group">
            <div className="external-sort-merge-inputs">
              {group.inputRuns.map((run) => (
                <RunChip key={run.id} run={run} sortState={sortState} />
              ))}
            </div>
            <span className="external-sort-arrow">→</span>
            <RunChip run={group.outputRun} sortState={sortState} />
          </div>
        ))}
      </div>
    </article>
  );
}

export function ExternalSortView({ sortState, step }: ExternalSortViewProps) {
  const { plan } = sortState;
  const previewPages = Array.from(
    { length: Math.min(plan.config.recordCount, 24) },
    (_, index) => index + 1,
  );
  const hiddenPages = plan.config.recordCount - previewPages.length;

  return (
    <section className="panel panel-visualizer">
      <div className="panel-header">
        <p className="eyebrow">Visualization</p>
        <h2>External Merge Sort</h2>
        <p className="panel-copy">
          memory より大きい relation を sorted runs に分け、限られた buffer で k-way merge します。
        </p>
      </div>

      <div className="formula-strip">
        <span className="formula-pill">Records = {plan.config.recordCount} pages</span>
        <span className="formula-pill">Run size = {plan.config.runSize}</span>
        <span className="formula-pill">Buffers = {plan.config.bufferCount}</span>
        <span className="formula-pill">Merge fan-in = {plan.mergeFanIn}</span>
        <span className="formula-note">
          1 pass は全 page の read + write として数えます。
        </span>
      </div>

      <div className="external-sort-input-strip" aria-label="Input relation pages">
        {previewPages.map((pageId) => (
          <span key={pageId} className="external-sort-page-chip">
            P{pageId}
          </span>
        ))}
        {hiddenPages > 0 ? (
          <span className="external-sort-page-chip is-more">+{hiddenPages}</span>
        ) : null}
      </div>

      <section className="external-sort-section">
        <div className="section-heading">
          <p className="eyebrow">Initial sorted runs</p>
          <span>{plan.initialRuns.length} runs</span>
        </div>
        <div className="external-sort-run-row">
          {plan.initialRuns.map((run) => (
            <RunChip key={run.id} run={run} sortState={sortState} />
          ))}
        </div>
      </section>

      <section className="external-sort-section">
        <div className="section-heading">
          <p className="eyebrow">Merge passes</p>
          <span>{plan.mergePasses.length} passes</span>
        </div>
        {plan.mergePasses.length ? (
          <div className="external-sort-pass-grid">
            {plan.mergePasses.map((pass) => (
              <MergePassCard key={pass.id} pass={pass} sortState={sortState} />
            ))}
          </div>
        ) : (
          <div className="external-sort-complete-note">
            1 本の run に収まるため、追加 merge pass は不要です。
          </div>
        )}
      </section>

      <section className="external-sort-section">
        <div className="section-heading">
          <p className="eyebrow">Current output runs</p>
          <span>{step?.title ?? "Ready"}</span>
        </div>
        <div className="external-sort-run-row">
          {sortState.visibleRuns.map((run) => (
            <RunChip key={run.id} run={run} sortState={sortState} />
          ))}
        </div>
      </section>
    </section>
  );
}
