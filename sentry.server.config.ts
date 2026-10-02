import * as Sentry from "@sentry/nextjs";

// Node.js ランタイム（Server Components / Server Actions / Route Handlers）。
// SENTRY_DSN が無ければ送らない（ローカル開発は未設定のまま）
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // メールアドレス・IP・Cookie・リクエスト本文（メモの本文など）を送らない（/privacy の記載と合わせる）
  dataCollection: { userInfo: false, cookies: false, httpBodies: [] },
});
