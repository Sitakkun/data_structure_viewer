# Development Workflow

このリポジトリでは、今後の変更を Issue 駆動で進めます。目的は、学習テーマ、実装範囲、受け入れ基準、テスト観点を PR 前に明確にすることです。

## 1. Issue を作る

作業前に GitHub Issue を作成します。

- 新しい可視化ページや UI 改善は `Feature`
- 既存挙動の不具合は `Bug`
- CI、ドキュメント、開発環境整備は `Task`

Issue には最低限、背景、実装範囲、完了条件、確認方法を書きます。まだ実装単位に落ちていないメモは blank issue として `Idea` や `Draft` をタイトルに含め、実装前に Feature / Task へ整理します。

## 2. Branch を切る

branch は Issue ごとに切ります。

```bash
git switch main
git pull --ff-only origin main
git switch -c codex/issue-<number>-<short-topic>
```

例:

```bash
git switch -c codex/issue-12-buffer-pool-lru-k
```

1 branch につき 1 issue を基本にします。関連しない変更は同じ PR に混ぜません。

## 3. 実装する

実装では既存の構成に合わせます。

- 可視化は `Step` ベースで、操作を複数 step に分解する
- `simulation.ts` に状態遷移を寄せ、React component は表示に集中させる
- UI 変更では desktop と mobile の両方を意識する
- 新しい主要操作を追加したら、可能な範囲で E2E を追加する
- 過剰な汎用化より、個人学習用として読みやすさを優先する

## 4. 確認する

最低限、以下を確認します。

```bash
npm run build
```

画面操作やモバイル表示に影響する変更では、E2E も実行します。

```bash
npm run test:e2e
```

E2E は GitHub Actions の PR CI でも実行されます。

## 5. Pull Request を作る

PR 本文には linked issue を必ず書きます。

```text
Closes #12
```

PR には次を含めます。

- 変更概要
- 実行した確認コマンド
- UI 変更がある場合の確認観点
- 今回やらないこと、次の issue に回すこと

## 6. Review と merge

PR では CI が通っていることを確認します。レビュー指摘があれば修正し、再度 build / E2E を実行します。

merge 後は GitHub Pages の deploy workflow が通ることを確認します。
