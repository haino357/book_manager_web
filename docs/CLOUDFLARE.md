# Cloudflare への移行の調査と、このアプリで必要なこと

2026-10-04 時点の調査。本番のホスティングとその周辺（ドメイン・WAF・ボット対策・メール・定期実行・計測）を Cloudflare に寄せる前提で、外部の情報とこのリポジトリのコードを突き合わせた。

## 前提と結論

- **DB と認証は Supabase のまま**にする。RLS で守り、Web とモバイルから SDK を直接呼ぶ構成（`../book-manager-web-mvp-plan.md` の「バックエンドの判断」）は変えない。D1 + 自前の認証に置き換えると API 層と Flutter 側の作り直しが要る
- **Next.js のホスティングを Vercel から Cloudflare Workers に移す**。アダプターは **OpenNext（`@opennextjs/cloudflare`）**を使う
- Workers は **Paid プラン（$5/月）が実質必須**。Free は 1 リクエストあたりの CPU 時間が 10ms で、認証つきの SSR はこれを超えやすい（超えると Error 1102）
- 一番のリスクは `proxy.ts`。OpenNext での対応がまだ実験的で、Sentry と組み合わせたときのビルド失敗が報告されている（下の「リスク」）。**本番の作業に入る前に、短い検証（スパイク）で動くかを確かめる**

## Cloudflare で使うもの

| 用途 | Cloudflare のサービス | 今の予定 | 関係する Issue |
|---|---|---|---|
| Next.js のホスティング | Workers + OpenNext | Vercel | #15 |
| ドメイン・DNS・WAF | Registrar / DNS / WAF | 変更なし（もともと Cloudflare） | #15 |
| サインアップのボット対策 | Turnstile（Supabase Auth の CAPTCHA） | 変更なし | #19 |
| 認証メールの送信（カスタム SMTP） | Email Service（SMTP） | Resend / SendGrid / SES から選ぶ予定だった | #35 |
| 定期実行（おすすめの通知など） | Cron Triggers | 未定 | #32 |
| アクセス計測 | Web Analytics | Vercel Analytics | #17 |
| エラー監視 | なし（Sentry のまま） | 変更なし | #16 |

## ホスティングのアダプターの選び方

| | OpenNext（`@opennextjs/cloudflare`） | vinext |
|---|---|---|
| 中身 | Next.js のビルド結果を Workers 用に変換する | Vite で Next.js の API を作り直した別実装 |
| Next.js 16 | 16 のすべての minor / patch に対応。最新は 1.20.8（2026-10-02） | Next.js 16 の API の 94% に対応。ベータ |
| ビルド時の静的生成 | できる | できない（最初のリクエストで生成して ISR でキャッシュ） |
| 判断 | **採用する** | 見送る。このアプリは `next build` と Turbopack を前提にしており、別実装に乗り換える利点が薄い |

Cloudflare の Next.js ガイドは今は vinext を先に勧めているが、OpenNext のガイドも並んで残っている。

## リスク: `proxy.ts`（Node.js ミドルウェア）

Next.js 16 の `proxy.ts` は Node.js ランタイムで動く。OpenNext は 1.20.3（2026-08-26）でこれに対応したが、**実験的な扱い**で、互換フラグ `nodejs_compat` が要る。

さらに、このアプリと同じ組み合わせ（Next.js 16.3.5 + `@sentry/nextjs` + `proxy.ts`）で、ビルドが `Could not resolve "@opentelemetry/api"` で失敗する不具合が報告されている（opennextjs-cloudflare#1400、2026-09-25 時点で未解決）。このリポジトリも `@sentry/nextjs@11.1.0` 経由で `@opentelemetry/api@1.9.1` が入っているので、当たる可能性が高い。

対応の候補（スパイクで上から試す）:

1. 最新の OpenNext で `proxy.ts` のままビルドしてみる（#1400 が直っていればこれで済む）
2. `proxy.ts` を Edge ランタイムの `middleware.ts` に戻す。中身は `@supabase/ssr` のセッション更新と未ログイン時のリダイレクトだけで Edge でも動くし、`sentry.edge.config.ts` もある。ただし `middleware.ts` は Next.js 16 で非推奨なので、#1400 が直ったら `proxy.ts` に戻す
3. #1400 が直るまで移行を待つ（その間は Vercel で公開する）

## このアプリで必要な変更

### OpenNext の導入（コード）

- [ ] `@opennextjs/cloudflare` と `wrangler`（devDependencies）を追加する
- [ ] `wrangler.jsonc` を追加する
  - `main: ".open-next/worker.js"`、`assets`（`.open-next/assets`、binding `ASSETS`）、`services`（`WORKER_SELF_REFERENCE`）
  - `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`
  - `compatibility_date` は **2025-08-16 以降**（Sentry が送信に使う `https.request` がこの日付から入る）
- [ ] `open-next.config.ts` を追加する。キャッシュは下の「キャッシュ」の方針にする
- [ ] `package.json` に `preview` / `deploy` / `upload` / `cf-typegen` を足す（`opennextjs-cloudflare build && opennextjs-cloudflare preview` など）
- [ ] `next.config.ts` で `initOpenNextCloudflareForDev()` を呼ぶ。Vercel 前提のコメントを直す
- [ ] `.gitignore` に `.open-next` を、`.dev.vars` に `NEXTJS_ENV=development` を入れる
- [ ] `public/_headers` で `/_next/static/*` に長いキャッシュを付ける
- [ ] CI（`.github/workflows/ci.yml`）に `opennextjs-cloudflare build` を足すか決める。Workers で動かないコードをマージ前に見つけられる

### そのまま動く見込みのもの（`npm run preview` で確かめる）

| 箇所 | 理由 |
|---|---|
| `lib/books/google-cover.ts` の `node:crypto`（`createHash`） | `nodejs_compat` で使える |
| `app/opengraph-image.tsx` / `app/apple-icon.tsx` の `next/og` | OpenNext で動く。今はどれも静的に生成される |
| 書影の表示（`components/books/book-cover.tsx`） | `next/image` ではなく `<img>` なので、Cloudflare Images は要らない |
| `export const runtime = "edge"` | 使っていない（OpenNext は Edge ランタイムのルートに対応していない） |
| 外部 API（Google Books・OpenBD・楽天・NDL）と Supabase への通信 | どれも `fetch` なので Workers から呼べる |

### キャッシュ

- ほとんどのページは動的（SSR + Server Actions）なので、キャッシュの設定なしで動く
- 静的に生成されるページ（`/terms` `/privacy` `/support` `/signup` など）は、**Workers Static Assets を読み取り専用のキャッシュに使う設定**（static assets incremental cache）で配る。R2 は要らない
- Server Actions の `revalidatePath`（12 箇所）は、動的なページを最新にするために呼んでいる。OpenNext の資料ではオンデマンドの再検証にタグキャッシュ（D1）が要るとあるが、このアプリはサーバー側に何もキャッシュしていないので、要らない見込み。**スパイクで、登録・更新の直後に画面が変わるかを確かめて決める**

### Sentry（#16）

- `@sentry/nextjs` のまま使える。Sentry の資料では `nodejs_compat` と `compatibility_date` 2025-08-16 以降が条件
- `sentry.server.config.ts` / `sentry.edge.config.ts` / `instrumentation-client.ts` が `VERCEL_ENV` / `NEXT_PUBLIC_VERCEL_ENV` で環境名を決めているので、Vercel の外では使えない。自前の変数に置き換える（例: `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT`）
- ソースマップのアップロードは、Workers Builds のビルド変数に `SENTRY_AUTH_TOKEN` などを入れれば今の `withSentryConfig` のまま動く見込み

### 環境変数（#38）

| 種類 | 置き場所 | このアプリの変数 |
|---|---|---|
| ビルド時に埋め込む（`NEXT_PUBLIC_*`） | Workers Builds の「ビルド変数」 | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_SUPPORT_EMAIL` / `NEXT_PUBLIC_SENTRY_DSN` |
| 実行時に読む | Worker の変数・シークレット（ダッシュボード） | `GOOGLE_BOOKS_API_KEY` / `RAKUTEN_*` / `AMAZON_ASSOCIATE_TAG` / `SENTRY_DSN` |
| ビルドだけで使う | Workers Builds のビルド変数 | `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` |

- `NEXT_PUBLIC_*` は**ビルド時と実行時の両方**に要るものがある（Server Components も読む）ので、両方に入れる
- CLI からデプロイするときは `opennextjs-cloudflare deploy -- --keep-vars` にして、ダッシュボードの変数を消さない
- ローカルは今までどおり `.env.local` と `next dev`。Workers での確認は `npm run preview`

### Turnstile（#19）

- Supabase の Authentication > Bot and Abuse Protection で Turnstile を有効にし、シークレットキーを入れる
- Supabase の資料の例はサインアップだけだが、有効にするとパスワードでのログインやパスワード再設定のメール送信でも `captchaToken` を求められる見込み。`lib/actions/auth.ts` の `signUp` / `signInWithPassword` / `resetPasswordForEmail` に、フォームから受け取ったトークンを渡す（`options.captchaToken`）。どれが必要かはローカルで有効にして確かめる
- ウィジェットはクライアント側に置くので、サイトキーを `NEXT_PUBLIC_TURNSTILE_SITE_KEY` として足す（`.env.local.example` と `docs/DEPLOY.md` も更新）
- ローカルは Turnstile のテスト用キーを使い、`supabase/config.toml` の `[auth.captcha]`（`provider = "turnstile"`）で試す

### 認証メールの送信（#35）

- Cloudflare Email Service は SMTP で送れる: ホスト `smtp.mx.cloudflare.net`、ポート `465`（暗黙の TLS のみ。587 の STARTTLS は不可）、ユーザー名は文字列 `api_token`、パスワードは「Email Sending: Edit」権限の API トークン
- 送信元のドメインを Email Service > Email Sending に登録する必要がある。ドメインが Cloudflare の DNS にあるので SPF / DKIM の設定は楽
- **Supabase のカスタム SMTP で使えるかは、どちらの資料にも書かれていない**。本番前に、確認メール・パスワード再設定のメールが届くかを試す
- 料金は月 3,000 通まで込み、超えた分は 1,000 通あたり $0.35。込みの枠は Workers Paid が条件（いずれも比較サイトの情報なので、契約前に公式で確かめる）
- 合わなければ当初の候補（Resend など）に戻す。SMTP の設定先が変わるだけで、アプリのコードは変わらない

### 定期実行（#32、公開後）

- OpenNext が作る Worker は `fetch` しか持たないので、`.open-next/worker.js` を読み込んで `scheduled` を足す独自の Worker（`custom-worker.ts`）を作り、`wrangler.jsonc` の `main` をそちらに向ける。cron は `triggers.crons` に書く
- 全員分のデータを読むことになるので、RLS の外から読む手段が要る。今は `SUPABASE_SERVICE_ROLE_KEY` を使わない方針（`docs/DEPLOY.md`）なので、使うか、必要な列だけを返す `security definer` の RPC を作るかを #32 で決める
- 通知をメールで送るなら、Email Service の Workers バインディング（`send_email`）が使える

### 計測（#17）とプライバシーポリシー

- Vercel Analytics の代わりに Cloudflare Web Analytics を使う（Cookie を使わない）。#17 の「Vercel Analytics を有効化」を書き換える
- `app/(public)/privacy/page.tsx` の「Vercel（ホスティング）」を Cloudflare に直す。Web Analytics を入れるならその記載も足す

### ドキュメント

- `docs/DEPLOY.md` を Workers 前提に書き換える（環境変数の置き場所、デプロイの順番、`--keep-vars`）
- `README.md` のマイルストーンの表と資料の表、`../book-manager-web-mvp-plan.md` のホスティングの行
- Issue #15 #17 #19 #35 #38 の本文の Vercel・SMTP に関する項目

## 用意してもらうもの（アカウント・契約）

- [ ] Cloudflare のアカウントと Workers Paid プラン（$5/月）
- [ ] ドメイン（Cloudflare Registrar。.com で年 1,500 円ほど）
- [ ] Workers Builds で GitHub リポジトリをつなぐ（main へのマージで本番、ブランチごとにプレビュー URL）
- [ ] Email Service で送信ドメインを登録し、「Email Sending: Edit」権限の API トークンを作る（Supabase の SMTP に入れる）
- [ ] Turnstile のサイトキーとシークレットキー
- [ ] Web Analytics のサイト登録

## 進める順番の案

1. **スパイク**（コードは捨ててよい）: OpenNext を入れて `npm run preview` で動かす。`proxy.ts` と Sentry がビルドできるか、ログイン・本の登録・統計が動くか、`revalidatePath` が効くかを確かめる
2. スパイクの結果で `proxy.ts` の扱いを決め、OpenNext の導入を PR にする（#15 を Workers 前提に書き換える）
3. Workers Builds でプレビュー URL にデプロイし、本番ドメインをつなぐ。Supabase の Redirect URLs を本番ドメインにする
4. Sentry の環境名・プライバシーポリシー・`docs/DEPLOY.md` を直す
5. Email Service の SMTP（#35）と Turnstile（#19）を本番で設定する
6. 公開後に Cron Triggers（#32）と Web Analytics（#17）

## 出典（2026-10-04 に確認）

- [OpenNext Cloudflare: 概要・対応状況](https://opennext.js.org/cloudflare)
- [OpenNext Cloudflare: Get Started](https://opennext.js.org/cloudflare/get-started)
- [OpenNext Cloudflare: 環境変数](https://opennext.js.org/cloudflare/howtos/env-vars)
- [OpenNext Cloudflare: キャッシュ](https://opennext.js.org/cloudflare/caching)
- [OpenNext Cloudflare: Custom Worker（scheduled の追加）](https://opennext.js.org/cloudflare/howtos/custom-worker)
- [opennextjs-cloudflare のリリース（1.20.3 で Node.js ミドルウェアに対応）](https://github.com/opennextjs/opennextjs-cloudflare/releases)
- [opennextjs-cloudflare#1400: proxy.ts と @sentry/nextjs でビルドが失敗する](https://github.com/opennextjs/opennextjs-cloudflare/issues/1400)
- [Cloudflare Workers: Next.js のガイド（vinext / OpenNext）](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [vinext の紹介（Cloudflare ブログ）](https://blog.cloudflare.com/vinext) / [InfoQ の記事](https://infoq.com/news/2026/03/cloudflare-vinext-experimental)
- [Cloudflare Workers: 制限](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare: Error 1102](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/)
- [Cloudflare Workers: Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Cloudflare Email Service: SMTP で送る](https://developers.cloudflare.com/email-service/api/send-emails/smtp/)
- [Cloudflare Email Service の料金（比較サイト）](https://www.sequenzy.com/versus/cloudflare-email-vs-resend)
- [Sentry: Next.js on Cloudflare](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/nextjs/)
- [Supabase: Auth の CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)
