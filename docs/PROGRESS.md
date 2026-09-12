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
| DB スキーマ・RLS | ✅ SQL 作成済み。**Supabase への適用は未実施** |
| 認証（Email + Google） | ✅ 画面・Server Action・コールバック作成済み。**Supabase プロジェクト未接続のため未検証** |
| 静的ページ `/privacy` `/support` | ✅ 骨子作成済み。文面・連絡先は TODO |
| 書籍 API クライアント | ✅ Google Books → OpenBD の実装済み。未検証 |
| M2 / M3 の各ページ | 🟡 雛形のみ（TODO コメント付き） |
| ビルド・型・lint | ✅ `npm run build` / `tsc --noEmit` / `eslint` すべて通過 |
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
| Supabase プロジェクト作成、CLI セットアップ | 🟡 | CLI 導入・`supabase init` 済み。**クラウド側のプロジェクト作成・`link` は未実施** |
| Next.js 16 初期化（TS + Tailwind v4） | ✅ | `create-next-app@latest`、`--no-src-dir`、import alias `@/*` |
| shadcn/ui 初期化、基本コンポーネント取得 | ✅ | button, card, input, label, textarea, tabs, badge, select, dialog, dropdown-menu, progress, separator, sonner, skeleton の 14 個。`form` は新 CLI で提供されず未取得 |
| `00001_init.sql` 適用、`supabase gen types` | 🟡 | SQL は作成済み。**適用と型生成は未実施**。`lib/types/database.ts` は SQL と手動同期した仮の型 |
| `proxy.ts` に Auth セッション更新、ログイン・サインアップ画面 | ✅ | 実装済み。Supabase 未接続のため動作未検証 |
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
│   ├── types/database.ts             🟡 手書きの仮型。gen types で上書き予定
│   └── utils.ts                      ✅ shadcn 生成
├── proxy.ts                          ✅ Next.js 16（旧 middleware）
├── supabase/
│   ├── config.toml                   ✅ supabase init
│   ├── migrations/00001_init.sql     ✅ 5 テーブル + トリガー + インデックス + RLS
│   └── seed.sql                      ✅ 書籍マスター 2 冊
├── .env.local                        🟡 空の値。要記入（git 管理外）
├── .env.local.example                ✅
├── CLAUDE.md                         ✅ 規約。@AGENTS.md を参照
├── AGENTS.md                         ✅ next dev が自動生成する Next.js 16 ガイド
├── README.md                         ✅ セットアップ手順
└── docs/PROGRESS.md                  ✅ 本ファイル
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
| `lib/import/mobile-export.ts` | モバイルの sqflite 構造から推定した暫定スキーマ。status の enum index は `0: unread, 1: reading, 2: completed`、memo type は `note, quote, summary, review, vocabulary, action` の順と仮定 |

---

## 未検証事項

Supabase プロジェクトに未接続のため、以下は実装済みだが動作確認していない。

- Email サインアップ → 確認メール → ログイン
- Google OAuth ログイン（プロバイダ設定・Redirect URL 登録が必要）
- `proxy.ts` のセッション更新とリダイレクト
- `00001_init.sql` の適用（構文・RLS の挙動）
- `/api/books/search` の実データ取得（ISBN `9784873119694` で確認予定）
- `/books` `/books/[id]` のクエリ（Supabase の関連テーブル取得）

---

## 次にやること

1. Supabase プロジェクト作成 → `.env.local` に URL / anon key を記入
2. `npx supabase link --project-ref <ref>` → `npm run db:push`
3. `npx supabase gen types typescript --linked > lib/types/database.ts` で仮型を上書き
4. Supabase ダッシュボード > Authentication > URL Configuration に `http://localhost:3000/auth/callback` を登録
5. `npm run dev` でプラン「Verification」の 1（認証）・2（静的ページ）を確認
6. M2 着手（`/books/add` の ISBN 検索フォーム → `createUserBook` から）

---

## 更新履歴

- **2026-09-12** — プロジェクトフォルダ作成。Next.js 16.3.5 初期化、shadcn/ui 導入、ディレクトリ構成・マイグレーション SQL・Supabase クライアント・認証画面・静的ページ・書籍 API クライアント・インポート変換の雛形を作成。`build` / `typecheck` / `lint` 通過を確認。git 初期化。
- **2026-09-12** — 初回コミット（`1ee8159`）。GitHub に `haino357/book_manager_web` を private で作成し `main` を push。
