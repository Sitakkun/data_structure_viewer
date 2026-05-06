import {
  BPlusTreeCodeExampleSet,
  BPlusTreeLanguage,
  BPlusTreeOperation,
  BPlusTreeStep,
} from "../types";

interface BPlusTreeCodePanelProps {
  step?: BPlusTreeStep;
  fallbackOperation: BPlusTreeOperation;
  selectedLanguage: BPlusTreeLanguage;
  onLanguageChange: (language: BPlusTreeLanguage) => void;
  codeExamples: BPlusTreeCodeExampleSet;
}

export function BPlusTreeCodePanel({
  step,
  fallbackOperation,
  selectedLanguage,
  onLanguageChange,
  codeExamples,
}: BPlusTreeCodePanelProps) {
  const operation = step?.operation ?? fallbackOperation;
  const snippet = codeExamples.snippets[operation][selectedLanguage];
  const fullImplementation = codeExamples.fullImplementations[selectedLanguage];
  const stepNote = step
    ? codeExamples.modeNotes[step.highlights.mode] ??
      "内部ノードの案内と葉ノードの実データを分けて見るのが B+ Tree の要点です。"
    : "短いスニペットで流れを掴み、必要なら完全実装で `split_child` の葉分割と内部分割の差を確認します。";

  return (
    <section className="panel panel-code">
      <div className="panel-header">
        <p className="eyebrow">Code Examples</p>
        <h2>B+ tree Code</h2>
        <p className="panel-copy">
          探索、葉への挿入、範囲走査、葉分割と内部分割の違いを可視化のすぐ下で読めます。
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
            葉ノード連結と、葉分割でセパレータを親へ複製する流れを最小構成で確認できます。
          </span>
          <pre className="code-block">
            <code>{fullImplementation.code}</code>
          </pre>
        </div>
      </details>
    </section>
  );
}
