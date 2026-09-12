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
- ISBN 検索は Google Books 優先 → OpenBD 補完（`lib/books/search.ts`）。自由記述検索は Google Books → 429 なら NDL サーチ + OpenBD 書影補完（`lib/books/text-search.ts`）。外部 API はクライアントから直接呼ばず `/api/books/search` か Server Component を経由する
- `books.source` は `google_books / openbd / ndl / manual`。値を増やすときはマイグレーションの check 制約と `lib/types/enums.ts`、`lib/books/schema.ts` を同時に更新する
- 外部 API の書影 URL をそのまま保存する。Supabase Storage は使わない
- 認証必須ページは `app/(dashboard)/`、未ログイン可は `app/(public)/` と `app/(auth)/`。公開パスは `lib/supabase/proxy.ts` の `PUBLIC_PATHS` で管理

## コマンド
- `npm run dev` / `npm run build` / `npm run lint` / `npm run typecheck`
- `npm run db:start` → ローカル Supabase（Docker 必須）、`npm run db:reset` → マイグレーション + seed 再適用
