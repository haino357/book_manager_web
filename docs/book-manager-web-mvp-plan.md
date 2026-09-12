---
title: 読書管理 Web MVP — 技術要素まとめと実装プラン
created: 2026-04-29
updated: 2026-09-12
tags: [book-manager, web-mvp, nextjs, supabase, cloudflare, vercel, flutter, knowledge-management, plan]
source: ~/.claude/plans/web-mvp-replicated-kahn.md
repo: https://github.com/haino357/book_manager_web
progress: ./PROGRESS.md
---

# 読書管理 Web MVP — 技術要素まとめと実装プラン

> [!info] このノートの位置づけ
> 2026-04-29 に Claude Code のプランモードで策定した初版を、**2026-09-12 に `haino357/book_manager`（Flutter）の実態と突き合わせて v2 に改訂**したもの。初版の原本は `~/.claude/plans/web-mvp-replicated-kahn.md`。初版からの差分は「[[#4 月版からの変更点]]」にまとめた。
>
> **同日、このプランに基づいて `haino357/book_manager_web` を作成し、M1 の雛形まで実装した（v2.1）。** 実装で確定した事項はこのノートに反映し、日々の進捗は [[PROGRESS]]（`docs/PROGRESS.md`）に記録する。

## Context

既存の **`haino357/book_manager`（Flutter モバイルアプリ）** に対し、Web 版を新規に作る。要件：

- **既存モバイルと DB / 認証を共有**：モバイルと Web で同じデータを参照する設計
- **技術スタック**：Next.js + TypeScript（React エコシステムを採用）
- **公開予定**：将来的に第三者公開・スケール耐性を最初から意識
- **MVP 機能**：蔵書登録 / ステータス管理 / 評価・感想 / 統計ダッシュボードの 4 つ全部

### モバイル側の実態（2026-09-12 時点、develop ブランチ）

| 項目 | 実態 |
|---|---|
| データ層 | **sqflite 直書き**（`lib/database/database_helper.dart`）。認証なし・完全ローカル |
| 状態管理 | hooks_riverpod + flutter_hooks |
| 書籍検索 | **Google Books API のみ**（`lib/services/book_search_service.dart`） |
| テーブル | `books` / `reading_histories`（再読履歴）/ `book_memos`（**6 種別のメモ**） |
| ステータス | `unread` / `reading` / `completed` |
| 最終コミット | 2026-03-02（#41 ボトムナビ、#42 AI コーディング規約） |
| 今の優先度 | P1 = #37 リリース情報収集・#40 プライバシーポリシー画面。P2 = #50 iOS 実機ビルド・#39 テスト・#32 デバッグログ |
| クラウド同期 | #28 が **Firebase/Firestore 前提**で long-term に置かれている |

Web 版は「Flutter のクローン」ではなく、**共有バックエンドが生まれる場所 ＋ ストア公開に必要な静的ページ（プライバシーポリシー・サポート）の置き場**と位置づける。

---

## 4 月版からの変更点

| 項目 | 4 月版 | v2（2026-09） | 理由 |
|---|---|---|---|
| バックエンド | Supabase 単独 | **Supabase（データ・認証）＋ Cloudflare（前段）の組み合わせ** | 役割が違うので両方使う。詳細は次節 |
| データモデル | `user_books.review text` 1 本 | **`book_memos`（6 種別）＋ `reading_histories`** を新設 | モバイルの構造を正とする |
| ステータス | want_to_read / reading / done | **wishlist / unread / reading / completed** | モバイルと同名にし、#52「欲しい本」#34「積読」を吸収 |
| 統計の根拠列 | なし（ジャンル・目標が実装不能だった） | `books.categories text[]`・`profiles.yearly_goal` を追加 | ジャンル別グラフ・年間目標進捗の根拠 |
| 書籍 API | OpenBD 優先 | **Google Books 優先、OpenBD フォールバック** | モバイルと同じ結果になり `categories` が取れる |
| Next.js | 15 | **16**（`middleware.ts` → `proxy.ts`） | 現行メジャー |
| Tailwind | 未指定 | **v4** | shadcn/ui も対応済み |
| TanStack Query / Zustand | 採用 | **MVP では入れない** | Server Components + Server Actions で足りる |
| Markdown エディタ | `@uiw/react-md-editor` | **textarea + `react-markdown`** | メモは短文中心 |
| Supabase Storage | 書影キャッシュ | **使わない** | API の URL をそのまま使う |
| 追加機能 | — | `/privacy` `/support`・`/import`（#24 形式） | #37/#40 を片づけ、手元データを即日載せる |
| モバイル連携 | Supabase 移行を漠然と後回し | **#24 エクスポート → `/import` → 後で `supabase_flutter`** の 2 段階 | リアルタイム同期を待たずに Web を実用化 |

---

## バックエンドの判断：Supabase ＋ Cloudflare の組み合わせ

> [!success] 決定（2026-09-12）
> **データと認証は Supabase、Cloudflare はその前段（Registrar / DNS / WAF、将来はホスティング）**。「どちらか」ではなく役割分担。

### なぜ Supabase がデータ・認証を持つか（モバイル視点）

| 観点 | Supabase | Cloudflare（Workers + D1）で代替した場合 |
|---|---|---|
| Flutter SDK | `supabase_flutter` 公式。Auth・DB・Realtime まで 1 パッケージ | 無い。自前 REST API を `http` で叩くクライアントを書く |
| エンドユーザー認証 | Supabase Auth 内蔵。Google / **Apple サインイン**（App Store 要件）・匿名→本アカウント連携 | 一般ユーザー向け認証が無い（Access は社内ゼロトラスト用）。better-auth 等を Workers に載せて自作、Flutter 側もトークン管理を手書き |
| アクセス制御 | RLS で DB 側が強制。**Web / Flutter から SDK 直叩きでよく API 層が不要** | Workers に API 層を書き、2 クライアント分の I/F を維持 |
| DB | Postgres。`text[]`・date 型・集計 SQL が素直 | D1 = SQLite。sqflite スキーマがほぼ 1:1 で移植できるのが唯一の技術的利点 |
| オフライン同期 | 内蔵なし。**PowerSync（Flutter + Supabase 公式対応）**という既製の選択肢あり | 内蔵なし。全部自前 |
| 無料枠の癖 | **1 週間アクセスが無いとプロジェクトが停止**（再開は手動）。毎日使えば実害なし | 停止なし |
| 有料化時 | Pro $25/月 | Workers Paid $5/月 |

決め手は「認証」と「API 層不要」。Web と Flutter の 2 クライアントを 1 人で維持する以上、**認証と権限チェックを自分で書かず、API 層も持たない**構成が時間対効果で勝つ。

### Cloudflare が担うもの

| 時期 | 役割 | 補足 |
|---|---|---|
| **今すぐ** | Registrar（ドメイン）・DNS・WAF | [[cloudflare-overview]] で採用済みの方針 |
| **任意** | Turnstile | Supabase Auth の CAPTCHA プロバイダとして設定可。公開後のサインアップ bot 対策 |
| **公開後** | Next.js のホスティングを Vercel → **Workers（`@opennextjs/cloudflare`）** に移して請求先を集約 | MVP 期は Vercel の方が最短で動く。移行は最適化フェーズ |

### 避ける構成

- **D1 ＋ Supabase Auth のような分割**：RLS が効かなくなり両者の利点が消える
- **Firebase との併用**：#28 の Firestore 前提は Supabase に書き換える（[[#既存 Flutter book_manager との連携設計]]）

### Cloudflare 単独に切り替えるべきケース（記録として残す）

Workers / D1 を学ぶこと自体が目的になった場合、第三者向け公開 API をどうせ出す場合、Supabase の無料枠停止や RLS ロックインが許容できなくなった場合。その際の構成は **Hono + D1 + Drizzle + better-auth on Workers**、Flutter は OpenAPI 生成クライアント。4 週間プランに対し 1〜2 週間分の追加コストになる。

---

## 推奨アーキテクチャ

```
                    ┌──────────────────────────────┐
                    │  Cloudflare                  │
                    │  Registrar / DNS / WAF       │ ← 前段。公開後は Workers でホスティングも
                    │  (Turnstile: 任意)           │
                    └──────────────┬───────────────┘
                                   │
┌─────────────────┐                │             ┌─────────────────┐
│  Next.js (Web)  │ ◀──────────────┘             │ Flutter (Mobile)│
│  Vercel hosted  │                              │  既存アプリ     │
└────────┬────────┘                              └────────┬────────┘
         │  @supabase/supabase-js + @supabase/ssr         │  supabase_flutter（Phase 2）
         └───────────────────┬───────────────────────────┘
                             ▼
                 ┌──────────────────────────┐
                 │       Supabase           │
                 │  PostgreSQL + RLS        │ ← 単一の真実の源
                 │  Auth (Email/Google/Apple)│
                 └────────────┬─────────────┘
                              ▼
                 ┌──────────────────────────┐
                 │  External Book APIs      │
                 │  - Google Books（優先）  │ ← モバイルと同じ。categories が取れる
                 │  - OpenBD（補完）        │ ← 日本書の書影・出版社
                 └──────────────────────────┘
```

**ポイント**：別途バックエンド API 層を作らず Supabase クライアント SDK を Web / モバイル両方から直接叩く。RLS でユーザー単位のアクセス制御を DB レベルで強制するため、API 層を省略しても安全。Cloudflare は通信の前段に立つだけで、データも認証も持たない。

---

## 技術スタック詳細

### Frontend (Web)

| カテゴリ | 採用 | 理由 |
|---|---|---|
| フレームワーク | **Next.js 16 (App Router)** — 実装は 16.3.5 | 現行メジャー。`middleware.ts` は **`proxy.ts`** に置き換わっている。ルートの `proxy.ts` から `lib/supabase/proxy.ts` の `updateSession` を呼ぶ形で実装済み。`PageProps<"/books">` 等の route 型は `next typegen` で生成される |
| 言語 | **TypeScript** | Supabase が型生成 CLI を提供 |
| スタイル | **Tailwind CSS v4** | CSS-first 設定。shadcn/ui と相性◎ |
| UI コンポーネント | **shadcn/ui**（CLI v4、style `radix-nova`、baseColor `neutral`） | コピーペーストで組み込み、Radix 基盤で a11y◎。CLI v4 では `--base-color` が廃止され `--base radix --preset nova` で初期化する。`form` コンポーネントは提供されなくなったので React Hook Form を直接使う |
| データ取得・更新 | **Server Components + Server Actions + `revalidatePath`** | 個人利用規模で楽観的更新は不要。TanStack Query / Zustand は必要になったら足す |
| フォーム | **React Hook Form + Zod** | バリデーション含めて型安全 |
| Markdown | **textarea + `react-markdown`** | メモ 6 種別は短文中心。専用エディタは過剰 |
| グラフ | **Recharts** | 統計ダッシュボード用 |

### Backend (BaaS)

| カテゴリ | 採用 | 理由 |
|---|---|---|
| BaaS | **Supabase** | PostgreSQL + Auth + RLS が無料枠で揃う |
| DB | **PostgreSQL（Supabase 内）** | リレーショナル。統計クエリが書きやすい |
| 認証 | **Supabase Auth** | Email/Password + Google OAuth。Apple サインインはモバイル統合時に追加 |
| アクセス制御 | **RLS Policies** | `auth.uid() = user_id`、子テーブルは `exists` で所有者判定 |
| 重ロジック | **Supabase Edge Functions** | 必要になったら（MVP では不要） |
| Storage | 使わない | 書影は外部 API の URL をそのまま保持 |

### External APIs

| API | 用途 | 料金 |
|---|---|---|
| **Google Books API** | 書籍メタデータ・`categories`・書影（モバイルと同じ） | 無料枠 1000 req/day |
| **OpenBD** (https://openbd.jp/) | Google Books で取れない日本書の補完（書影・出版社） | 無料・認証不要 |

**取得戦略**：ISBN 入力 → Google Books 試行 → 失敗または書影なしなら OpenBD → それでもなければ手動入力フォーム。

### Hosting / インフラ

| カテゴリ | 採用 | 無料枠 |
|---|---|---|
| Web ホスティング（MVP 期） | **Vercel** | 100GB BW / 月 |
| Web ホスティング（公開後・任意） | **Cloudflare Workers（OpenNext）** | 10 万 req/日。請求先集約が目的 |
| BaaS | **Supabase** | 500MB DB, Auth 5 万 MAU。**7 日無アクセスで停止**に注意 |
| ドメイン | **Cloudflare Registrar** | ~1500 円/年（.com） |
| DNS / WAF | **Cloudflare** | 無料 |

### 監視・分析

| ツール | 用途 |
|---|---|
| **Sentry** | エラートラッキング（無料枠 5K events/月） |
| **Vercel Analytics** | Web Vitals（無料） |
| **Supabase Logs** | DB クエリ・Auth イベントの監視（管理画面内） |

---

## データモデル（Supabase PostgreSQL・v2）

モバイルの `books` / `reading_histories` / `book_memos` を正とし、ユーザー軸を足した形。

```sql
-- Supabase Auth が auth.users を自動作成
-- 公開プロフィール用に拡張テーブル
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  is_public boolean default false,
  yearly_goal smallint,                      -- 年間読了目標（統計ダッシュボード用）
  created_at timestamptz default now()
);

-- グローバル書籍マスター（ISBN ベースで重複排除）
create table books (
  id uuid primary key default gen_random_uuid(),
  isbn13 text unique,                        -- NULL 可（手動登録・ISBN 無し本）。Postgres は NULL の重複を許す
  isbn10 text,
  title text not null,
  authors text[],
  publisher text,
  published_date date,
  cover_url text,
  description text,
  categories text[],                         -- Google Books volumeInfo.categories。ジャンル別グラフの根拠
  source text check (source in ('google_books', 'openbd', 'manual')),
  created_at timestamptz default now()
);

-- ユーザー × 書籍（読書記録の親）
create table user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  status text not null check (status in ('wishlist', 'unread', 'reading', 'completed')),
                                             -- wishlist = #52 欲しい本、unread = #34 積読、残りはモバイルと同名
  rating smallint check (rating between 1 and 5),   -- #16 星評価。モバイルは後追い
  started_at date,
  completed_at date,                         -- モバイルの列名 completed_at に合わせる
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, book_id)
);

-- 再読履歴（1 回の読書 = 1 行）。モバイルの reading_histories を写す
create table reading_histories (
  id uuid primary key default gen_random_uuid(),
  user_book_id uuid not null references user_books(id) on delete cascade,
  started_at date,
  completed_at date,
  created_at timestamptz default now()
);

-- メモ（6 種別）。モバイルの book_memos を写す。4 月版の user_books.review を置き換える
create table book_memos (
  id uuid primary key default gen_random_uuid(),
  user_book_id uuid not null references user_books(id) on delete cascade,
  type text not null check (type in ('note', 'quote', 'summary', 'review', 'vocabulary', 'action')),
  content text not null,                     -- Markdown
  page int,
  section text,
  is_completed boolean,                      -- type = 'action' の TODO 完了フラグ
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS 有効化
alter table profiles          enable row level security;
alter table books             enable row level security;
alter table user_books        enable row level security;
alter table reading_histories enable row level security;
alter table book_memos        enable row level security;

-- profiles: 自分の行は読み書き可、公開プロフィールは誰でも読める
create policy "own profile rw"      on profiles for all    using (auth.uid() = id);
create policy "public profile read" on profiles for select using (is_public = true);

-- books: 全員読める、認証ユーザーは追加可能
create policy "books read all"      on books for select using (true);
create policy "books insert authed" on books for insert with check (auth.role() = 'authenticated');

-- user_books: 自分の行のみ
create policy "own user_books all" on user_books for all using (auth.uid() = user_id);

-- 子テーブル: 親 user_books の所有者のみ
create policy "own histories all" on reading_histories for all using (
  exists (select 1 from user_books ub where ub.id = user_book_id and ub.user_id = auth.uid())
);
create policy "own memos all" on book_memos for all using (
  exists (select 1 from user_books ub where ub.id = user_book_id and ub.user_id = auth.uid())
);
```

> [!note] 実装での追加（`supabase/migrations/00001_init.sql` が正）
> 上記 SQL に加えて次を入れた。
> - `user_books` / `book_memos` の **`updated_at` 自動更新トリガー**（`set_updated_at()`）。#28 の last-write-wins の根拠列なので DB 側で保証する
> - **`auth.users` insert 時に `profiles` 行を自動作成するトリガー**（`handle_new_user()`、`security definer`）。Google サインインの `full_name` / `avatar_url` を初期値に使う
> - `for all` の RLS ポリシーに **`with check` を明示**。`using` だけでは insert / update 時の所有者判定が抜ける
> - `reading_histories (user_book_id)` インデックスを追加

**インデックス**：
- `user_books (user_id, status)` — ステータス別一覧
- `user_books (user_id, completed_at)` — 月次統計
- `book_memos (user_book_id, type)` — 詳細画面の種別タブ
- `reading_histories (user_book_id)` — 詳細画面の再読履歴
- `books (isbn13)` — ISBN 検索。`unique` 制約で自動作成されるため個別の `create index` は書かない

**モバイル移行時の注意**：モバイルの `book_memos.id` / `reading_histories.id` は INTEGER 自動採番。移行時に uuid を振り直す変換が要る（#24 の変換ロジックに乗せる）。`status` は INTEGER（enum index）なので文字列へのマッピングも #24 側で行う。

---

## MVP 機能スコープ（マイルストーン再編）

4 機能は残し、順番と厚さを変える。**M2 完了時点で自分用としては使い始められる**ようにする。

| M | 内容 | 終わったと言える状態 |
|---|---|---|
| **M1 基盤 + 静的ページ** | Supabase プロジェクト・マイグレーション・RLS・Auth（Email + Google）、`/privacy` `/support` | ログインできる。**#37/#40 で必要な URL が確定する** |
| **M2 蔵書 + メモ（モバイル同等）** | ISBN 検索（Google Books → OpenBD）、手動登録、一覧（ステータスタブ）、詳細、**6 種別メモ**、ステータス遷移で日付自動セット、`/import`（#24 形式） | 手元の本が全部 Web に載っていて、モバイルと同じことができる |
| **M3 評価 + 統計** | ★評価、月別読了数（棒）、ジャンル別（`categories[1]` で分類・円）、年間目標進捗バー | 4 月版の MVP 機能が揃う |
| **M4 公開** | Vercel デプロイ・Cloudflare ドメイン接続・Sentry・Lighthouse 80+ | 第三者に URL を渡せる |

**Phase 2（公開フェーズで追加）**：
- 公開プロフィール `/u/[username]`
- タグ機能（#21）・お気に入り（#23）
- ソーシャル共有（#29）・読書会機能
- Cloudflare Workers へのホスティング移行・Turnstile

---

## プロジェクト構成

別リポジトリ **https://github.com/haino357/book_manager_web**（private、`main`）。2026-09-12 時点の実際の構成。

```
book_manager_web/
├── app/
│   ├── page.tsx                 ← トップ（ログイン / 新規登録 / 静的ページへの導線）
│   ├── (public)/
│   │   ├── layout.tsx           ← ヘッダー・フッター付き記事レイアウト
│   │   ├── privacy/page.tsx     ← プライバシーポリシー（#40 用）※文面 TODO
│   │   └── support/page.tsx     ← サポート連絡先（#37 用）※メール連絡先 TODO
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx       ← 確認メール送信後 / エラー時のメッセージ表示
│   │   └── signup/page.tsx
│   ├── (dashboard)/             ← 認証必須ページ（layout で getUser → 未ログインは /login）
│   │   ├── layout.tsx           ← ナビ（蔵書 / 登録 / 統計 / インポート）+ ログアウト
│   │   ├── books/
│   │   │   ├── page.tsx         ← 一覧（4 ステータスタブ、最小実装）
│   │   │   ├── add/page.tsx     ← 登録（M2 で実装。雛形）
│   │   │   └── [id]/page.tsx    ← 詳細（取得・表示のみ。メモ UI は M2）
│   │   ├── import/page.tsx      ← #24 JSON の取り込み（M2 で実装。雛形）
│   │   └── dashboard/page.tsx   ← 統計（M3 で実装。雛形）
│   ├── api/books/search/route.ts ← Google Books / OpenBD プロキシ（認証必須、API キーを隠す）
│   ├── auth/callback/route.ts   ← OAuth / メール確認のコールバック（exchangeCodeForSession）
│   └── layout.tsx               ← lang="ja"、sonner の Toaster
├── components/
│   ├── ui/                      ← shadcn/ui 14 個（button card input label textarea tabs badge select dialog dropdown-menu progress separator sonner skeleton）
│   ├── auth/auth-form.tsx       ← login / signup 共用（useActionState）
│   ├── books/                   ← M2
│   ├── memos/                   ← M2
│   └── dashboard/               ← M3
├── lib/
│   ├── supabase/
│   │   ├── client.ts            ← createBrowserClient
│   │   ├── server.ts            ← createServerClient（cookies() を await）
│   │   └── proxy.ts             ← updateSession + 未ログインリダイレクト（PUBLIC_PATHS で公開パス管理）
│   ├── books/
│   │   ├── types.ts             ← BookMetadata、ISBN 正規化・10→13 変換
│   │   ├── google-books.ts      ← 優先。categories 取得、書影を https に寄せる
│   │   ├── openbd.ts            ← 補完。pubdate 整形、著者の役割表記を除去
│   │   └── search.ts            ← 取得戦略（Google → 書影なしなら OpenBD で補完）
│   ├── import/
│   │   └── mobile-export.ts     ← #24 形式 → v2 スキーマ変換（Zod）。status int → text、memo type int → text。#24 確定待ちの暫定形
│   ├── actions/
│   │   ├── auth.ts              ← signIn / signUp / Google OAuth / signOut
│   │   ├── books.ts             ← M2（設計コメントのみ）
│   │   └── memos.ts             ← M2（設計コメントのみ）
│   ├── types/database.ts        ← 00001_init.sql と手動同期した仮の型。`npm run gen:types` で上書きする
│   └── utils.ts                 ← shadcn 生成（cn）
├── proxy.ts                     ← Next.js 16（旧 middleware.ts）。updateSession を呼ぶだけ
├── supabase/
│   ├── config.toml              ← supabase init
│   ├── migrations/00001_init.sql ← v2 スキーマ + トリガー + インデックス + RLS
│   └── seed.sql                 ← 書籍マスター 2 冊（ローカル開発用）
├── docs/
│   ├── book-manager-web-mvp-plan.md ← 本ノート
│   └── PROGRESS.md              ← 進捗スナップショット
├── CLAUDE.md                    ← 規約。@AGENTS.md（next dev が生成する Next.js 16 ガイド）を参照
├── README.md                    ← セットアップ手順
├── .env.local.example           ← 追跡対象
└── .env.local                   ← Supabase URL / Anon Key / GOOGLE_BOOKS_API_KEY / NEXT_PUBLIC_SITE_URL（git 管理外）
```

**npm scripts**：`dev` / `build` / `lint` / `typecheck` に加え、`gen:types`（ローカル DB から型生成）、`db:start` / `db:reset` / `db:push`（Supabase CLI）。

---

## 既存 Flutter book_manager との連携設計

### 2 段階で進める

```
段階 1（M2 で成立）
  #24 エクスポート(JSON) → Web /import → Supabase       手動だが即日使える

段階 2（Web 公開後）
  #28 を「Supabase 接続」に書き換え → supabase_flutter 導入 → 双方向同期
```

### データ層の統一（段階 2）

| プラットフォーム | SDK | 認証共有 |
|---|---|---|
| Web (Next.js) | `@supabase/supabase-js` v2 + `@supabase/ssr` | ✅ 同じ Auth プロジェクト |
| Mobile (Flutter) | `supabase_flutter` | ✅ 同じ Auth プロジェクト。Apple サインインをここで追加 |

### モバイル側の改修（#28 の書き換え内容）

Issue #28 の Firebase 固有項目を Supabase 相当に置き換える：

| #28 現行（Firebase） | 置き換え |
|---|---|
| FlutterFire CLI・`firebase_core` `firebase_auth` `cloud_firestore` | `supabase_flutter` 1 パッケージ |
| Firestore データ構造の設計 | **不要**。本ノートの v2 スキーマに接続 |
| Firestore 組み込みオフラインキュー | 自前（sqflite をローカルキャッシュにして差分同期）または **PowerSync** 導入 |
| 競合解決ポリシー | `updated_at` による last-write-wins（MVP） |
| Google / Apple / 匿名サインイン | Supabase Auth で同等に対応 |

オフラインキューを自前で持つことが Supabase 選択の代償。ここが重ければ PowerSync を検討する。

### モバイルの Issue との対応

| Issue | Web 側での扱い |
|---|---|
| #37 リリース情報収集 | `/privacy` `/support` の URL を提供 |
| #40 プライバシーポリシー画面 | Web の `/privacy` を WebView かリンクで開く |
| #24 エクスポート/インポート | **Web 着手前に先に終える**。`/import` の入力形式がここで確定する |
| #28 クラウド同期 | Firebase → Supabase に方針変更コメントを入れる |
| #16 星評価・#20 統計・#34 積読・#52 欲しい本 | v2 スキーマに列を先行して用意。モバイルは後追い |

---

## 実装ロードマップ（週末作業ベース）

### 着手前の条件
- [ ] モバイル #24（エクスポート/インポート）を完了させ、JSON 形式を確定
- [ ] Cloudflare Registrar でドメイン取得（DNS は Cloudflare）
- [ ] #28 に Firebase → Supabase の方針変更コメント

### M1：基盤 + 静的ページ（2026-09-12 着手）
- [ ] Supabase プロジェクト作成、`supabase` CLI セットアップ — CLI 導入・`supabase init` 済み。**クラウド側のプロジェクト作成と `link` が未実施**
- [x] Next.js 16 プロジェクト初期化（`create-next-app` + TypeScript + Tailwind v4）— 16.3.5
- [x] shadcn/ui 初期化、基本コンポーネント取得 — radix-nova、14 個
- [ ] `00001_init.sql`（v2 スキーマ + RLS + インデックス）適用、`supabase gen types` — SQL は作成済み。**適用と型生成が未実施**（型は手書きの仮版）
- [x] `proxy.ts` に Auth セッション更新、ログイン・サインアップ画面（Email + Google）— 実装済み。Supabase 未接続のため**動作未検証**
- [ ] `/privacy` `/support` を静的ページで公開 → #37/#40 に URL を記載 — ページは作成済み。公開と URL 記載は M4 で
- [x] リポジトリ作成・初回 push（`haino357/book_manager_web`、private）
- [x] `npm run build` / `tsc --noEmit` / `eslint` 通過

### M2：蔵書 + メモ
- [x] Google Books / OpenBD クライアント、`/api/books/search` BFF — 実装済み、未検証
- [ ] `/books/add` ISBN 検索 + 手動入力フォーム — 雛形のみ
- [ ] `/books` 一覧（wishlist / unread / reading / completed タブ）— タブと最小一覧まで。BookCard 未作成
- [ ] `/books/[id]` 詳細、6 種別メモの CRUD、`action` 型の完了トグル — 取得・表示のみ
- [ ] ステータス遷移 UI（reading → started_at、completed → completed_at と `reading_histories` 追加）— `lib/actions/books.ts` に設計コメントのみ
- [ ] `/import`：#24 JSON を v2 スキーマに変換して取り込み — 変換ロジックは暫定実装済み。UI と投入処理が未着手

### M3：評価 + 統計
- [ ] ★評価コンポーネント
- [ ] `/dashboard` 月別読了数（棒グラフ）
- [ ] ジャンル別分布（`categories[1]`、円グラフ）
- [ ] 年間目標進捗バー（`profiles.yearly_goal`）

### M4：公開
- [ ] Vercel デプロイ、Cloudflare DNS でドメイン接続
- [ ] Sentry 連携、Lighthouse 80+ 確認
- [ ] （任意）Turnstile を Supabase Auth の CAPTCHA に設定

---

## コスト見積もり（MVP 期）

| 項目 | 月額 |
|---|---|
| Vercel Hobby | 無料 |
| Supabase Free | 無料（**7 日無アクセスで停止**。毎日使えば問題なし） |
| Cloudflare DNS / WAF | 無料 |
| ドメイン (.com, Cloudflare Registrar) | ~125 円/月（年 1500 円） |
| Sentry Developer | 無料 |
| **合計** | **~125 円/月** |

スケール時の目安：
- Supabase Pro $25/月 → DB 8GB, 10 万 MAU、停止なし
- Vercel Pro $20/月 → BW/SSR 制限緩和。または Cloudflare Workers Paid $5/月 に移行して請求先を集約

---

## Verification（検証方法）

1. **認証フロー**
   - `npm run dev` → `/signup` でメール登録 → 認証メール → ログイン
   - Google OAuth ログイン
2. **静的ページ**
   - 未ログインで `/privacy` `/support` が表示される
3. **書籍登録**
   - `/books/add` → ISBN `9784873119694` 入力 → Google Books からメタデータ・`categories` 取得 → 保存
   - 手動入力で ISBN 無しの本を登録（`isbn13` NULL で重複エラーが出ないこと）
4. **ステータス管理**
   - 一覧で「積読」→「読書中」→「読了」と遷移、`started_at` / `completed_at` が自動記録、`reading_histories` に 1 行増える
5. **メモ**
   - 詳細画面で quote / action を追加、action の完了トグル、Markdown がレンダリングされる
6. **インポート**
   - モバイル #24 の JSON を `/import` に投入 → 冊数・メモ数が一致
7. **評価・統計**
   - ★4 を保存、`/dashboard` で月別グラフ・ジャンル別・目標進捗バー表示
8. **RLS**
   - 別アカウントでログインし、他人の `user_books` / `book_memos` が一切見えないことを Supabase 管理画面の SQL でも確認
9. **品質チェック**
   - `npm run build` 通る
   - Lighthouse Performance / A11y / Best Practices / SEO 各 80+
   - Sentry にテストエラーが届く

---

## 重要ファイル（実装時に参照）

- `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts` — Server/Client 両対応 + セッション更新。公開パスは `proxy.ts` 内の `PUBLIC_PATHS`
- `proxy.ts` — Next.js 16 の旧 middleware。`@supabase/ssr` の `updateSession` を呼ぶ
- `supabase/migrations/00001_init.sql` — v2 スキーマ + トリガー + RLS + インデックス（**データモデルの正**）
- `lib/books/google-books.ts`, `lib/books/openbd.ts`, `lib/books/search.ts` — 外部 API ラッパーと取得戦略（優先順はこの順）
- `lib/books/types.ts` — `BookMetadata` と ISBN 正規化
- `lib/import/mobile-export.ts` — #24 形式 → v2 スキーマ変換。enum index の対応表（status: 0 unread / 1 reading / 2 completed、memo type: note quote summary review vocabulary action の順）は**モバイル側の enum 定義で要確認**
- `lib/actions/auth.ts` — 認証の Server Actions
- `app/api/books/search/route.ts` — ISBN 検索 BFF
- `app/auth/callback/route.ts` — OAuth / メール確認コールバック。Supabase の Redirect URLs に登録する
- `lib/types/database.ts` — `supabase gen types typescript` で自動生成（現状は手書きの仮版）
- `docs/PROGRESS.md` — 進捗スナップショット

---

## Sources

- [Build a User Management App with Next.js | Supabase Docs](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Use Supabase with Next.js | Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Next.js + Supabase vs Firebase: 2026 MVP Tech Stack Guide](https://propeliustech.com/blogs/nextjs-supabase-vs-firebase-mvp-tech-stack-2026/)
- [Supabase Auth with Next.js: Step-by-Step Setup Guide](https://www.zestminds.com/blog/supabase-auth-nextjs-setup-guide/)
- [The Backend Battle of 2026: Firebase vs. Supabase](https://www.tekingame.ir/en/blog/firebase-vs-supabase-2026-comparison-nextjs-architecture-pricing-vector-db-ar)
- `haino357/book_manager` develop ブランチ（`lib/database/database_helper.dart`、`lib/models/*.dart`、Issue #16 #24 #28 #34 #37 #40 #52）— v2 のデータモデルと連携設計の根拠
- [[cloudflare-overview]] — Cloudflare の役割分担（Registrar / DNS / WAF、Pages/Workers への集約案）

---

## 更新履歴

このファイルへの変更はここに append-only で記録する。

- **2026-04-29** — Claude Code プランモードで策定した内容を `~/.claude/plans/web-mvp-replicated-kahn.md` から本リポジトリの knowledge-management 配下に複製。フロントマターと更新履歴を追加。
- **2026-09-12** — v2 改訂。`haino357/book_manager` の実態（sqflite・6 種別メモ・再読履歴・Google Books のみ・#28 が Firebase 前提）と突き合わせ、(1) バックエンドを **Supabase（データ・認証）＋ Cloudflare（前段）の組み合わせ**に決定、(2) データモデルにモバイルの `book_memos` / `reading_histories` を写し `categories` / `yearly_goal` / `rating` を追加、(3) ステータスを wishlist / unread / reading / completed に変更、(4) `/privacy` `/support` `/import` を追加して #37 #40 #24 と連動、(5) Next.js 16 / Tailwind v4 に更新し TanStack Query・Zustand・Storage を MVP から除外、(6) ロードマップを M1〜M4 に再編。
- **2026-09-12** — v2.1。本プランに基づいて **`haino357/book_manager_web` を作成**（private、初回コミット `1ee8159`）し、本ノートを `docs/` に複製。実装で確定した事項を反映：(1) Next.js 16.3.5、shadcn CLI v4（`radix-nova`、`form` 非提供）、(2) `00001_init.sql` に `updated_at` トリガー・`profiles` 自動作成トリガー・RLS の `with check`・`reading_histories` インデックスを追加、(3) プロジェクト構成を実ファイルに合わせて更新（`app/auth/callback`、`lib/books/search.ts` `types.ts`、`lib/actions/*`、`docs/`）、(4) ロードマップ M1 / M2 に進捗を記入。Supabase クラウド側の作成・マイグレーション適用・型生成・認証の動作確認は未実施。進捗の詳細は `docs/PROGRESS.md`。
