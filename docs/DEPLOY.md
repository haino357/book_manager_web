# 本番リリースの手順

本番は Vercel（Next.js）+ Supabase（DB・認証）。関連 Issue: #15 #16 #35 #38。

## 環境変数

Vercel の Project Settings > Environment Variables に設定する。`NEXT_PUBLIC_` が付いたものはブラウザに埋め込まれるので、秘密の値には付けない。

| 変数 | 必須 | 公開 | 内容 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ○ | Supabase の Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ○ | Supabase の anon key（RLS で守られる前提の公開キー） |
| `NEXT_PUBLIC_SITE_URL` | ✅ | ○ | 本番の URL（`https://…`、末尾の `/` なし）。メールのリンク・OGP・sitemap の基準 |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | | ○ | 問い合わせ用メールアドレス。`/support` `/privacy` に出る。未設定なら GitHub Issues だけを案内する |
| `GOOGLE_BOOKS_API_KEY` | | × | 無くても動くが 429 になりやすい |
| `RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY` | | × | 楽天ブックス API |
| `AMAZON_ASSOCIATE_TAG` | | × | 設定するとアソシエイトのリンクと表示が出る |
| `SENTRY_DSN` | | × | サーバー側のエラー送信。未設定なら送らない |
| `NEXT_PUBLIC_SENTRY_DSN` | | ○ | ブラウザ側のエラー送信（DSN は公開されても問題ない値） |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | | × | ビルド時のソースマップのアップロード。`SENTRY_AUTH_TOKEN` が無ければアップロードしない |

`SUPABASE_SERVICE_ROLE_KEY` は使っていない（退会は RPC `delete_my_account` で行う）。Vercel にも置かない。

## マイグレーションを本番に出す順番

1. PR をマージする
2. `npx supabase link --project-ref <本番の ref>` 済みの状態で `npm run db:push`
3. `npx supabase migration list` でローカルとリモートが一致していることを確認する
4. Vercel のデプロイ（main へのマージで自動）

列の追加など、古いコードでも動く変更は 2 → 4 の順で出す。列の削除・名前の変更は、コードのデプロイを先にしてから次の PR で消す。
本番に seed は入れない（`db push` は seed を流さない）。

## Supabase Auth の設定（ダッシュボード）

- Authentication > URL Configuration
  - Site URL: `NEXT_PUBLIC_SITE_URL`
  - Redirect URLs: `https://<本番ドメイン>/auth/callback**`（`?next=/reset-password` が付くのでワイルドカードにする）
- Authentication > Email Templates を日本語にする（Confirm signup / Reset Password / Magic Link / Change Email）
- カスタム SMTP・Google OAuth の本番公開は #35

## 公開前の確認

- `/`, `/terms`, `/privacy`, `/support`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image` が未ログインで開ける
- 登録 → 確認メール → ログイン、パスワード再設定、設定画面からの退会
- 存在しない URL で 404 ページが出る
