---
title: book_manager_web — 作成状況
created: 2026-09-12
updated: 2026-09-12
tags: [book-manager, web-mvp, progress]
plan: ../../book-manager-web-mvp-plan.md
---

# book_manager_web — 作成状況

> [!info] このファイルの位置づけ
> `book-manager-web-mvp-plan.md`（v2, 2026-09-12）に基づいてプロジェクトフォルダを作成した時点のスナップショット。
> 以降の進捗は末尾の「更新履歴」に append-only で追記する。

## サマリー

| 項目 | 状態 |
|---|---|
| プロジェクト初期化 | ✅ 完了（Next.js 16.3.5 / TypeScript / Tailwind v4 / shadcn/ui） |
| ディレクトリ構成 | ✅ プランの「プロジェクト構成」どおりに作成 |
| DB スキーマ・RLS | ✅ ローカル Supabase に適用済み。RLS の通過/遮断を確認。**クラウドへの適用は未実施** |
| 認証（Email + Google） | ✅ Email サインアップ・`profiles` 自動作成・未ログインリダイレクトをローカルで検証済み。**Google OAuth は未設定・未検証** |
| 静的ページ `/privacy` `/support` | ✅ 骨子作成済み。文面・連絡先は TODO |
| 書籍 API クライアント | ✅ 実データで検証済み（OpenBD 系）。Google Books はキー無しだと 429 になりやすく、フォールバックで動く |
| M2 書籍登録 | ✅ `/books/add`（ISBN 検索 + タイトル・著者検索 + 手動入力）と `createUserBook` を実装・検証済み（#5 #6） |
| M2 自由記述検索 | ✅ `/books/search?q=` 一覧ページ。Google Books → 429 なら NDL サーチ + OpenBD 補完。書影が無い本は Google 書影配信で補完。登録済みバッジ付き |
| M2 一覧・詳細・メモ / M3 | 🟡 一覧は書影付き最小表示。詳細・メモ・ステータス遷移・統計は雛形 |
| ビルド・型・lint | ✅ `npm run build` / `tsc --noEmit` / `eslint` すべて通過（`gen:types` 生成物に対しても通過） |
| ローカル開発環境 | ✅ Docker Desktop + Supabase CLI で起動・検証済み。手順は `docs/LOCAL_DEV_SETUP.md` |
| git / GitHub | ✅ `main` で初回コミット済み。リモート: https://github.com/haino357/book_manager_web（private） |

---

## 環境・バージョン

| パッケージ | バージョン |
|---|---|
| Node.js / npm | 22.20.0 / 11.6.2 |
| next | 16.3.5 |
| react / react-dom | 19.2.8 |
| tailwindcss | ^4 |
| shadcn（style: radix-nova, baseColor: neutral） | ^4.21.0 |
| @supabase/supabase-js / @supabase/ssr | ^2.116.0 / ^0.12.7 |
| react-hook-form / @hookform/resolvers / zod | ^7.88.0 / ^5.9.1 / ^3.25.76 |
| react-markdown | ^10.1.0 |
| recharts | ^3.10.1 |
| supabase（CLI, devDependency） | ^2.117.0 |

### npm scripts

| コマンド | 内容 |
|---|---|
| `npm run dev` / `build` / `start` / `lint` | Next.js 標準 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run gen:types` | ローカル DB から `lib/types/database.ts` を再生成 |
| `npm run db:start` / `db:reset` / `db:push` | Supabase CLI（start は Docker 必須） |

---

## マイルストーン別の状況

### 着手前の条件（プラン記載）

- [ ] モバイル #24（エクスポート/インポート）を完了させ、JSON 形式を確定
- [ ] Cloudflare Registrar でドメイン取得
- [ ] #28 に Firebase → Supabase の方針変更コメント

いずれも本リポジトリ外の作業。未着手。

### M1：基盤 + 静的ページ

| プランの項目 | 状態 | 備考 |
|---|---|---|
| Supabase プロジェクト作成、CLI セットアップ | 🟡 | CLI 導入・`supabase init`・**ローカル Supabase 起動済み**（`npm run db:start`）。クラウド側のプロジェクト作成・`link` は未実施 |
| Next.js 16 初期化（TS + Tailwind v4） | ✅ | `create-next-app@latest`、`--no-src-dir`、import alias `@/*` |
| shadcn/ui 初期化、基本コンポーネント取得 | ✅ | button, card, input, label, textarea, tabs, badge, select, dialog, dropdown-menu, progress, separator, sonner, skeleton の 14 個。`form` は新 CLI で提供されず未取得 |
| `00001_init.sql` 適用、`supabase gen types` | ✅ | ローカルに適用し `npm run gen:types` で `lib/types/database.ts` を生成。手書きのリテラル型は `lib/types/enums.ts` に分離 |
| `proxy.ts` に Auth セッション更新、ログイン・サインアップ画面 | ✅ | ローカルで検証済み（`/books` 未ログイン → `/login?next=/books`、サインアップ → 即セッション発行） |
| `/privacy` `/support` 公開 → #37/#40 に URL 記載 | 🟡 | ページは作成済み。デプロイと URL 記載は M4 以降 |

### M2：蔵書 + メモ

| プランの項目 | 状態 | 備考 |
|---|---|---|
| Google Books / OpenBD クライアント、`/api/books/search` BFF | ✅ | 実データで検証。未ログインは 401（proxy で `/api/` はリダイレクトしない）。OpenBD の著者名解析を ONIX Contributor ベースに修正 |
| `/books/add` ISBN 検索 + 手動入力フォーム | ✅ | 3 タブ（ISBN / タイトル・著者 / 手動）。ISBN 検索 → プレビュー（書影・著者・出版社・カテゴリ）→ ステータス選択 → 登録。見つからなければ ISBN を引き継いで手動タブへ。手動は RHF + Zod、ISBN 無し可 |
| 自由記述検索 `/books/search`（プラン外・モバイル #7 相当） | ✅ | 検索欄は `/books/add` タブとヘッダーナビ「検索」から。結果カードでステータスを選んでそのまま登録。`books.source` に `ndl` を追加（`00002`） |
| `/books` 一覧（4 ステータスタブ） | 🟡 | タブ + 書影付き最小一覧、空状態から `/books/add` への導線。BookCard への切り出しは #7 |
| `/books/[id]` 詳細、6 種別メモ CRUD、action 完了トグル | 🟡 | 詳細の取得と表示のみ。メモ UI 未作成 |
| ステータス遷移 UI（日付自動セット、`reading_histories` 追加） | 🟡 | 登録時のみ実装: `reading` → `started_at` = 今日（JST）、`completed` → `completed_at` = 今日。遷移 UI と `reading_histories` は #9 |
| `/import`：#24 JSON → v2 スキーマ変換 | 🟡 | 変換ロジック（`lib/import/mobile-export.ts`）は暫定形で実装済み。UI と投入処理は未作成 |

### M3：評価 + 統計

| プランの項目 | 状態 |
|---|---|
| ★評価コンポーネント | ⬜ |
| `/dashboard` 月別読了数（棒） | ⬜（ページ雛形のみ） |
| ジャンル別分布（円） | ⬜ |
| 年間目標進捗バー | ⬜ |

### M4：公開

すべて未着手（Vercel デプロイ、Cloudflare DNS、Sentry、Lighthouse、Turnstile）。

---

## 作成したファイル

```
book_manager_web/
├── app/
│   ├── layout.tsx                    ✅ lang="ja"、Toaster 配置
│   ├── page.tsx                      ✅ トップ（ログイン / 新規登録 / 静的ページへの導線）
│   ├── (public)/
│   │   ├── layout.tsx                ✅ ヘッダー・フッター付き記事レイアウト
│   │   ├── privacy/page.tsx          ✅ 骨子。文面は TODO
│   │   └── support/page.tsx          ✅ 骨子。メール連絡先は TODO
│   ├── (auth)/
│   │   ├── layout.tsx                ✅
│   │   ├── login/page.tsx            ✅ 確認メール送信後 / エラー時のメッセージ表示
│   │   └── signup/page.tsx           ✅
│   ├── (dashboard)/
│   │   ├── layout.tsx                ✅ 認証チェック、ナビ、ログアウト
│   │   ├── books/page.tsx            🟡 ステータスタブ + 書影付き最小一覧 + 登録導線
│   │   ├── books/add/page.tsx        ✅ AddBook（ISBN / タイトル・著者 / 手動入力タブ）
│   │   ├── books/search/page.tsx     ✅ 自由記述検索の一覧（RSC。searchBooksByText + 登録済み照合）
│   │   ├── books/[id]/page.tsx       🟡 取得・表示のみ
│   │   ├── import/page.tsx           ⬜ 雛形
│   │   └── dashboard/page.tsx        ⬜ 雛形
│   ├── api/books/search/route.ts     ✅ ISBN 検索 BFF（認証必須）
│   └── auth/callback/route.ts        ✅ OAuth / メール確認コールバック
├── components/
│   ├── ui/                           ✅ shadcn/ui 14 個
│   ├── auth/auth-form.tsx            ✅ login / signup 共用フォーム（useActionState）
│   ├── books/add-book.tsx            ✅ 2 タブの親。検索失敗 → ISBN を引き継いで手動へ
│   ├── books/isbn-search-form.tsx    ✅ /api/books/search → プレビュー → createUserBook
│   ├── books/manual-book-form.tsx    ✅ React Hook Form + Zod（manualBookFormSchema）
│   ├── books/status-select.tsx       ✅ 4 ステータスの Select
│   ├── books/book-cover.tsx          ✅ 書影（外部 URL をそのまま <img>、無ければプレースホルダー）
│   ├── books/search-box.tsx          ✅ GET /books/search?q= の素の form（Server Component から使える）
│   ├── books/search-result-card.tsx  ✅ 結果 1 件 + StatusSelect + 登録 / 登録済みリンク
│   ├── memos/.gitkeep                ⬜
│   └── dashboard/.gitkeep            ⬜
├── lib/
│   ├── supabase/client.ts            ✅ Client Component 用
│   ├── supabase/server.ts            ✅ Server Component / Action / Route Handler 用
│   ├── supabase/proxy.ts             ✅ updateSession + 未ログインリダイレクト（PUBLIC_PATHS）
│   ├── books/types.ts                ✅ BookMetadata、ISBN 正規化・10→13 変換
│   ├── books/google-books.ts         ✅ 優先。categories 取得、http→https
│   ├── books/openbd.ts               ✅ 補完。ONIX ベースの著者整形、複数 ISBN 一括取得（fetchManyFromOpenBd）
│   ├── books/ndl.ts                  ✅ NDL サーチ OpenSearch（title → creator → any、RSS を正規表現で解析）
│   ├── books/text-search.ts          ✅ 自由記述検索の取得戦略（Google → NDL + OpenBD 補完、重複排除）
│   ├── books/search.ts               ✅ Google → OpenBD の取得戦略 + 書影が無ければ Google 書影配信
│   ├── books/google-cover.ts         ✅ ISBN → Google 書影配信 URL。プレースホルダー画像をハッシュで除外、並列 8 で補完
│   ├── books/schema.ts               ✅ Zod: bookMetadataSchema / createUserBookSchema / manualBookFormSchema、STATUS_LABELS、toPostgresDate
│   ├── import/mobile-export.ts       🟡 Zod スキーマ + ImportPlan 変換（#24 確定待ち）
│   ├── actions/auth.ts               ✅ signIn / signUp / Google / signOut
│   ├── actions/books.ts              🟡 createUserBook 実装済み。updateStatus / updateRating は #9 / #11
│   ├── actions/memos.ts              ⬜ 設計コメントのみ
│   ├── types/database.ts             ✅ `npm run gen:types` の生成物（手編集しない）
│   ├── types/enums.ts                ✅ BookStatus / BookSource / MemoType（check 制約と対応）
│   └── utils.ts                      ✅ shadcn 生成
├── proxy.ts                          ✅ Next.js 16（旧 middleware）
├── supabase/
│   ├── config.toml                   ✅ supabase init。site_url / redirect を localhost:3000 に修正
│   ├── migrations/00001_init.sql     ✅ 5 テーブル + トリガー + インデックス + RLS
│   ├── migrations/00002_books_source_ndl.sql ✅ books.source の check に 'ndl' を追加
│   └── seed.sql                      ✅ 書籍マスター 2 冊（ISBN を実在のものに修正済み）
├── .env.local                        ✅ ローカル Supabase の値を設定済み（git 管理外）
├── .env.local.example                ✅
├── CLAUDE.md                         ✅ 規約。@AGENTS.md を参照
├── AGENTS.md                         ✅ next dev が自動生成する Next.js 16 ガイド
├── README.md                         ✅ セットアップ手順
├── docs/PROGRESS.md                  ✅ 本ファイル
└── docs/LOCAL_DEV_SETUP.md           ✅ Docker + ローカル Supabase のセットアップ手順と検証記録
```

---

## プランからの差分・判断メモ

| 項目 | 内容 |
|---|---|
| shadcn CLI | v4 系でオプションが変わっていた（`--base-color` 廃止）。`--base radix --preset nova` で初期化し、style は `radix-nova`。`form` コンポーネントは提供されず、React Hook Form は直接使う |
| DB トリガー追加 | プランの SQL に加え、`user_books` / `book_memos` の `updated_at` 自動更新トリガーと、`auth.users` insert 時に `profiles` を自動作成するトリガーを追加 |
| RLS の `with check` | `for all` ポリシーに `with check` を明示（insert / update 時も所有者判定を強制） |
| `books (isbn13)` インデックス | unique 制約で自動作成されるため個別の `create index` は書かない |
| ステータス一覧のデフォルトタブ | `reading` |
| 認証リダイレクト | ログイン済みで `/login` `/signup` に来たら `/books` へ。未ログインで認証必須ページに来たら `/login?next=...` へ |
| `.gitignore` | `.env*` を無視しつつ `.env.local.example` は追跡。`supabase/.temp` `supabase/.branches` を無視 |
| リテラル型の置き場所 | DB は enum ではなく `check` 制約のため `gen types` の `Enums` は空になる。`BookStatus` / `BookSource` / `MemoType` は `lib/types/enums.ts` に置き、`lib/types/database.ts` は手編集しない |
| `config.toml` の Auth URL | 初期値 `127.0.0.1:3000` をアプリの `NEXT_PUBLIC_SITE_URL`（`localhost:3000`）に揃え、`additional_redirect_urls` に `/auth/callback` を追加 |
| 書籍の重複排除 | `books` に update ポリシーが無いため upsert は使わず、`isbn13` で select → 無ければ insert（23505 なら再 select）。既存行のメタデータは更新しない。`isbn13` NULL は常に insert |
| 登録済み判定 | `user_books` の `unique (user_id, book_id)` 違反（23505）は「すでに登録されています」+ 既存 `/books/[id]` へのリンクとして返す |
| 書影の表示 | ホストが Google Books / OpenBD / 手動入力で不定なので `next/image` は使わず `<img>`（`BookCover`）。`no-img-element` はその行だけ無効化 |
| Zod スキーマの置き場所 | `"use server"` ファイルは async 関数しか export できないため `lib/books/schema.ts` に置く |
| `published_date` | Google Books / OpenBD は `YYYY` `YYYY-MM` を返すことがあるので `toPostgresDate` で月日を 01 に補完して date 列へ |
| Google Books のクォータ | キー無しの共有クォータは 429（Queries per day 超過）になりやすい。OpenBD へフォールバックするので動くが、書影・カテゴリが欠ける。`GOOGLE_BOOKS_API_KEY` の設定を推奨 |
| OpenBD の著者名 | NDL 系データは `"渋川,よしき 辻,大志郎,1990-"`（人物はスペース、姓名・生年はカンマ）で従来のカンマ分割が壊れていた。ONIX `Contributor.PersonName` を優先し、`姓, 名, 生年-` → `姓名`（欧文は `名 姓`）に整形 |
| seed の ISBN | リーダブルコードは `9784873115658`、良いコード/悪いコードは `9784297127831` が正。旧 seed の ISBN は別の本（実用Go言語 / プロを目指す人のための TypeScript 入門）だった |
| 自由記述検索のソース | OpenBD にキーワード検索は無く、Google Books はキー無しだと 429 になるため、キー不要の NDL サーチ OpenSearch をフォールバックに採用。NDL は書影を返さないので OpenBD の複数 ISBN 取得で補完。`any` は関連度が低いので `title` と `creator` を並行して投げ、両方 0 件のときだけ `any` |
| 書影の補完 | Google Books API（クォータあり）とは別に、`books.google.com/books/content?vid=ISBN…` は API クォータを消費せず書影を返す。存在しない ISBN でも 200 で「画像なし」画像（1269B、sha256 先頭 `e3f8c414b288cbdf`）が返るため、サーバー側で取得してハッシュと 2KB 未満のサイズで除外し、本物だけ `coverUrl` に採用。起動後 1 回、実在しない ISBN を取ってプレースホルダーのハッシュを実測し差し替えに追従。NDL サーチの書影 API はサーバーからは 403 |
| NDL の XML 解析 | 依存を増やさず正規表現で `<item>` 内のタグを抜く（タグは入れ子にならない）。ISBN は `xsi:type="dcndl:ISBN"` の `dc:identifier`、件名は型無しの `dc:subject` |
| 検索欄の置き場所 | 検索欄は GET form（`SearchBox`）で `/books/add` のタブとヘッダー「検索」に置き、結果は `/books/search?q=` の RSC ページで描画。URL 共有・戻る操作が自然になる |
| dev サーバーと `lib/` の変更 | Turbopack が `lib/books/*` の変更を拾わないことがあった。Route Handler / RSC の挙動が古いままなら `npm run dev` を再起動する |
| `/api/` の未ログイン | proxy で `/login` にリダイレクトせず 401 JSON を返す（fetch 側で扱いやすくする） |
| `lib/import/mobile-export.ts` | モバイルの sqflite 構造から推定した暫定スキーマ。status の enum index は `0: unread, 1: reading, 2: completed`、memo type は `note, quote, summary, review, vocabulary, action` の順と仮定 |

---

## 検証済み / 未検証

### ローカル Supabase で検証済み（2026-09-12）

- Email サインアップ → 即セッション発行（ローカルは `enable_confirmations = false`）
- `auth.users` insert 時の `profiles` 自動作成トリガー
- `00001_init.sql` の適用、seed 2 冊の読み取り
- RLS：ログインユーザーの `user_books` insert 通過、anon の `user_books` select は 0 行
- `proxy.ts`：`/` `/login` `/signup` は 200、`/books` 未ログインは `/login` へ 307、`/api/books/search` 未ログインは 401
- `/api/books/search`：`9784873115658`（リーダブルコード）・ISBN-10 `4873115655`・ハイフン付きで取得、存在しない ISBN は 404。Google Books は 429 で OpenBD にフォールバック
- `createUserBook`（Server Action を HTTP で直接呼び出し）：既存 `books` 行の再利用、同じ本の再登録エラー + 既存 id、新規 ISBN 登録（`published_date` 2022-04 → 2022-04-01）、ISBN 無し 2 冊の連続登録、タイトル空・不正ステータスのバリデーション
- `/books?status=…` に登録した本が書影付きで並び、`/books/[id]` が 200、不明 id は 404
- 書影補完：ISBN 検索 2 件と「リーダブルコード」1 件で Google 書影 URL が付与、「Clean Architecture」20 件中 17 件に書影（残りは ISBN 無しかプレースホルダー判定）。20 件で約 2 秒
- `/books/search`：「リーダブルコード」1 件（登録済みバッジ）、「仙塲大也」2 件、「Clean Architecture」20 件、無意味語 0 件。Google 429 時の注記表示、結果カードからの登録（source=ndl）→ 詳細へ遷移、再検索で登録済みに変わる。未ログインは `/login` へ

### 未検証

- Google OAuth ログイン（ローカル・クラウドともプロバイダ未設定）
- メール確認リンク経由のログイン（クラウドでは `enable_confirmations` が有効になる）
- `GOOGLE_BOOKS_API_KEY` を設定した状態での Google Books 取得（categories・書影）
- `/books/add` `/books/search` のブラウザ操作（ISBN 検索 → プレビュー → 登録、手動タブへの引き継ぎ、検索結果からの登録）
- Google Books が使える状態での自由記述検索（書影・カテゴリ付きの結果、NDL との切り替え）

---

## 次にやること

1. ブラウザで `/books/add` と `/books/search` を確認し、#5 #6 をクローズ。クラウド適用時は `00002` も `db:push`
2. `GOOGLE_BOOKS_API_KEY` を取得して `.env.local` に設定（書影・カテゴリ取得のため）
3. M2 続き: #7 BookCard、#8 詳細・メモ CRUD、#9 ステータス遷移
4. クラウド Supabase プロジェクト作成 → `npx supabase link` → `npm run db:push`（M4 のデプロイ前まででよい）
5. Google OAuth のプロバイダ設定（ローカルは `config.toml` の `[auth.external.google]`、クラウドはダッシュボード）

---

## 更新履歴

- **2026-09-12** — プロジェクトフォルダ作成。Next.js 16.3.5 初期化、shadcn/ui 導入、ディレクトリ構成・マイグレーション SQL・Supabase クライアント・認証画面・静的ページ・書籍 API クライアント・インポート変換の雛形を作成。`build` / `typecheck` / `lint` 通過を確認。git 初期化。
- **2026-09-12** — 初回コミット（`1ee8159`）。GitHub に `haino357/book_manager_web` を private で作成し `main` を push。
- **2026-09-12** — ローカル開発環境を構築。Docker Desktop 起動確認 → `npm run db:start` でローカル Supabase 起動（マイグレーション・seed 適用）→ `.env.local` をローカル値に設定 → `config.toml` の Auth URL を `localhost:3000` に修正 → `npm run gen:types` で型生成し、手書きリテラル型を `lib/types/enums.ts` に分離。`typecheck` / `lint` 通過。Email サインアップ・`profiles` トリガー・RLS・未ログインリダイレクトを検証。手順を `docs/LOCAL_DEV_SETUP.md` に記録。
- **2026-09-12** — M2 書籍検索・登録を実装（#5 #6）。`lib/books/schema.ts`（Zod）、`lib/actions/books.ts` の `createUserBook`、`components/books/{add-book,isbn-search-form,manual-book-form,status-select,book-cover}.tsx`、`/books/add` ページ、`/books` 一覧の書影と登録導線。OpenBD の著者名解析を ONIX ベースに修正、`/api/` 未ログインを 401 に変更、seed の ISBN を実在のものに修正。Server Action を HTTP で直接呼んで登録・重複・ISBN 無し・バリデーションを検証、`typecheck` / `lint` 通過。
- **2026-09-12** — 自由記述検索を追加。`/books/search?q=` の一覧ページ（`SearchBox` / `SearchResultCard`）、`lib/books/text-search.ts`（Google Books → NDL サーチ + OpenBD 書影補完）、`lib/books/ndl.ts`、`google-books.ts` にキーワード検索と 429 検出、`openbd.ts` に複数 ISBN 取得。`/books/add` に「タイトル・著者で検索」タブ、ヘッダーに「検索」。`00002_books_source_ndl.sql` で `books.source` に `ndl` を追加しローカル適用。CLAUDE.md / README の記述を更新。
- **2026-09-12** — 書影の補完を追加。`lib/books/google-cover.ts`（Google 書影配信 URL、プレースホルダーをハッシュ判定で除外、並列補完）を `text-search.ts` と `search.ts` に組み込み。NDL 経由の検索結果と OpenBD に書影が無い ISBN 検索でも書影が出るようになった。CLAUDE.md の書影規約を更新。
