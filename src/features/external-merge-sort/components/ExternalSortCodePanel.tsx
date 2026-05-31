import {
  ExternalSortCodeExampleSet,
  ExternalSortLanguage,
  ExternalSortStage,
  ExternalSortStep,
} from "../types";

interface ExternalSortCodePanelProps {
  step?: ExternalSortStep;
  selectedLanguage: ExternalSortLanguage;
  onLanguageChange: (language: ExternalSortLanguage) => void;
  codeExamples: ExternalSortCodeExampleSet;
}

export function ExternalSortCodePanel({
  step,
  selectedLanguage,
  onLanguageChange,
  codeExamples,
}: ExternalSortCodePanelProps) {
  const stage: ExternalSortStage = step?.stage ?? "input";
  const snippet = codeExamples.snippets[stage][selectedLanguage];
  const fullImplementation = codeExamples.fullImplementations[selectedLanguage];

  return (
    <section className="panel panel-code">
      <div className="panel-header">
        <p className="eyebrow">Code Examples</p>
        <h2>External Sort Code</h2>
        <p className="panel-copy">
          run generation、fan-in、k-way merge pass を可視化と対応づけます。
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
        <span>{codeExamples.stageNotes[stage]}</span>
        <pre className="code-block">
          <code>{snippet.code}</code>
        </pre>
      </div>

      <details className="code-details">
        <summary>Full outline</summary>
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
