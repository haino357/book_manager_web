import { ImageResponse } from "next/og";

import { BookMark } from "@/components/brand/book-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS のホーム画面用アイコン。角丸は iOS 側で付くので、背景は全面に塗る */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#171717",
        }}
      >
        <BookMark size={180} />
      </div>
    ),
    size,
  );
}
