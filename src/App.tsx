import { useEffect, useState } from "react";
import { BPlusTreePage } from "./features/b-plus-tree/BPlusTreePage";
import { BEpsilonTreePage } from "./features/b-epsilon-tree/BEpsilonTreePage";
import { BTreePage } from "./features/b-tree/BTreePage";
import { BloomFilterPage } from "./features/bloom-filter/BloomFilterPage";
import { ChordPage } from "./features/consistent-hashing-chord/ChordPage";
import { HashRingPage } from "./features/consistent-hashing-hash-ring/HashRingPage";
import { HashTableCollisionPage } from "./features/hash-table-chaining/HashTableCollisionPage";
import { LSMTreePage } from "./features/lsm-tree/LSMTreePage";
import { WriteAmplificationPage } from "./features/write-amplification/WriteAmplificationPage";

type StudyPage =
  | "b-plus-tree"
  | "b-epsilon-tree"
  | "b-tree"
  | "bloom-filter"
  | "hash-table-collision"
  | "lsm-tree"
  | "write-amplification"
  | "consistent-hashing"
  | "consistent-hashing-chord";

const studyPages: Array<{
  id: StudyPage;
  title: string;
  track: string;
  description: string;
}> = [
  {
    id: "hash-table-collision",
    title: "Hash Table Collision",
    track: "Hashing",
    description: "衝突、チェーン法、線形探索法を確認します。",
  },
  {
    id: "b-tree",
    title: "B-tree",
    track: "Trees",
    description: "探索、挿入、削除、範囲走査を通常の B-tree で追います。",
  },
  {
    id: "b-plus-tree",
    title: "B+ Tree",
    track: "Trees",
    description: "葉チェーンと range scan の効き方を確認します。",
  },
  {
    id: "b-epsilon-tree",
    title: "Bε Tree",
    track: "Write Optimization",
    description: "buffered update、flush、split を確認します。",
  },
  {
    id: "lsm-tree",
    title: "LSM-tree",
    track: "Write Optimization",
    description: "WAL、memtable、SSTable、compaction を確認します。",
  },
  {
    id: "bloom-filter",
    title: "Bloom Filter",
    track: "Probabilistic",
    description: "複数ハッシュ、false positive、照会を確認します。",
  },
  {
    id: "write-amplification",
    title: "Write Amplification",
    track: "Storage Cost",
    description: "B-tree / Bε tree / LSM-tree の write path を比較します。",
  },
  {
    id: "consistent-hashing",
    title: "Consistent Hashing",
    track: "Distributed Hashing",
    description: "ハッシュリングとリソース割り当てを確認します。",
  },
  {
    id: "consistent-hashing-chord",
    title: "Chord",
    track: "Distributed Hashing",
    description: "finger table と lookup path を確認します。",
  },
];

const glossaryTerms = [
  {
    term: "separator key",
    description: "内部ノードで子ノードの範囲を分ける案内キーです。",
  },
  {
    term: "tombstone",
    description: "即時削除せず、削除済みであることを表す記録です。",
  },
  {
    term: "write amplification",
    description: "1 回の論理書き込みが、実際には何倍の物理書き込みになるかを表します。",
  },
  {
    term: "read amplification",
    description: "1 回の読み取りで、複数ページや複数ファイルを読む必要がある度合いです。",
  },
  {
    term: "false positive",
    description: "存在しない要素を、確率的構造が存在するかもしれないと返すことです。",
  },
  {
    term: "finger table",
    description: "Chord で遠いノードへ効率よく進むためのショートカット表です。",
  },
  {
    term: "memtable",
    description: "LSM-tree で最新の write を受けるメモリ上の sorted structure です。",
  },
  {
    term: "SSTable",
    description: "flush で作られる immutable な sorted file です。",
  },
  {
    term: "compaction",
    description: "複数の SSTable を merge し、古い値や tombstone を整理する処理です。",
  },
];

function scrollToPanel(selector: string) {
  document.querySelector(selector)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export default function App() {
  const [selectedPage, setSelectedPage] =
    useState<StudyPage>("hash-table-collision");
  const [studyNote, setStudyNote] = useState("");

  useEffect(() => {
    setStudyNote(localStorage.getItem(`data-structure-note:${selectedPage}`) ?? "");
  }, [selectedPage]);

  useEffect(() => {
    localStorage.setItem(`data-structure-note:${selectedPage}`, studyNote);
  }, [selectedPage, studyNote]);

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Study pages">
        {studyPages.map((page) => (
          <button
            key={page.id}
            type="button"
            className={
              selectedPage === page.id
                ? "top-nav-button is-selected"
                : "top-nav-button"
            }
            onClick={() => setSelectedPage(page.id)}
          >
            {page.title}
          </button>
        ))}
      </nav>

      <nav className="section-jump-nav" aria-label="Page sections">
        <button type="button" onClick={() => scrollToPanel(".panel-controls")}>
          Operations
        </button>
        <button type="button" onClick={() => scrollToPanel(".panel-visualizer")}>
          Visualization
        </button>
        <button type="button" onClick={() => scrollToPanel(".panel-inspector")}>
          Step Log
        </button>
        <button type="button" onClick={() => scrollToPanel(".panel-code")}>
          Code
        </button>
      </nav>

      <section className="learning-support">
        <details className="support-details">
          <summary>Learning map</summary>
          <div className="roadmap-grid">
            {studyPages.map((page, index) => (
              <button
                key={page.id}
                type="button"
                className={
                  selectedPage === page.id
                    ? "roadmap-card is-selected"
                    : "roadmap-card"
                }
                onClick={() => setSelectedPage(page.id)}
              >
                <span>{String(index + 1).padStart(2, "0")} / {page.track}</span>
                <strong>{page.title}</strong>
                <small>{page.description}</small>
              </button>
            ))}
          </div>
        </details>

        <details className="support-details">
          <summary>Glossary</summary>
          <div className="glossary-grid">
            {glossaryTerms.map((term) => (
              <div key={term.term} className="glossary-card">
                <strong>{term.term}</strong>
                <span>{term.description}</span>
              </div>
            ))}
          </div>
        </details>

        <details className="support-details support-notes">
          <summary>Study note</summary>
          <label className="field-label" htmlFor="study-note-input">
            This note is saved locally per topic.
          </label>
          <textarea
            id="study-note-input"
            className="study-note-input"
            value={studyNote}
            onChange={(event) => setStudyNote(event.target.value)}
            placeholder="気づいたこと、あとで調べたいこと、比較したい点をメモ..."
          />
        </details>
      </section>

      {selectedPage === "b-plus-tree" ? <BPlusTreePage /> : null}
      {selectedPage === "b-epsilon-tree" ? <BEpsilonTreePage /> : null}
      {selectedPage === "b-tree" ? <BTreePage /> : null}
      {selectedPage === "bloom-filter" ? <BloomFilterPage /> : null}
      {selectedPage === "hash-table-collision" ? <HashTableCollisionPage /> : null}
      {selectedPage === "lsm-tree" ? <LSMTreePage /> : null}
      {selectedPage === "write-amplification" ? <WriteAmplificationPage /> : null}
      {selectedPage === "consistent-hashing" ? <HashRingPage /> : null}
      {selectedPage === "consistent-hashing-chord" ? <ChordPage /> : null}
    </main>
  );
}
