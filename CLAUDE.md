@AGENTS.md

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

## ブランチと PR
- 修正・機能追加は、必ず main から作業ブランチを切って対応する（例: `feat/41-stack-visual`、`fix/…`、`docs/…`）。`main` に直接コミット・push しない
- ブランチは `git switch -c <name> --no-track origin/main` で作る。`origin/main` を追跡したままだと、引数なしの `git push` が `main` に送られる
- push は `git push -u origin <branch>` とブランチ名を明示し、`main` へは PR のマージで入れる

## コマンド
- `npm run dev` / `npm run build` / `npm run lint` / `npm run typecheck`
- `npm run db:start` → ローカル Supabase（Docker 必須）、`npm run db:reset` → マイグレーション + seed 再適用
