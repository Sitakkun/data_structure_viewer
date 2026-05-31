import { useEffect, useState } from "react";
import { BPlusTreePage } from "./features/b-plus-tree/BPlusTreePage";
import { BEpsilonTreePage } from "./features/b-epsilon-tree/BEpsilonTreePage";
import { BTreePage } from "./features/b-tree/BTreePage";
import { BloomFilterPage } from "./features/bloom-filter/BloomFilterPage";
import { BufferPoolPage } from "./features/buffer-pool/BufferPoolPage";
import { ChordPage } from "./features/consistent-hashing-chord/ChordPage";
import { HashRingPage } from "./features/consistent-hashing-hash-ring/HashRingPage";
import { HashTableCollisionPage } from "./features/hash-table-chaining/HashTableCollisionPage";
import { LSMTreePage } from "./features/lsm-tree/LSMTreePage";
import { PaxosPage } from "./features/paxos/PaxosPage";
import { WriteAmplificationPage } from "./features/write-amplification/WriteAmplificationPage";

type StudyPage =
  | "b-plus-tree"
  | "b-epsilon-tree"
  | "b-tree"
  | "bloom-filter"
  | "buffer-pool"
  | "hash-table-collision"
  | "lsm-tree"
  | "paxos"
  | "write-amplification"
  | "consistent-hashing"
  | "consistent-hashing-chord";

type StudyPageMeta = {
  id: StudyPage;
  title: string;
  track: string;
  description: string;
};

const studyPages: StudyPageMeta[] = [
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
    id: "buffer-pool",
    title: "Buffer Pool",
    track: "Database Storage",
    description: "LRU と CLOCK の page replacement、dirty page、pin count を確認します。",
  },
  {
    id: "paxos",
    title: "Paxos",
    track: "Consensus",
    description: "prepare / promise / accept / chosen と quorum safety を確認します。",
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

const studyPageGroups = studyPages.reduce<
  Array<{ track: string; pages: StudyPageMeta[] }>
>((groups, page) => {
  const group = groups.find((currentGroup) => currentGroup.track === page.track);

  if (group) {
    group.pages.push(page);
  } else {
    groups.push({ track: page.track, pages: [page] });
  }

  return groups;
}, []);

function trackLabelId(track: string) {
  return `topic-track-${track.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

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
  {
    term: "quorum",
    description: "分散合意で値を決めるために必要な過半数などの最小集合です。",
  },
  {
    term: "promise",
    description: "Paxos acceptor が、より低い proposal number を受け付けないと約束する応答です。",
  },
  {
    term: "proposal number",
    description: "Paxos で競合する proposer の優先順位を決める単調増加の番号です。",
  },
  {
    term: "dirty page",
    description: "buffer pool 上で更新済みだが、まだ disk に書き戻されていない page です。",
  },
  {
    term: "pin count",
    description: "query が利用中の page を eviction から守るための参照数です。",
  },
  {
    term: "reference bit",
    description: "CLOCK replacement で最近参照された page に second chance を与えるための bit です。",
  },
];

function scrollToPanel(selector: string) {
  document.querySelector(selector)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function LearningMap({
  selectedPage,
  onSelectPage,
}: {
  selectedPage: StudyPage;
  onSelectPage: (pageId: StudyPage) => void;
}) {
  return (
    <div className="roadmap-grid">
      {studyPages.map((page, index) => (
        <button
          key={page.id}
          type="button"
          className={
            selectedPage === page.id ? "roadmap-card is-selected" : "roadmap-card"
          }
          onClick={() => onSelectPage(page.id)}
        >
          <span>
            {String(index + 1).padStart(2, "0")} / {page.track}
          </span>
          <strong>{page.title}</strong>
          <small>{page.description}</small>
        </button>
      ))}
    </div>
  );
}

function Glossary() {
  return (
    <div className="glossary-grid">
      {glossaryTerms.map((term) => (
        <div key={term.term} className="glossary-card">
          <strong>{term.term}</strong>
          <span>{term.description}</span>
        </div>
      ))}
    </div>
  );
}

function StudyNote({
  inputId,
  value,
  onChange,
}: {
  inputId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <label className="field-label" htmlFor={inputId}>
        This note is saved locally per topic.
      </label>
      <textarea
        id={inputId}
        className="study-note-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="気づいたこと、あとで調べたいこと、比較したい点をメモ..."
      />
    </>
  );
}

export default function App() {
  const [selectedPage, setSelectedPage] =
    useState<StudyPage>("hash-table-collision");
  const [studyNote, setStudyNote] = useState("");
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);
  const selectedPageIndex = studyPages.findIndex(
    (page) => page.id === selectedPage,
  );
  const selectedPageMeta = studyPages[selectedPageIndex] ?? studyPages[0];

  function handleSelectPage(pageId: StudyPage) {
    setSelectedPage(pageId);
    setIsTopicMenuOpen(false);
  }

  useEffect(() => {
    setStudyNote(localStorage.getItem(`data-structure-note:${selectedPage}`) ?? "");
  }, [selectedPage]);

  useEffect(() => {
    localStorage.setItem(`data-structure-note:${selectedPage}`, studyNote);
  }, [selectedPage, studyNote]);

  return (
    <main className="app-shell">
      <nav
        className={isTopicMenuOpen ? "top-nav is-topic-menu-open" : "top-nav"}
        aria-label="Study pages"
      >
        <button
          type="button"
          className="topic-switcher-toggle"
          aria-expanded={isTopicMenuOpen}
          aria-controls="study-topic-list"
          onClick={() => setIsTopicMenuOpen((current) => !current)}
        >
          <span className="topic-switcher-kicker">
            Topic {String(selectedPageIndex + 1).padStart(2, "0")} /{" "}
            {selectedPageMeta.track}
          </span>
          <strong>{selectedPageMeta.title}</strong>
          <span className="topic-switcher-action">
            {isTopicMenuOpen ? "Close topics" : "Change topic"}
          </span>
        </button>
        <div id="study-topic-list" className="top-nav-list">
          {studyPageGroups.map((group) => (
            <section
              key={group.track}
              className={
                group.pages.some((page) => page.id === selectedPage)
                  ? "topic-track-group is-current"
                  : "topic-track-group"
              }
              aria-labelledby={trackLabelId(group.track)}
            >
              <p id={trackLabelId(group.track)} className="topic-track-label">
                <span>{group.track}</span>
                <small>{group.pages.length}</small>
              </p>
              <div className="topic-track-items">
                {group.pages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    className={
                      selectedPage === page.id
                        ? "top-nav-button is-selected"
                        : "top-nav-button"
                    }
                    aria-current={selectedPage === page.id ? "page" : undefined}
                    onClick={() => handleSelectPage(page.id)}
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
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
          <LearningMap
            selectedPage={selectedPage}
            onSelectPage={handleSelectPage}
          />
        </details>

        <details className="support-details">
          <summary>Glossary</summary>
          <Glossary />
        </details>

        <details className="support-details support-notes">
          <summary>Study note</summary>
          <StudyNote
            inputId="study-note-input"
            value={studyNote}
            onChange={setStudyNote}
          />
        </details>
      </section>

      <details className="mobile-study-tools">
        <summary className="mobile-study-tools-summary">
          <span className="mobile-study-tools-copy">
            <span className="mobile-study-tools-kicker">Study tools</span>
            <strong>Map / Glossary / Note</strong>
          </span>
          <span className="mobile-study-tools-status" aria-hidden="true">
            <span className="mobile-study-tools-open">Open</span>
            <span className="mobile-study-tools-close">Close</span>
          </span>
        </summary>
        <div className="mobile-study-tools-panels">
          <details className="support-details">
            <summary>Learning map</summary>
            <LearningMap
              selectedPage={selectedPage}
              onSelectPage={handleSelectPage}
            />
          </details>

          <details className="support-details">
            <summary>Glossary</summary>
            <Glossary />
          </details>

          <details className="support-details support-notes">
            <summary>Study note</summary>
            <StudyNote
              inputId="study-note-input-mobile"
              value={studyNote}
              onChange={setStudyNote}
            />
          </details>
        </div>
      </details>

      {selectedPage === "b-plus-tree" ? <BPlusTreePage /> : null}
      {selectedPage === "b-epsilon-tree" ? <BEpsilonTreePage /> : null}
      {selectedPage === "b-tree" ? <BTreePage /> : null}
      {selectedPage === "bloom-filter" ? <BloomFilterPage /> : null}
      {selectedPage === "buffer-pool" ? <BufferPoolPage /> : null}
      {selectedPage === "hash-table-collision" ? <HashTableCollisionPage /> : null}
      {selectedPage === "lsm-tree" ? <LSMTreePage /> : null}
      {selectedPage === "paxos" ? <PaxosPage /> : null}
      {selectedPage === "write-amplification" ? <WriteAmplificationPage /> : null}
      {selectedPage === "consistent-hashing" ? <HashRingPage /> : null}
      {selectedPage === "consistent-hashing-chord" ? <ChordPage /> : null}
    </main>
  );
}
