import * as Sentry from "@sentry/nextjs";

// ブラウザ側。DSN はクライアントに埋め込まれるので NEXT_PUBLIC_ を付ける（DSN は公開されても問題ない値）
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // メールアドレス・IP・Cookie・リクエスト本文（メモの本文など）を送らない（/privacy の記載と合わせる）
  dataCollection: { userInfo: false, cookies: false, httpBodies: [] },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
