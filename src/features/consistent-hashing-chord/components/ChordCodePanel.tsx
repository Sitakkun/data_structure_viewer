import {
  ChordCodeExampleSet,
  ChordLanguage,
  ChordOperation,
  ChordStep,
} from "../types";

interface ChordCodePanelProps {
  step?: ChordStep;
  fallbackOperation: ChordOperation;
  selectedLanguage: ChordLanguage;
  onLanguageChange: (language: ChordLanguage) => void;
  codeExamples: ChordCodeExampleSet;
}

export function ChordCodePanel({
  step,
  fallbackOperation,
  selectedLanguage,
  onLanguageChange,
  codeExamples,
}: ChordCodePanelProps) {
  const operation = step?.operation ?? fallbackOperation;
  const snippet = codeExamples.snippets[operation][selectedLanguage];
  const fullImplementation = codeExamples.fullImplementations[selectedLanguage];
  const stepNote = step
    ? codeExamples.modeNotes[step.highlights.mode] ??
      "現在ノードの finger table を見ながら、target hash に向かって最短のジャンプを選びます。"
    : "短いスニペットで Chord lookup の流れを掴み、必要なら完全実装で全体像を確認します。";

  return (
    <section className="panel panel-code">
      <div className="panel-header">
        <p className="eyebrow">Code Examples</p>
        <h2>Chord Code</h2>
        <p className="panel-copy">
          `find_successor` と finger table の参照箇所を、可視化のすぐ下で読み比べられます。
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
            フィンガーテーブルの参照と `closest_preceding_finger` の位置づけを、最小構成の実装で確認できます。
          </span>
          <pre className="code-block">
            <code>{fullImplementation.code}</code>
          </pre>
        </div>
      </details>
    </section>
  );
}
