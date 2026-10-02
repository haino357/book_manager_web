<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# book_manager_web

読書管理 Web MVP。設計・ロードマップの正本は `../book-manager-web-mvp-plan.md`（v2, 2026-09-12）。

## スタック
- Next.js 16 (App Router, `proxy.ts` = 旧 middleware) / TypeScript / Tailwind v4 / shadcn/ui (radix-nova)
- Supabase（PostgreSQL + RLS + Auth）を `@supabase/ssr` で直叩き。API 層は作らない
- Server Components + Server Actions + `revalidatePath`。TanStack Query / Zustand は入れない
- React Hook Form + Zod、`react-markdown`、Recharts

## 規約
- DB 変更は `supabase/migrations/*.sql` に追加し、`npm run gen:types` で `lib/types/database.ts` を再生成する（手で編集しない）
- ステータスは `wishlist / unread / reading / completed`、メモ種別は `note / quote / summary / review / vocabulary / action`（モバイルと同名）
- 書籍データは Google Books / OpenBD / 楽天ブックス / NDL サーチの公式 API から取る。**Amazon からは取得しない**（Creators API は売上条件があり、画像の保存禁止・データは 24 時間までの規約で `books` に保存する設計と合わない）。Amazon は商品ページへのリンクだけ出す（`lib/books/store-links.ts`）
- ISBN 検索は Google Books・OpenBD・楽天を並列に引き、この順に正として足りない項目を補完（`lib/books/search.ts` の `mergeMetadata`）。自由記述検索は Google Books → 429 / 0 件なら楽天 → 0 件なら NDL サーチ、ISBN があるものは OpenBD で補完（`lib/books/text-search.ts`）。外部 API はクライアントから直接呼ばず `/api/books/search` か Server Component を経由する
- 楽天ブックス API を使う画面にはクレジット表示が必須（`app/(dashboard)/layout.tsx` のフッター。規約で HTML の改変禁止）。Amazon アソシエイトのタグ（`AMAZON_ASSOCIATE_TAG`）を設定したらアソシエイトの表示も出る
- `books.source` は `google_books / openbd / ndl / rakuten / manual`。値を増やすときはマイグレーションの check 制約と `lib/types/enums.ts`、`lib/books/schema.ts` を同時に更新する
- 外部 API の書影 URL をそのまま保存する。Supabase Storage は使わない。書影が無い本は NDL サーチの書影 API（`lib/books/ndl-cover.ts`）→ Google の書影配信 URL（`lib/books/google-cover.ts`、プレースホルダー画像はハッシュで除外）の順に補完する（`lib/books/covers.ts`）。NDL の書影 API は営利目的なら申請が必要
- 認証必須ページは `app/(dashboard)/`、未ログイン可は `app/(public)/` と `app/(auth)/`。公開パスは `lib/supabase/proxy.ts` の `PUBLIC_PATHS` で管理
  - 公開ページを足したら `PUBLIC_PATHS` と `app/sitemap.ts` を同じ PR で更新する。ログイン後の画面を足したら `app/robots.ts` の disallow に入れる
- マイグレーションの番号は、作るときに `main` の最新を確かめて次の番号にする。並行するブランチとぶつかったら、後からマージする側が振り直す。`lib/types/database.ts` が衝突したら手で直さず `npm run gen:types` で作り直す
- 環境変数を足したら、`.env.local.example` と `docs/DEPLOY.md` の表を同じ PR で更新する
- 色は直書きせず、テーマの変数（`bg-background`、`text-muted-foreground`、`var(--viz-series)` など）を使う（ダークモード #42 のため）。直書きしてよいのは、`globals.css` が読まれない `app/global-error.tsx` と、外に出る画像（アイコン・OGP）だけ

## ブランチと PR
- 修正・機能追加は、必ず main から作業ブランチを切って対応する（例: `feat/41-stack-visual`、`fix/…`、`docs/…`）。`main` に直接コミット・push しない
- ブランチは `git switch -c <name> --no-track origin/main` で作る。`origin/main` を追跡したままだと、引数なしの `git push` が `main` に送られる
- push は `git push -u origin <branch>` とブランチ名を明示し、`main` へは PR のマージで入れる
- コミットは Issue ごとに分け、メッセージは `feat: …（#41）` の形にする（`fix:` / `docs:` / `chore:` も同じ）
- PR は `.github/pull_request_template.md` に沿って書き、`Closes #n` を入れる。CI（`.github/workflows/ci.yml`: typecheck / lint / test / build）が通ってからマージする
- 画面に関わる変更は、ローカルで画面を見て確かめ、確かめた画面と操作を PR の「確認」に書く
- PR をマージしたら、関係する Issue のチェックボックスを更新する。確かめられなかった項目は、理由を添えて残す

## テスト
- `lib/` の純粋関数にはテストを付ける（Vitest。`lib/**/*.test.ts`、`npm test`）。集計（`lib/stats/`）や書誌のマージ（`lib/books/`）を変えたら、境目のケースを足す

## ローカルでの確認
- テスト用のアカウントは `@example.test` のアドレスで作り、確認が終わったら設定画面から退会させる
- 確認用の一時ページやスクリプトはリポジトリに置かない。置いた場合はコミット前に消す

## コマンド
- `npm run dev` / `npm run build` / `npm run lint` / `npm run typecheck` / `npm test`
- `npm run db:start` → ローカル Supabase（Docker 必須）、`npm run db:reset` → マイグレーション + seed 再適用

## エージェントでの作業（Codex / Claude Code 共通）
- このファイルが規約の正本。`CLAUDE.md` は `@AGENTS.md` で読み込むだけなので、ルールはここに書く。`<!-- BEGIN/END:nextjs-agent-rules -->` の中は `next dev` が書き戻すので編集しない
- 作業を始める前に `git status` と現在のブランチを確かめる。`main` にいたら上の手順で作業ブランチを切る。自分が触っていない未コミットの変更（`.claude/` など）は消さず、コミットにも含めない
- コミット・push・PR 作成は、ユーザーに頼まれたときだけ行う。PR は `gh pr create` で、本文はテンプレートの「概要 / 内容 / 確認 / 注意」を埋める
- 変更を終えたら `npm run typecheck` / `npm run lint` / `npm test` を走らせ、結果をそのまま報告する。落ちたものは隠さない
- サンドボックスでネットワークや Docker が使えない場合（`npm install`、`npm run db:*`、`npm run gen:types`、外部の書籍 API）は、迂回せず承認を求めるか、実行できなかったと報告する
  - `gen:types` はローカル Supabase（`db:start` 済み）が前提。動かせないときに `lib/types/database.ts` を手で書き換えない
- 画面を確かめられない環境では、確かめたことにしない。PR の「確認」に「未確認（理由）」と書き、人に確認を頼む
- `.env.local` の中身（キー・トークン）を出力やコミットに含めない。新しい値が要るときは `.env.local.example` にキー名だけ足す
- 返答・コミットメッセージ・PR・コメントは日本語で書く
