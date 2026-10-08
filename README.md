# book_manager_web

[haino357/book_manager](https://github.com/haino357/book_manager)（Flutter）の Web 版。
設計の正本は `../book-manager-web-mvp-plan.md`。

## セットアップ

開発はローカルの Supabase（Docker + Supabase CLI）で行う。

| 資料 | 内容 |
|---|---|
| [docs/LOCAL_DEV_SETUP.md](docs/LOCAL_DEV_SETUP.md) | 初回の環境構築（Docker、`.env.local`、`config.toml`、型生成） |
| [docs/LOCAL_RUN.md](docs/LOCAL_RUN.md) | 毎日の起動・停止、ログイン、URL 一覧、うまく動かないとき |
| [docs/DEPLOY.md](docs/DEPLOY.md) | 本番（Vercel + Supabase）へのデプロイと環境変数の一覧 |
| [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md) | ホスティングなどを Cloudflare に移すための調査と、必要な変更 |

初回の流れ:

```bash
npm install
open -a Docker                       # Docker Desktop が起動していなければ
npm run db:start                     # ローカル Supabase。マイグレーションと seed も適用される
cp .env.local.example .env.local     # npx supabase status の URL / anon key を書き込む
npm run dev                          # http://localhost:3000
```

`/signup` から `@example.test` のアドレスでアカウントを作ってログインする（ローカルはメール確認なし）。

### クラウドの Supabase プロジェクトを使う場合

1. Supabase プロジェクトを作成し、`.env.local` に URL / anon key を設定する（`.env.local.example` 参照）
2. マイグレーションを適用する

   ```bash
   npx supabase link --project-ref <project-ref>
   npm run db:push
   ```

3. Supabase ダッシュボード > Authentication > URL Configuration に
   `http://localhost:3000/auth/callback` を Redirect URL として追加する（Google OAuth を使う場合はプロバイダも有効化）
4. `npm run dev` で起動する

型は `npm run gen:types`（ローカル DB から生成）で作り直す。`lib/types/database.ts` は手で編集しない。

## ディレクトリ

```
app/
  (public)/privacy, support   ← 静的ページ（モバイル #37 / #40 用）
  (auth)/login, signup        ← 認証
  (dashboard)/books, import, dashboard ← 認証必須
  (dashboard)/books/search    ← 自由記述検索の一覧（Google Books → NDL サーチ）
  (dashboard)/books/add       ← ISBN 検索 / タイトル・著者検索 / 手動入力
  api/books/search            ← Google Books / OpenBD プロキシ（ISBN）
  auth/callback               ← OAuth / メール確認コールバック
components/ui                 ← shadcn/ui
components/{books,memos,dashboard,auth}
lib/supabase/{client,server,proxy}.ts
lib/books/{google-books,openbd,ndl,search,text-search,schema,types}.ts
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
