import * as Sentry from "@sentry/nextjs";

// Edge ランタイム（proxy.ts）。設定は sentry.server.config.ts と揃える
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // メールアドレス・IP・Cookie・リクエスト本文（メモの本文など）を送らない（/privacy の記載と合わせる）
  dataCollection: { userInfo: false, cookies: false, httpBodies: [] },
});
