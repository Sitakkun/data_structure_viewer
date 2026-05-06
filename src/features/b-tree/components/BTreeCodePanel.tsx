import {
  BTreeCodeExampleSet,
  BTreeLanguage,
  BTreeOperation,
  BTreeStep,
} from "../types";

interface BTreeCodePanelProps {
  step?: BTreeStep;
  fallbackOperation: BTreeOperation;
  selectedLanguage: BTreeLanguage;
  onLanguageChange: (language: BTreeLanguage) => void;
  codeExamples: BTreeCodeExampleSet;
}

export function BTreeCodePanel({
  step,
  fallbackOperation,
  selectedLanguage,
  onLanguageChange,
  codeExamples,
}: BTreeCodePanelProps) {
  const operation = step?.operation ?? fallbackOperation;
  const snippet = codeExamples.snippets[operation][selectedLanguage];
  const fullImplementation = codeExamples.fullImplementations[selectedLanguage];
  const stepNote = step
    ? codeExamples.modeNotes[step.highlights.mode] ??
      "比較、降下、分割のどこにいるかを可視化とコードで対応づけて見ます。"
    : "短いスニペットで流れを掴み、必要なら完全実装で `split_child` と `insert_non_full` の関係を確認します。";

  return (
    <section className="panel panel-code">
      <div className="panel-header">
        <p className="eyebrow">Code Examples</p>
        <h2>B-tree Code</h2>
        <p className="panel-copy">
          探索、葉への挿入、範囲走査、子ノード分割を可視化のすぐ下でコードと対応づけて読めます。
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
            通常の B ツリーにおける `split_child` と `insert_non_full` の役割分担を最小構成で確認できます。
          </span>
          <pre className="code-block">
            <code>{fullImplementation.code}</code>
          </pre>
        </div>
      </details>
    </section>
  );
}
