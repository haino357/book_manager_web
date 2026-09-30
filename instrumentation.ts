import * as Sentry from "@sentry/nextjs";

/** サーバー起動時に Sentry を初期化する（Next.js の instrumentation.ts） */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/** Server Components・Route Handlers・Server Actions で投げられたエラーを Sentry に送る */
export const onRequestError = Sentry.captureRequestError;
