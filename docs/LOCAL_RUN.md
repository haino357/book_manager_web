# ローカルでの実行方法

毎日の起動・停止の手順。初回の環境構築（Docker のインストール、`.env.local` の作成、`config.toml` の修正）は `docs/LOCAL_DEV_SETUP.md` を参照。

## 前提

- Docker Desktop（または OrbStack）がインストール済み
- `npm install` 済み
- `.env.local` にローカル Supabase の値が入っている（`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` と `npx supabase status` の anon key）

## 起動

```bash
# 1. Docker を起動（起動済みなら不要）
open -a Docker
docker info --format '{{.ServerVersion}}'   # バージョンが出れば OK

# 2. ローカル Supabase を起動
npm run db:start

# 3. Next.js の dev サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開く。

### `npm run db:start` がエラーになる場合

Docker を起動した直後は、前回のコンテナが自動で再起動している途中のことがある。その場合は次のエラーになる。

```
supabase_db_book_manager_web container is not ready: starting
```

数秒待ってから `npx supabase status` を実行し、URL の一覧が表示されれば起動済み。改めて `db:start` を実行する必要はない。
`Stopped services: [imgproxy, edge_runtime, pooler]` と表示されるが、このアプリでは使わないので問題ない。

## 外部 API のキー（任意）

`.env.local` に設定すると検索が良くなる。どれも未設定でも動く（キーの無い API だけで探す）。変更したら `npm run dev` を再起動する。

| 変数 | 取得先 | 未設定のとき |
|---|---|---|
| `GOOGLE_BOOKS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/apis/library/books.googleapis.com) で Books API を有効にして API キーを作る（1 日 1,000 回まで無料） | キー無しの共有枠はほぼ常に 429 になり、楽天 / NDL サーチにフォールバックする |
| `RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY` | [楽天ウェブサービス](https://webservice.rakuten.co.jp/) でアプリを登録し、アプリ ID とアクセスキーを取得 | 楽天ブックスを使わない |
| `AMAZON_ASSOCIATE_TAG` | Amazon アソシエイトのトラッキング ID（例: `xxxx-22`） | Amazon へのリンクはタグ無し。設定するとフッターにアソシエイトの表示が出る。営利目的になるので NDL の書影 API は申請が必要 |

どれもサーバー側だけで使う（`NEXT_PUBLIC_` を付けない）。

ほかに `NEXT_PUBLIC_SUPPORT_EMAIL`（`/support` `/privacy` の問い合わせ先）と `SENTRY_*`（エラー送信）があるが、ローカルでは未設定でよい。全体の一覧は `docs/DEPLOY.md` を参照。

## ログイン

seed（`supabase/seed.sql`）に入っているのは書籍マスターだけで、ユーザーはいない。
http://localhost:3000/signup から `@example.test` のアドレスでアカウントを作る（ローカルはメール確認なしで、そのままログインになる）。

- 確認が終わったら、設定画面（`/settings`）から退会させる
- `npm run db:reset` をすると seed 以外のデータ（作ったアカウントを含む）は消える

## URL 一覧

| 用途 | URL |
|---|---|
| アプリ | http://localhost:3000 |
| 蔵書一覧 | http://localhost:3000/books |
| Supabase Studio（DB の GUI） | http://127.0.0.1:54323 |
| Mailpit（送信メールの確認） | http://127.0.0.1:54324 |
| Supabase API | http://127.0.0.1:54321 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

## 停止

```bash
# dev サーバーは起動した端末で Ctrl+C
npx supabase stop   # Supabase のコンテナを停止（データは次回の start で復元される）
```

## コミット前のチェック

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## うまく動かないとき

| 症状 | 対処 |
|---|---|
| `EADDRINUSE :3000` | 別の dev サーバーが起動中。`lsof -nP -iTCP:3000 -sTCP:LISTEN` で PID を確認して止める |
| `.env.local` を変えても反映されない | `npm run dev` を再起動する |
| `lib/` 配下の変更が反映されない | Turbopack が変更を拾わないことがある。`npm run dev` を再起動する |
| ページを移動・削除したあと typecheck が `.next/dev/types/validator.ts` で失敗する | 古い `next dev` の生成物が残っている。`npm run dev` を起動し直すと再生成される |
| マイグレーションを追加した | `npx supabase migration up`（データを残す）または `npm run db:reset`（作り直し）→ `npm run gen:types` |
