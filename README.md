# Data Structure Viewer

個人学習用の React + TypeScript アプリです。  
GitHub Pages: https://sitakkun.github.io/data_structure_viewer/

## 開発フロー

今後の開発は Issue 駆動で進めます。

- 作業前に GitHub Issue を作成
- Issue ごとに `codex/issue-<number>-<short-topic>` branch を作成
- 実装、確認、PR 作成
- PR 本文に `Closes #<issue-number>` を記載

詳細は [Development Workflow](docs/development-workflow.md) を参照してください。

現在は複数の学習ページを持っています。

- `B-tree`
- `Bloom Filter`
- `Hash Table Collision`
  - `Separate Chaining`
  - `Linear Probing`
- `Consistent Hashing`
  - `Hash Ring`
  - `Chord Finger Table`

## MVP 設計

- 題材は複数ページで追加
  - Hash Table Collision
  - Consistent Hashing / Hash Ring
- バケット数は固定
- キーは整数
- 1 回の操作を複数ステップに分解し、`Play / Pause / Next / Prev / Reset` で再生
- 学習で見たい情報を右パネルに集約
  - ハッシュ値
  - 対象インデックス
  - 比較回数
  - 負荷率 α
  - 衝突回数
- 中央下部に Python / C のコード実装例を表示
  - 操作別スニペット
  - 完全実装の折りたたみ表示

## コンポーネント構成

- `src/App.tsx`
  - ページ切替ナビゲーション
- `src/features/b-tree/BTreePage.tsx`
  - 通常の B ツリー学習ページ
- `src/features/b-tree/components/BTreeView.tsx`
  - B ツリーのノード分割と探索経路の可視化
- `src/features/b-tree/simulation.ts`
  - search / insert / split の step-based シミュレーション
- `src/features/bloom-filter/BloomFilterPage.tsx`
  - Bloom Filter 学習ページ
- `src/features/bloom-filter/components/BloomFilterView.tsx`
  - ビット配列とハッシュ位置の可視化
- `src/features/bloom-filter/simulation.ts`
  - 挿入・照会・false positive の step-based シミュレーション
- `src/features/hash-table-chaining/HashTableCollisionPage.tsx`
  - ハッシュテーブル衝突回避ページ
- `src/features/hash-table-chaining/components/ControlPanel.tsx`
  - 方式切替、手動操作、サンプル読み込み、再生制御
- `src/features/hash-table-chaining/components/HashTableView.tsx`
  - チェーン法と線形探索法の可視化
- `src/features/hash-table-chaining/components/StepInspector.tsx`
  - ステップ説明と学習メトリクス
- `src/features/hash-table-chaining/components/CodeExamplesPanel.tsx`
  - 中央下部のコード教材
- `src/features/hash-table-chaining/codeExamples.ts`
  - 2 方式ぶんの Python / C スニペットと完全実装
- `src/features/hash-table-chaining/linearProbingScenarios.ts`
  - 線形探索法のサンプルシナリオ
- `src/features/consistent-hashing-hash-ring/HashRingPage.tsx`
  - ハッシュリング学習ページ
- `src/features/consistent-hashing-hash-ring/components/HashRingView.tsx`
  - リング可視化
- `src/features/consistent-hashing-hash-ring/simulation.ts`
  - ノード追加、削除、キー探索の step-based シミュレーション
- `src/features/consistent-hashing-chord/ChordPage.tsx`
  - Chord 学習ページ
- `src/features/consistent-hashing-chord/components/ChordInspector.tsx`
  - フィンガーテーブルと lookup path の表示
- `src/features/consistent-hashing-chord/simulation.ts`
  - `find_successor` と finger table lookup の step-based シミュレーション

## 状態モデル

- `TableState`
  - 現在のバケット配列またはスロット配列
- `Step`
  - 1 ステップごとの可視化スナップショット
  - `explanation`, `highlights`, `metrics`, `tableState` を保持
- `BTreeState`
  - 通常の B ツリーのノード構造と現在対象キー
- `BTreeStep`
  - B ツリーの 1 ステップごとのスナップショット
- `BloomState`
  - Bloom Filter のビット配列、挿入済み要素、現在のハッシュ位置
- `BloomStep`
  - Bloom Filter の 1 ステップごとのスナップショット
- `RingState`
  - 現在のハッシュリング状態
- `RingStep`
  - ハッシュリングの 1 ステップごとのスナップショット
- `ChordState`
  - Chord リング、フィンガーテーブル、lookup path の状態
- `ChordStep`
  - Chord lookup の 1 ステップごとのスナップショット
- `CodeExampleSet`
  - `operation` と `mode` に応じてコード例を引く教材データ
- `Scenario`
  - サンプルシナリオの初期状態、最終状態、ステップ列

## ディレクトリ構成

```text
.
├── README.md
├── index.html
├── package.json
├── src
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── features
│       ├── b-tree
│       │   ├── BTreePage.tsx
│       │   ├── codeExamples.ts
│       │   ├── scenarios.ts
│       │   ├── simulation.ts
│       │   ├── types.ts
│       │   └── components
│       │       ├── BTreeCodePanel.tsx
│       │       ├── BTreeControlPanel.tsx
│       │       ├── BTreeInspector.tsx
│       │       └── BTreeView.tsx
│       ├── bloom-filter
│       │   ├── BloomFilterPage.tsx
│       │   ├── codeExamples.ts
│       │   ├── scenarios.ts
│       │   ├── simulation.ts
│       │   ├── types.ts
│       │   └── components
│       │       ├── BloomFilterCodePanel.tsx
│       │       ├── BloomFilterControlPanel.tsx
│       │       ├── BloomFilterInspector.tsx
│       │       └── BloomFilterView.tsx
│       ├── consistent-hashing-chord
│       │   ├── ChordPage.tsx
│       │   ├── codeExamples.ts
│       │   ├── scenarios.ts
│       │   ├── simulation.ts
│       │   ├── types.ts
│       │   └── components
│       │       ├── ChordCodePanel.tsx
│       │       ├── ChordControlPanel.tsx
│       │       ├── ChordInspector.tsx
│       │       └── ChordView.tsx
│       ├── consistent-hashing-hash-ring
│       │   ├── HashRingPage.tsx
│       │   ├── codeExamples.ts
│       │   ├── scenarios.ts
│       │   ├── simulation.ts
│       │   ├── types.ts
│       │   └── components
│       │       ├── HashRingCodePanel.tsx
│       │       ├── HashRingControlPanel.tsx
│       │       ├── HashRingInspector.tsx
│       │       └── HashRingView.tsx
│       └── hash-table-chaining
│           ├── HashTableCollisionPage.tsx
│           ├── codeExamples.ts
│           ├── linearProbingScenarios.ts
│           ├── sampleScenarios.ts
│           ├── simulation.ts
│           ├── types.ts
│           └── components
│               ├── CodeExamplesPanel.tsx
│               ├── ControlPanel.tsx
│               ├── HashTableView.tsx
│               └── StepInspector.tsx
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 実装方針

- 可視化状態とシミュレーションロジックを分離
- `simulation.ts` 側でチェーン法と線形探索法の各操作をステップ列に分解
- 通常の B ツリーは、search / insert / split を step-based に分解
- Bloom Filter は、複数ハッシュ位置の計算、ビット更新、照会、false positive を step-based に分解
- ハッシュリングは、キー探索・ノード追加・ノード削除を step-based に分解
- Chord は、開始ノードから `find_successor` を実行し、finger table のどの entry を使ってジャンプしたかを step-based に分解
- UI 側は「どのステップを見せるか」に専念
- コード教材は静的データとして持ち、可視化の `operation` と `mode` に応じて切り替える
- 線形探索法の削除は tombstone で表現し、探索鎖が切れない理由まで見えるようにする
- ハッシュリングでは、ノード増減で影響を受ける区間だけが動くことを説明に含める
- Chord では、各ノードの finger table を右パネルで常時表示し、現在参照中の entry を強調表示する
- 将来ほかの題材を追加するときは、同じ `Step` ベースの流れを再利用可能

## 省略している点

- リサイズ
- 文字列キー
- より現実的なハッシュ関数
- 連結リストのポインタ更新を厳密に描く表現
- B ツリーの delete と借用 / マージ
- 線形探索法の再ハッシュや動的拡張
- 仮想ノード付きコンシステントハッシュ
- Chord の stabilize / fix_fingers / join / leave
- Bloom Filter の削除対応 variant やカウント付き Bloom Filter
- 永続化
- コード行単位のシンタックスハイライト

## 起動

```bash
npm install
npm run dev
```
