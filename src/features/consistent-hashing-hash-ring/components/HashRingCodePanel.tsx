import {
  HashRingLanguage,
  HashRingOperation,
  RingCodeExampleSet,
  RingStep,
} from "../types";

interface HashRingCodePanelProps {
  step?: RingStep;
  fallbackOperation: HashRingOperation;
  selectedLanguage: HashRingLanguage;
  onLanguageChange: (language: HashRingLanguage) => void;
  codeExamples: RingCodeExampleSet;
}

export function HashRingCodePanel({
  step,
  fallbackOperation,
  selectedLanguage,
  onLanguageChange,
  codeExamples,
}: HashRingCodePanelProps) {
  const operation = step?.operation ?? fallbackOperation;
  const snippet = codeExamples.snippets[operation][selectedLanguage];
  const fullImplementation = codeExamples.fullImplementations[selectedLanguage];
  const stepNote = step
    ? codeExamples.modeNotes[step.highlights.mode] ??
      "リングを時計回りに見て、条件を満たす最初のノードを選ぶ処理に注目します。"
    : "短いスニペットで動きを掴み、必要なら完全実装を開いて全体像を確認します。";

  return (
    <section className="panel panel-code">
      <div className="panel-header">
        <p className="eyebrow">Code Examples</p>
        <h2>Hash Ring Code</h2>
        <p className="panel-copy">
          リソース探索、登録、ノード追加と削除を可視化のすぐ下で対応づけて読めます。
        </p>
      </div>

      <div className="language-toggle" role="tablist" aria-label="Code language">
        {(["python", "c"] as const).map((language) => (
          <button
            key={language}
            type="button"
            className={
              language === selectedLanguage
                ? "language-button is-selected"
                : "language-button"
            }
            onClick={() => onLanguageChange(language)}
          >
            {language === "python" ? "Python" : "C"}
          </button>
        ))}
      </div>

      <div className="code-card">
        <p className="detail-label">Snippet</p>
        <strong>{snippet.title}</strong>
        <span>{stepNote}</span>
        <pre className="code-block">
          <code>{snippet.code}</code>
        </pre>
      </div>

      <details className="code-details">
        <summary>Complete implementation</summary>
        <div className="code-card code-card-full">
          <strong>{fullImplementation.title}</strong>
          <span>
            スニペットで見た処理が、最小構成のハッシュリング全体ではどう置かれるかを確認できます。
          </span>
          <pre className="code-block">
            <code>{fullImplementation.code}</code>
          </pre>
        </div>
      </details>
    </section>
  );
}
