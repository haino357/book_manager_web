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
| 書籍 API クライアント | ✅ Google Books → OpenBD の実装済み。未検証 |
| M2 / M3 の各ページ | 🟡 雛形のみ（TODO コメント付き） |
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
| Google Books / OpenBD クライアント、`/api/books/search` BFF | ✅ | 実装済み。認証必須。未検証 |
| `/books/add` ISBN 検索 + 手動入力フォーム | ⬜ | ページ雛形のみ |
| `/books` 一覧（4 ステータスタブ） | 🟡 | タブと最小の一覧表示まで。BookCard 未作成 |
| `/books/[id]` 詳細、6 種別メモ CRUD、action 完了トグル | 🟡 | 詳細の取得と表示のみ。メモ UI 未作成 |
| ステータス遷移 UI（日付自動セット、`reading_histories` 追加） | ⬜ | `lib/actions/books.ts` に設計コメントのみ |
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
│   │   ├── books/page.tsx            🟡 ステータスタブ + 最小一覧
│   │   ├── books/add/page.tsx        ⬜ 雛形
│   │   ├── books/[id]/page.tsx       🟡 取得・表示のみ
│   │   ├── import/page.tsx           ⬜ 雛形
│   │   └── dashboard/page.tsx        ⬜ 雛形
│   ├── api/books/search/route.ts     ✅ ISBN 検索 BFF（認証必須）
│   └── auth/callback/route.ts        ✅ OAuth / メール確認コールバック
├── components/
│   ├── ui/                           ✅ shadcn/ui 14 個
│   ├── auth/auth-form.tsx            ✅ login / signup 共用フォーム（useActionState）
│   ├── books/.gitkeep                ⬜
│   ├── memos/.gitkeep                ⬜
│   └── dashboard/.gitkeep            ⬜
├── lib/
│   ├── supabase/client.ts            ✅ Client Component 用
│   ├── supabase/server.ts            ✅ Server Component / Action / Route Handler 用
│   ├── supabase/proxy.ts             ✅ updateSession + 未ログインリダイレクト（PUBLIC_PATHS）
│   ├── books/types.ts                ✅ BookMetadata、ISBN 正規化・10→13 変換
│   ├── books/google-books.ts         ✅ 優先。categories 取得、http→https
│   ├── books/openbd.ts               ✅ 補完。pubdate 整形、著者の役割表記除去
│   ├── books/search.ts               ✅ Google → OpenBD の取得戦略
│   ├── import/mobile-export.ts       🟡 Zod スキーマ + ImportPlan 変換（#24 確定待ち）
│   ├── actions/auth.ts               ✅ signIn / signUp / Google / signOut
│   ├── actions/books.ts              ⬜ 設計コメントのみ
│   ├── actions/memos.ts              ⬜ 設計コメントのみ
│   ├── types/database.ts             ✅ `npm run gen:types` の生成物（手編集しない）
│   ├── types/enums.ts                ✅ BookStatus / BookSource / MemoType（check 制約と対応）
│   └── utils.ts                      ✅ shadcn 生成
├── proxy.ts                          ✅ Next.js 16（旧 middleware）
├── supabase/
│   ├── config.toml                   ✅ supabase init。site_url / redirect を localhost:3000 に修正
│   ├── migrations/00001_init.sql     ✅ 5 テーブル + トリガー + インデックス + RLS
│   └── seed.sql                      ✅ 書籍マスター 2 冊
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
| `lib/import/mobile-export.ts` | モバイルの sqflite 構造から推定した暫定スキーマ。status の enum index は `0: unread, 1: reading, 2: completed`、memo type は `note, quote, summary, review, vocabulary, action` の順と仮定 |

---

## 検証済み / 未検証

### ローカル Supabase で検証済み（2026-09-12）

- Email サインアップ → 即セッション発行（ローカルは `enable_confirmations = false`）
- `auth.users` insert 時の `profiles` 自動作成トリガー
- `00001_init.sql` の適用、seed 2 冊の読み取り
- RLS：ログインユーザーの `user_books` insert 通過、anon の `user_books` select は 0 行
- `proxy.ts`：`/` `/login` `/signup` は 200、`/books` `/api/books/search` 未ログインは `/login` へ 307

### 未検証

- Google OAuth ログイン（ローカル・クラウドともプロバイダ未設定）
- メール確認リンク経由のログイン（クラウドでは `enable_confirmations` が有効になる）
- `/api/books/search` の実データ取得（ログイン後に ISBN `9784873119694` で確認予定）
- `/books` `/books/[id]` のブラウザ上での表示（関連テーブル取得クエリ）

---

## 次にやること

1. ブラウザで `/signup` → `/books` の一連の流れと `/api/books/search` を確認（プラン「Verification」の 1・2）
2. M2 着手（`/books/add` の ISBN 検索フォーム → `createUserBook` から）
3. クラウド Supabase プロジェクト作成 → `npx supabase link` → `npm run db:push`（M4 のデプロイ前まででよい）
4. Google OAuth のプロバイダ設定（ローカルは `config.toml` の `[auth.external.google]`、クラウドはダッシュボード）

---

## 更新履歴

- **2026-09-12** — プロジェクトフォルダ作成。Next.js 16.3.5 初期化、shadcn/ui 導入、ディレクトリ構成・マイグレーション SQL・Supabase クライアント・認証画面・静的ページ・書籍 API クライアント・インポート変換の雛形を作成。`build` / `typecheck` / `lint` 通過を確認。git 初期化。
- **2026-09-12** — 初回コミット（`1ee8159`）。GitHub に `haino357/book_manager_web` を private で作成し `main` を push。
- **2026-09-12** — ローカル開発環境を構築。Docker Desktop 起動確認 → `npm run db:start` でローカル Supabase 起動（マイグレーション・seed 適用）→ `.env.local` をローカル値に設定 → `config.toml` の Auth URL を `localhost:3000` に修正 → `npm run gen:types` で型生成し、手書きリテラル型を `lib/types/enums.ts` に分離。`typecheck` / `lint` 通過。Email サインアップ・`profiles` トリガー・RLS・未ログインリダイレクトを検証。手順を `docs/LOCAL_DEV_SETUP.md` に記録。
