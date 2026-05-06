import { engineLabel } from "../simulation";
import {
  WriteAmplificationCodeExampleSet,
  WriteAmplificationLanguage,
  WriteEngine,
} from "../types";

interface WriteAmplificationCodePanelProps {
  selectedEngine: WriteEngine;
  onEngineChange: (engine: WriteEngine) => void;
  selectedLanguage: WriteAmplificationLanguage;
  onLanguageChange: (language: WriteAmplificationLanguage) => void;
  codeExamples: WriteAmplificationCodeExampleSet;
}

const engines: WriteEngine[] = ["btree", "bepsilon", "lsm"];

export function WriteAmplificationCodePanel({
  selectedEngine,
  onEngineChange,
  selectedLanguage,
  onLanguageChange,
  codeExamples,
}: WriteAmplificationCodePanelProps) {
  const snippet = codeExamples.snippets[selectedEngine][selectedLanguage];

  return (
    <section className="panel panel-code">
      <div className="panel-header">
        <p className="eyebrow">Code Examples</p>
        <h2>Write Path Pseudocode</h2>
        <p className="panel-copy">
          数値モデルがどの write path を数えているかを、簡略コードで確認します。
        </p>
      </div>

      <div className="language-toggle wa-engine-toggle" role="tablist">
        {engines.map((engine) => (
          <button
            key={engine}
            type="button"
            className={
              engine === selectedEngine
                ? "language-button is-selected"
                : "language-button"
            }
            onClick={() => onEngineChange(engine)}
          >
            {engineLabel(engine)}
          </button>
        ))}
      </div>

      <div className="language-toggle" role="tablist" aria-label="Code style">
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
        <span>{codeExamples.notes[selectedEngine]}</span>
        <pre className="code-block">
          <code>{snippet.code}</code>
        </pre>
      </div>
    </section>
  );
}
