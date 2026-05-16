import {
  PaxosCodeExampleSet,
  PaxosLanguage,
  PaxosOperation,
  PaxosStep,
} from "../types";

interface PaxosCodePanelProps {
  step?: PaxosStep;
  fallbackOperation: PaxosOperation;
  selectedLanguage: PaxosLanguage;
  onLanguageChange: (language: PaxosLanguage) => void;
  codeExamples: PaxosCodeExampleSet;
}

export function PaxosCodePanel({
  step,
  fallbackOperation,
  selectedLanguage,
  onLanguageChange,
  codeExamples,
}: PaxosCodePanelProps) {
  const operation = step?.operation ?? fallbackOperation;
  const snippet = codeExamples.snippets[operation][selectedLanguage];
  const fullImplementation = codeExamples.fullImplementations[selectedLanguage];
  const stepNote = step
    ? codeExamples.modeNotes[step.highlights.mode] ??
      "quorum に届いているか、acceptor の promised/accepted がどう変わるかを確認します。"
    : "まずは prepare、promise、accept request、accepted、chosen の対応を読みます。";

  return (
    <section className="panel panel-code">
      <div className="panel-header">
        <p className="eyebrow">Code Examples</p>
        <h2>Paxos Code</h2>
        <p className="panel-copy">
          可視化中の phase と、proposer / acceptor が実装で見る条件を対応づけます。
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
        <summary>Protocol summary</summary>
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
