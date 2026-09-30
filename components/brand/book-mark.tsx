/**
 * app/icon.svg と同じ本のマーク。next/og の ImageResponse（apple-icon / opengraph-image）用に
 * div だけで組む（Satori は SVG の path より div の方が確実に描ける）。
 */
export function BookMark({ size }: { size: number }) {
  const u = size / 32;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7 * u,
        background: "#171717",
        display: "flex",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 8 * u,
          top: 7 * u,
          width: 7 * u,
          height: 18 * u,
          borderRadius: `${1.5 * u}px 0 0 ${1.5 * u}px`,
          background: "#fafafa",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 17 * u,
          top: 7 * u,
          width: 7 * u,
          height: 18 * u,
          borderRadius: `0 ${1.5 * u}px ${1.5 * u}px 0`,
          background: "#d4d4d4",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 19 * u,
          top: 7 * u,
          width: 3 * u,
          height: 8 * u,
          background: "#f59e0b",
        }}
      />
    </div>
  );
}
