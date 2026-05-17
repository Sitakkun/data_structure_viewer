import {
  BufferPoolCodeExampleSet,
  BufferPoolLanguage,
  BufferPoolOperation,
  BufferPoolStep,
} from "../types";

interface BufferPoolCodePanelProps {
  step?: BufferPoolStep;
  fallbackOperation: BufferPoolOperation;
  selectedLanguage: BufferPoolLanguage;
  onLanguageChange: (language: BufferPoolLanguage) => void;
  codeExamples: BufferPoolCodeExampleSet;
}

export function BufferPoolCodePanel({
  step,
  fallbackOperation,
  selectedLanguage,
  onLanguageChange,
  codeExamples,
}: BufferPoolCodePanelProps) {
  const operation = step?.operation ?? fallbackOperation;
  const snippet = codeExamples.snippets[operation][selectedLanguage];
  const fullImplementation = codeExamples.fullImplementations[selectedLanguage];
  const stepNote = step
    ? codeExamples.modeNotes[step.highlights.mode] ??
      "frame の状態、dirty flag、reference bit、pin count の変化を確認します。"
    : "まずは read miss、hit、eviction、dirty writeback の対応を読みます。";

  return (
    <section className="panel panel-code">
      <div className="panel-header">
        <p className="eyebrow">Code Examples</p>
        <h2>Buffer Pool Code</h2>
        <p className="panel-copy">
          LRU と CLOCK の victim 選択、dirty page の writeback、pin count を可視化と対応づけます。
        </p>
      </div>

      <div className="language-toggle" role="tablist" aria-label="Code language">
        {(["pseudo", "python"] as const).map((language) => (
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
            {language === "pseudo" ? "Pseudo" : "Python-ish"}
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
        <summary>Replacement summary</summary>
        <div className="code-card code-card-full">
          <strong>{fullImplementation.title}</strong>
          <pre className="code-block">
            <code>{fullImplementation.code}</code>
          </pre>
        </div>
      </details>
    </section>
  );
}
