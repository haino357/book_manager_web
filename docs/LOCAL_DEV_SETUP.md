# ローカル開発環境セットアップ（Docker + Supabase CLI）

2026-09-12 時点で実施した、Docker のインストール確認からローカル Supabase で開発できる状態になるまでの手順と結果の記録。
再現手順としても使えるように、コマンドと確認ポイントをそのまま残している。

クラウドの Supabase プロジェクトを使う手順は `README.md` を参照。ここではネットワークに依存しないローカル構成のみ扱う。

---

## 構成

| 要素 | 値 |
|---|---|
| Docker | Docker Desktop 29.7.2（arm64 / CPU 8 / メモリ 7.7GB） |
| Supabase CLI | 2.117.0（`devDependencies`、`npx supabase` で実行） |
| Postgres | 17.6.1（`public.ecr.aws/supabase/postgres`） |
| Node / npm | 22.20.0 / 11.6.2 |
| Next.js | 16.3.5 |

ローカル Supabase のポート（`supabase/config.toml`）:

| サービス | URL |
|---|---|
| API（Kong） | `http://127.0.0.1:54321` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio（GUI） | `http://127.0.0.1:54323` |
| Mailpit（送信メール確認） | `http://127.0.0.1:54324` |

---

## 1. Docker

### 1-1. 状態確認

```bash
docker --version   # CLI の有無
docker info        # デーモンに接続できるか（Server: セクションが出れば OK）
```

今回は Docker Desktop がインストール済みだったが、デーモンが起動しておらず `docker info` が
`failed to connect to the docker API at unix:///var/run/docker.sock` で失敗していた。

### 1-2. 未インストールの場合

```bash
brew install --cask orbstack   # 軽量。こちらでも可
# または
brew install --cask docker     # Docker Desktop
```

### 1-3. 起動と疎通確認

```bash
open -a Docker                  # Docker Desktop を起動（数秒でデーモンが上がる）
docker info | grep 'Server Version'
docker run --rm hello-world     # "Hello from Docker!" が出れば OK
```

Docker Desktop の Settings > General で「Start Docker Desktop when you sign in」を有効にしておくと、
`npm run db:start` の前に起動し忘れない。

---

## 2. ローカル Supabase の起動

```bash
npm run db:start   # = npx supabase start
```

- 初回はイメージ取得（Postgres / Auth / Kong / Studio / Realtime / Storage など）で数分かかる。
- 起動時に `supabase/migrations/*.sql` と `supabase/seed.sql` が自動適用される。
  今回は `00001_init.sql` と seed（書籍マスター 2 件）が適用された。
- 終了時に API URL や anon key が JSON で表示される。後から見るには:

```bash
npx supabase status
```

停止・再起動・DB 作り直し:

```bash
npx supabase stop     # コンテナ停止（データはバックアップされ、次回 start で復元）
npm run db:reset      # マイグレーション + seed を最初から再適用（データは消える）
```

`config.toml` を変更したときは `npx supabase stop && npx supabase start` で反映する。

---

## 3. `.env.local`

`.env.local` は `.env.local.example` のコピー（プレースホルダー）のままだったため、ローカルの値に書き換えた。
git 管理外（`.gitignore`）なので各自で設定する。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<npx supabase status の ANON_KEY>
GOOGLE_BOOKS_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `GOOGLE_BOOKS_API_KEY` は空でも動く（無料枠がキー単位ではなく IP 単位になるだけ）。
- **`.env.local` を変更したら `npm run dev` を再起動する。** 起動済みの dev サーバーは古い値を保持している可能性がある。

---

## 4. `supabase/config.toml` のリダイレクト設定

アプリ側は `NEXT_PUBLIC_SITE_URL`（`http://localhost:3000`）を基準に `/auth/callback` へ戻るが、
`config.toml` の初期値は `127.0.0.1` だったため、メール確認リンクや OAuth の戻り先が不一致になる。以下に修正した。

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback", "http://127.0.0.1:3000/auth/callback"]
```

ローカルの Auth 設定は次の通り（変更なし）:

- `enable_signup = true`、`enable_confirmations = false`
  → メール確認なしでサインアップ直後にログイン状態になる。送信されたメールは Mailpit で確認できる。
- Google OAuth（`[auth.external.google]`）は未設定。ローカルではメール + パスワードで開発する。
  必要になったら Client ID / Secret を `env(...)` 経由で追加する。

---

## 5. 型生成と手書きエイリアスの分離

```bash
npm run gen:types   # = supabase gen types typescript --local > lib/types/database.ts
```

これまで `lib/types/database.ts` は SQL と手動同期した仮の型で、`BookStatus` / `BookSource` / `MemoType`
のエイリアスが手書きされていた。生成物にはこれらが含まれない（DB 側が enum ではなく `check` 制約のため
`Enums` は空になる）ので、typecheck が失敗した。

対応として `lib/types/enums.ts` を新設し、エイリアスをそこへ移した。

```ts
// lib/types/enums.ts
export type BookStatus = "wishlist" | "unread" | "reading" | "completed";
export type BookSource = "google_books" | "openbd" | "manual";
export type MemoType = "note" | "quote" | "summary" | "review" | "vocabulary" | "action";
```

import を差し替えたファイル:

- `app/(dashboard)/books/page.tsx`
- `lib/books/types.ts`
- `lib/import/mobile-export.ts`

**ルール:** `lib/types/database.ts` は手で編集しない（`gen:types` で上書きされる）。
リテラル型は `lib/types/enums.ts` に置き、値を変えるときは `supabase/migrations` の `check` 制約も合わせて更新する。

---

## 6. 検証

```bash
npm run typecheck   # OK
npm run lint        # OK
npm run dev         # http://localhost:3000
```

Node から `@supabase/supabase-js` を使って、ローカル Supabase に対して以下を確認した。

| 確認項目 | 結果 |
|---|---|
| メール + パスワードでサインアップ | OK。確認メール不要で即セッション発行 |
| `auth.users` insert 時の `profiles` 自動作成トリガー | OK（1 行作成） |
| seed 書籍 2 件の読み取り | OK（リーダブルコード / 良いコード/悪いコードで学ぶ設計入門） |
| ログインユーザーによる `user_books` insert | OK（RLS 通過） |
| 未ログイン（anon）で `user_books` select | 0 行（RLS で遮断） |
| `/` `/login` `/signup` | 200 |
| `/books`（認証必須）未ログイン | 307 → `/login?next=/books` |
| `/api/books/search` 未ログイン | 307 → `/login`（`PUBLIC_PATHS` 外のため） |

検証で作成したテストユーザー `dev-check-<timestamp>@example.com` と本棚 1 件がローカル DB に残っている。
不要なら `npm run db:reset` で消える。

---

## 日常の起動手順（まとめ）

```bash
open -a Docker          # Docker Desktop が起動していなければ
npm run db:start        # ローカル Supabase
npm run dev             # http://localhost:3000
```

終了時は `npx supabase stop`。マイグレーションを追加したら `npm run db:reset` → `npm run gen:types` → `npm run typecheck`。

---

## 未検証・残作業

- Google OAuth ログイン（ローカルのプロバイダ設定が未実施）
- `/api/books/search` の実データ取得（ログイン後に ISBN `9784873119694` で確認予定）
- `/books` `/books/[id]` の関連テーブル取得クエリのブラウザ上での確認
- `docs/PROGRESS.md` の「Supabase 未適用 / 未検証」記述の更新
