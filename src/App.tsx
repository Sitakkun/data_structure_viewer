import { useState } from "react";
import { BPlusTreePage } from "./features/b-plus-tree/BPlusTreePage";
import { BEpsilonTreePage } from "./features/b-epsilon-tree/BEpsilonTreePage";
import { BTreePage } from "./features/b-tree/BTreePage";
import { BloomFilterPage } from "./features/bloom-filter/BloomFilterPage";
import { ChordPage } from "./features/consistent-hashing-chord/ChordPage";
import { HashRingPage } from "./features/consistent-hashing-hash-ring/HashRingPage";
import { HashTableCollisionPage } from "./features/hash-table-chaining/HashTableCollisionPage";
import { WriteAmplificationPage } from "./features/write-amplification/WriteAmplificationPage";

type StudyPage =
  | "b-plus-tree"
  | "b-epsilon-tree"
  | "b-tree"
  | "bloom-filter"
  | "hash-table-collision"
  | "write-amplification"
  | "consistent-hashing"
  | "consistent-hashing-chord";

export default function App() {
  const [selectedPage, setSelectedPage] =
    useState<StudyPage>("hash-table-collision");

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Study pages">
        <button
          type="button"
          className={
            selectedPage === "hash-table-collision"
              ? "top-nav-button is-selected"
              : "top-nav-button"
          }
          onClick={() => setSelectedPage("hash-table-collision")}
        >
          Hash Table Collision
        </button>
        <button
          type="button"
          className={
            selectedPage === "b-tree"
              ? "top-nav-button is-selected"
              : "top-nav-button"
          }
          onClick={() => setSelectedPage("b-tree")}
        >
          B-tree
        </button>
        <button
          type="button"
          className={
            selectedPage === "b-plus-tree"
              ? "top-nav-button is-selected"
              : "top-nav-button"
          }
          onClick={() => setSelectedPage("b-plus-tree")}
        >
          B+ Tree
        </button>
        <button
          type="button"
          className={
            selectedPage === "b-epsilon-tree"
              ? "top-nav-button is-selected"
              : "top-nav-button"
          }
          onClick={() => setSelectedPage("b-epsilon-tree")}
        >
          Bε Tree
        </button>
        <button
          type="button"
          className={
            selectedPage === "bloom-filter"
              ? "top-nav-button is-selected"
              : "top-nav-button"
          }
          onClick={() => setSelectedPage("bloom-filter")}
        >
          Bloom Filter
        </button>
        <button
          type="button"
          className={
            selectedPage === "write-amplification"
              ? "top-nav-button is-selected"
              : "top-nav-button"
          }
          onClick={() => setSelectedPage("write-amplification")}
        >
          Write Amplification
        </button>
        <button
          type="button"
          className={
            selectedPage === "consistent-hashing"
              ? "top-nav-button is-selected"
              : "top-nav-button"
          }
          onClick={() => setSelectedPage("consistent-hashing")}
        >
          Consistent Hashing
        </button>
        <button
          type="button"
          className={
            selectedPage === "consistent-hashing-chord"
              ? "top-nav-button is-selected"
              : "top-nav-button"
          }
          onClick={() => setSelectedPage("consistent-hashing-chord")}
        >
          Chord
        </button>
      </nav>

      {selectedPage === "b-plus-tree" ? <BPlusTreePage /> : null}
      {selectedPage === "b-epsilon-tree" ? <BEpsilonTreePage /> : null}
      {selectedPage === "b-tree" ? <BTreePage /> : null}
      {selectedPage === "bloom-filter" ? <BloomFilterPage /> : null}
      {selectedPage === "hash-table-collision" ? <HashTableCollisionPage /> : null}
      {selectedPage === "write-amplification" ? <WriteAmplificationPage /> : null}
      {selectedPage === "consistent-hashing" ? <HashRingPage /> : null}
      {selectedPage === "consistent-hashing-chord" ? <ChordPage /> : null}
    </main>
  );
}
