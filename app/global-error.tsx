"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

/**
 * ルートレイアウト自体のエラー。globals.css も読まれないので、スタイルはインラインで書く。
 * metadata は使えないので <title> を直接置く。
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 16,
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <title>エラー | Book Manager</title>
        <h1 style={{ fontSize: 24, margin: 0 }}>エラーが発生しました</h1>
        <p style={{ margin: 0, color: "#737373", fontSize: 14 }}>
          時間をおいて再読み込みしてください。
        </p>
        {error.digest && (
          <p style={{ margin: 0, color: "#737373", fontSize: 12 }}>エラー ID: {error.digest}</p>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => retry()}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#171717", color: "#fff", cursor: "pointer" }}
          >
            再読み込み
          </button>
          <Link href="/" style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e5e5", color: "inherit", textDecoration: "none" }}>
            トップへ戻る
          </Link>
        </div>
      </body>
    </html>
  );
}
