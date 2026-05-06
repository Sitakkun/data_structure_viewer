import {
  BloomCodeExampleSet,
  BloomLanguage,
  BloomOperation,
  BloomStep,
} from "../types";

interface BloomFilterCodePanelProps {
  step?: BloomStep;
  fallbackOperation: BloomOperation;
  selectedLanguage: BloomLanguage;
  onLanguageChange: (language: BloomLanguage) => void;
  codeExamples: BloomCodeExampleSet;
}

export function BloomFilterCodePanel({
  step,
  fallbackOperation,
  selectedLanguage,
  onLanguageChange,
  codeExamples,
}: BloomFilterCodePanelProps) {
  const operation = step?.operation ?? fallbackOperation;
  const snippet = codeExamples.snippets[operation][selectedLanguage];
  const fullImplementation = codeExamples.fullImplementations[selectedLanguage];
  const stepNote = step
    ? codeExamples.modeNotes[step.highlights.mode] ??
      "複数ハッシュ位置だけを更新・照会するところが Bloom Filter の本体です。"
    : "短いスニペットで動きを掴み、必要なら完全実装で全体像を確認します。";

  return (
    <section className="panel panel-code">
      <div className="panel-header">
        <p className="eyebrow">Code Examples</p>
        <h2>Bloom Filter Code</h2>
        <p className="panel-copy">
          複数ハッシュ位置の更新と照会を、可視化のすぐ下でコードと対応づけて読めます。
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
            ビット配列と複数ハッシュ関数だけで Bloom Filter が構成できることを確認できます。
          </span>
          <pre className="code-block">
            <code>{fullImplementation.code}</code>
          </pre>
        </div>
      </details>
    </section>
  );
}
