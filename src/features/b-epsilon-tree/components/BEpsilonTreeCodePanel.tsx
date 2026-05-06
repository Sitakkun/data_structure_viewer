import {
  BEpsilonCodeExampleSet,
  BEpsilonLanguage,
  BEpsilonOperation,
  BEpsilonStep,
} from "../types";

interface BEpsilonTreeCodePanelProps {
  step?: BEpsilonStep;
  fallbackOperation: BEpsilonOperation;
  selectedLanguage: BEpsilonLanguage;
  onLanguageChange: (language: BEpsilonLanguage) => void;
  codeExamples: BEpsilonCodeExampleSet;
}

export function BEpsilonTreeCodePanel({
  step,
  fallbackOperation,
  selectedLanguage,
  onLanguageChange,
  codeExamples,
}: BEpsilonTreeCodePanelProps) {
  const operation = step?.operation ?? fallbackOperation;
  const snippet = codeExamples.snippets[operation][selectedLanguage];
  const fullImplementation = codeExamples.fullImplementations[selectedLanguage];
  const stepNote = step
    ? codeExamples.modeNotes[step.highlights.mode] ??
      "buffer と leaf record のどちらを読んでいるかに注目してください。"
    : "Bε tree の最初の理解では、insert/delete が record 変更ではなく message 追加になる点を押さえます。";

  return (
    <section className="panel panel-code">
      <div className="panel-header">
        <p className="eyebrow">Code Examples</p>
        <h2>Bε tree Code</h2>
        <p className="panel-copy">
          buffer に message を貯める処理、flush で下へ流す処理、検索時に buffer を確認する処理を対応づけます。
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
            merge は省略し、buffered update と overflow split の読み方に絞った教材コードです。
          </span>
          <pre className="code-block">
            <code>{fullImplementation.code}</code>
          </pre>
        </div>
      </details>
    </section>
  );
}
