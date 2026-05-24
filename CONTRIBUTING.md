# Contributing

このリポジトリは個人学習用の React + TypeScript アプリです。変更は小さく分け、Issue と Pull Request で意図を追える状態にします。

## 基本方針

- 作業前に GitHub Issue を作成します。
- 1 Issue につき 1 branch / 1 Pull Request を基本にします。
- branch 名は `codex/issue-<number>-<short-topic>` を使います。
- unrelated な変更、整形、リファクタリングを同じ PR に混ぜません。
- 既存の構成、命名、UI パターンを優先します。

詳しい開発フローは [docs/development-workflow.md](docs/development-workflow.md) も参照してください。

## セットアップ

```bash
npm install
npm run dev
```

GitHub Pages の base path を含めた production 相当の確認には preview を使います。

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

## 作業手順

main を最新化してから作業 branch を作ります。

```bash
git switch main
git pull --ff-only origin main
git switch -c codex/issue-<number>-<short-topic>
```

実装後は必要な確認を行い、PR 本文に実行したコマンドと確認観点を書きます。

```text
Closes #<issue-number>
```

## 実装ルール

- 可視化は step-based にします。操作を複数 step に分解し、各 step に説明、ハイライト、状態スナップショットを持たせます。
- 状態遷移やシミュレーションは各 feature の `simulation.ts` に寄せ、React component は表示と操作に集中させます。
- 教材テキストは、初学者が「何を見るべきか」を理解できる短い説明にします。
- 共通化は、重複を実際に減らす場合だけ行います。先回りした抽象化は避けます。
- UI 変更では desktop / tablet / mobile の表示を確認します。
- スマホ UI は縦に間延びしないこと、主要操作が下部 dock や近接する panel から迷わず行えることを重視します。

## テストと確認

最低限、TypeScript と production build を確認します。

```bash
npm run build
```

画面操作、レスポンシブ表示、学習フロー、step timeline に影響する変更では E2E も実行します。

```bash
npm run test:e2e
```

UI / UX 変更では、可能な限り Chrome 実ブラウザでも確認します。特に mobile 改善では phone-sized viewport で次を確認します。

- Visualization が見切れていないか、横スクロールできる場合は affordance があるか
- Step Log と Visualization の距離が離れすぎていないか
- playback dock が本文や操作を邪魔していないか
- 主要なボタンやラベルが折り返し、重なり、はみ出しを起こしていないか

## Pull Request

PR には次を含めます。

- 変更概要
- 背景または root cause
- ユーザーへの影響
- 実行した確認コマンド
- UI 変更がある場合のブラウザ確認内容
- linked issue: `Closes #<issue-number>`

PR は CI が通ってから review / merge します。merge 後は GitHub Pages の deploy が通ることを確認します。

## コミット

- コミットメッセージは短く、変更内容を動詞で表します。
- 例: `Compact mobile step timeline`
- 大きな変更は、レビューしやすい単位に分けます。
