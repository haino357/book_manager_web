import { ImageResponse } from "next/og";

import { BookMark } from "@/components/brand/book-mark";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — 読書管理 Web`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * トップの OGP 画像。ImageResponse の既定フォントは日本語のグリフを持たないので、
 * 画像内の文字は英語にする（日本語はフォントファイルを同梱しないと豆腐になる）。
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          background: "#fafafa",
          color: "#171717",
        }}
      >
        <BookMark size={160} />
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 36, color: "#525252" }}>
          Track your books, reading status, notes and stats.
        </div>
      </div>
    ),
    size,
  );
}
