# book_manager_web

[haino357/book_manager](https://github.com/haino357/book_manager)（Flutter）の Web 版。
設計の正本は `../book-manager-web-mvp-plan.md`。

## セットアップ

1. 依存インストール

   ```bash
   npm install
   ```

2. Supabase プロジェクトを作成し、`.env.local` に URL / anon key を設定する（`.env.local.example` 参照）

3. マイグレーションを適用する

   ```bash
   # ローカル（Docker 必須）
   npm run db:start
   npm run db:reset

   # またはリモートプロジェクトへ
   npx supabase link --project-ref <project-ref>
   npm run db:push
   ```

4. 型を生成する

   ```bash
   npm run gen:types          # ローカル DB から
   # npx supabase gen types typescript --linked > lib/types/database.ts   # リモートから
   ```

5. Supabase ダッシュボード > Authentication > URL Configuration に
   `http://localhost:3000/auth/callback` を Redirect URL として追加する（Google OAuth を使う場合はプロバイダも有効化）

6. 起動

   ```bash
   npm run dev
   ```

## ディレクトリ

```
app/
  (public)/privacy, support   ← 静的ページ（モバイル #37 / #40 用）
  (auth)/login, signup        ← 認証
  (dashboard)/books, import, dashboard ← 認証必須
  api/books/search            ← Google Books / OpenBD プロキシ
  auth/callback               ← OAuth / メール確認コールバック
components/ui                 ← shadcn/ui
components/{books,memos,dashboard,auth}
lib/supabase/{client,server,proxy}.ts
lib/books/{google-books,openbd,search,types}.ts
lib/import/mobile-export.ts   ← #24 JSON → v2 スキーマ変換
lib/actions/                  ← Server Actions
lib/types/database.ts         ← supabase gen types で生成
proxy.ts                      ← Next.js 16（旧 middleware.ts）
supabase/migrations/00001_init.sql
```

## マイルストーン

| M | 内容 | 状態 |
|---|---|---|
| M1 | 基盤 + 静的ページ（Supabase・RLS・Auth・/privacy /support） | 雛形作成済み |
| M2 | 蔵書 + メモ（ISBN 検索・一覧・詳細・6 種別メモ・/import） | 未着手 |
| M3 | 評価 + 統計 | 未着手 |
| M4 | 公開（Vercel・Cloudflare・Sentry） | 未着手 |

## License

[MIT](./LICENSE)
