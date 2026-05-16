import {
  LSMCodeExampleSet,
  LSMLanguage,
  LSMOperation,
  LSMStep,
} from "../types";

interface LSMCodePanelProps {
  step?: LSMStep;
  fallbackOperation: LSMOperation;
  selectedLanguage: LSMLanguage;
  onLanguageChange: (language: LSMLanguage) => void;
  codeExamples: LSMCodeExampleSet;
}

export function LSMCodePanel({
  step,
  fallbackOperation,
  selectedLanguage,
  onLanguageChange,
  codeExamples,
}: LSMCodePanelProps) {
  const operation = step?.operation ?? fallbackOperation;
  const snippet = codeExamples.snippets[operation][selectedLanguage];
  const fullImplementation = codeExamples.fullImplementations[selectedLanguage];
  const stepNote = step
    ? codeExamples.modeNotes[step.highlights.mode] ??
      "memtable と SSTable のどちらを読んでいるかに注目します。"
    : "まずは WAL、memtable、SSTable、compaction の役割を分けて読みます。";

  return (
    <section className="panel panel-code">
      <div className="panel-header">
        <p className="eyebrow">Code Examples</p>
        <h2>LSM-tree Code</h2>
        <p className="panel-copy">
          write path、search path、flush、compaction を可視化と対応づけます。
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
        <summary>Lifecycle summary</summary>
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
