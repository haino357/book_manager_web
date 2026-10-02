import {
  formatHeight,
  formatLandmark,
  type Landmark,
  type StackProgress,
} from "@/lib/stats/stack";

type Props = {
  heightMm: number;
  /** 1 冊あたりの厚さ（mm）。本の区切り線の間隔に使う */
  bookMm: number;
  progress: StackProgress;
  /** 図の説明（読み上げ用） */
  label: string;
};

const W = 360;
const H = 260;
const GROUND = 232;
const TOP = 44;
const PLOT_H = GROUND - TOP;

const STACK_X = 40;
const STACK_W = 44;
/** 一つ下・一つ上の目印を置く列の中心 */
const BELOW_CX = 180;
const NEXT_CX = 290;
const COL_W = 96;

/** 地面から立つ目印の幅 / 高さ（最大で COL_W） */
const ASPECT: Partial<Record<Landmark["shape"], number>> = {
  person: 0.32,
  giraffe: 0.7,
  statue: 0.4,
  tower: 0.32,
  mountain: 3,
};

/** 本の区切り線をこの本数より多く引くときは、線を省いて塗りだけにする */
const MAX_BOOK_LINES = 80;

/**
 * 読了本を積み上げた柱と、一つ下・一つ上の目印を並べた図（#41）。
 * 縮尺は一つ上の目印（月より高ければ今の高さ）に合わせて変える。
 * 柱は単一系列なので --viz-series の 1 色、目印は比べる相手なので無彩色にする。
 */
export function StackHeightChart({ heightMm, bookMm, progress, label }: Props) {
  const { below, next } = progress;
  const topMm = next ? next.m * 1000 : Math.max(heightMm, (below?.m ?? 1) * 1000) * 1.15;
  const px = (mm: number) => (mm / topMm) * PLOT_H;

  const stackH = Math.min(PLOT_H, px(heightMm));
  const bookPx = px(bookMm);
  const bookLines = heightMm > 0 && bookPx >= 3 ? Math.floor(stackH / bookPx) : 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      className="h-auto w-full max-w-md justify-self-center"
    >
      {/* 地面 */}
      <line x1={8} x2={W - 8} y1={GROUND} y2={GROUND} className="stroke-border" strokeWidth={1} />

      {below && <LandmarkMark landmark={below} cx={BELOW_CX} heightPx={px(below.m * 1000)} />}
      {next && <LandmarkMark landmark={next} cx={NEXT_CX} heightPx={PLOT_H} />}

      {/* 本の柱 */}
      <g className="stack-grow">
        <title>{`読了本の高さ ${formatHeight(heightMm)}`}</title>
        <rect
          x={STACK_X}
          y={GROUND - Math.max(stackH, heightMm > 0 ? 1 : 0)}
          width={STACK_W}
          height={Math.max(stackH, heightMm > 0 ? 1 : 0)}
          rx={stackH > 8 ? 3 : 0}
          className="fill-viz-series"
        />
        {bookLines > 1 &&
          bookLines <= MAX_BOOK_LINES &&
          Array.from({ length: bookLines - 1 }, (_, i) => {
            const y = GROUND - bookPx * (i + 1);
            return (
              <line
                key={i}
                x1={STACK_X}
                x2={STACK_X + STACK_W}
                y1={y}
                y2={y}
                className="stroke-background"
                strokeWidth={bookPx >= 8 ? 2 : 1}
              />
            );
          })}
      </g>
      <text
        x={STACK_X + STACK_W / 2}
        y={Math.max(TOP - 8, GROUND - stackH - 8)}
        textAnchor="middle"
        className="fill-foreground text-[13px] font-semibold"
      >
        {formatHeight(heightMm)}
      </text>
      <text
        x={STACK_X + STACK_W / 2}
        y={GROUND + 18}
        textAnchor="middle"
        className="fill-muted-foreground text-[11px]"
      >
        読了本
      </text>
    </svg>
  );
}

function LandmarkMark({
  landmark,
  cx,
  heightPx,
}: {
  landmark: Landmark;
  cx: number;
  heightPx: number;
}) {
  const h = Math.max(2, heightPx);
  const top = GROUND - h;
  const caption = `${landmark.name} ${formatLandmark(landmark)}`;
  const aspect = ASPECT[landmark.shape];

  // 空・宇宙にあるもの: 高さに点線を引き、アイコンと名前を置く
  if (aspect == null) {
    return (
      <g>
        <title>{caption}</title>
        <line
          x1={STACK_X}
          x2={W - 8}
          y1={top}
          y2={top}
          className="stroke-muted-foreground"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <SkyIcon shape={landmark.shape} cx={cx} cy={top} />
        {/* 基本は線の下（上だと一番上の線で図の外にはみ出す）。地面に近い線だけ上に置く */}
        <Caption landmark={landmark} cx={cx} y={top > GROUND - 44 ? top - 14 : top + 32} />
      </g>
    );
  }

  const w = Math.min(COL_W, Math.max(8, h * aspect));
  const x = cx - w / 2;
  return (
    <g>
      <title>{caption}</title>
      <path d={silhouette(landmark.shape, x, top, w, h)} className="fill-muted-foreground/35" />
      <Caption landmark={landmark} cx={cx} y={top - 8} />
    </g>
  );
}

/** 目印の名前（上）と高さ（下）。y は 2 行目のベースライン */
function Caption({ landmark, cx, y }: { landmark: Landmark; cx: number; y: number }) {
  const baseline = Math.max(TOP - 8, Math.min(GROUND - 4, y));
  return (
    <text x={cx} y={baseline} textAnchor="middle" className="fill-muted-foreground text-[11px]">
      <tspan x={cx} dy={-13}>
        {landmark.name}
      </tspan>
      <tspan x={cx} dy={13} className="tabular-nums">
        {formatLandmark(landmark)}
      </tspan>
    </text>
  );
}

function SkyIcon({ shape, cx, cy }: { shape: Landmark["shape"]; cx: number; cy: number }) {
  if (shape === "moon") {
    return <circle cx={cx} cy={cy} r={9} className="fill-muted-foreground/35 stroke-muted-foreground" />;
  }
  if (shape === "plane") {
    // 右向きの飛行機（胴体・主翼・尾翼）
    return (
      <path
        d={`M${cx - 12},${cy} L${cx + 12},${cy} M${cx - 2},${cy} L${cx - 7},${cy - 8} M${cx - 2},${cy} L${cx - 7},${cy + 8} M${cx - 11},${cy} L${cx - 13},${cy - 5}`}
        className="stroke-muted-foreground"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  return <circle cx={cx} cy={cy} r={4} className="fill-muted-foreground" />;
}

/** 地面から立つ目印のシルエット。左上 (x, y)・幅 w・高さ h の箱に収める */
function silhouette(shape: Landmark["shape"], x: number, y: number, w: number, h: number): string {
  const b = y + h;
  const X = (r: number) => x + w * r;
  const Y = (r: number) => y + h * r;
  switch (shape) {
    case "person": {
      // 頭（円）と胴体
      const r = Math.min(w * 0.32, h * 0.1);
      const cx = X(0.5);
      const cy = y + r;
      return `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z M${X(0.15)},${b} L${X(0.15)},${Y(0.3)} Q${X(0.15)},${Y(0.22)} ${X(0.35)},${Y(0.22)} L${X(0.65)},${Y(0.22)} Q${X(0.85)},${Y(0.22)} ${X(0.85)},${Y(0.3)} L${X(0.85)},${b} Z`;
    }
    case "giraffe":
      // 4 本の脚・胴体・長い首・頭（右向き）
      return `M${X(0.06)},${b} L${X(0.06)},${Y(0.52)} Q${X(0.06)},${Y(0.44)} ${X(0.16)},${Y(0.44)} L${X(0.58)},${Y(0.4)} L${X(0.7)},${Y(0.1)} L${X(0.94)},${Y(0.06)} Q${X(1)},${Y(0.1)} ${X(0.94)},${Y(0.15)} L${X(0.8)},${Y(0.17)} L${X(0.74)},${Y(0.56)} L${X(0.74)},${b} L${X(0.64)},${b} L${X(0.64)},${Y(0.62)} L${X(0.56)},${Y(0.62)} L${X(0.56)},${b} L${X(0.46)},${b} L${X(0.46)},${Y(0.62)} L${X(0.26)},${Y(0.62)} L${X(0.26)},${b} L${X(0.16)},${b} L${X(0.16)},${Y(0.62)} Z`;
    case "statue":
      // 台座と、像
      return `M${X(0)},${b} L${X(0)},${Y(0.62)} L${X(1)},${Y(0.62)} L${X(1)},${b} Z M${X(0.22)},${Y(0.62)} L${X(0.3)},${Y(0.18)} Q${X(0.5)},${Y(0)} ${X(0.7)},${Y(0.18)} L${X(0.78)},${Y(0.62)} Z`;
    case "tower":
      // 裾が広がる塔とアンテナ
      return `M${X(0)},${b} Q${X(0.38)},${Y(0.6)} ${X(0.44)},${Y(0.18)} L${X(0.49)},${Y(0)} L${X(0.51)},${Y(0)} L${X(0.56)},${Y(0.18)} Q${X(0.62)},${Y(0.6)} ${X(1)},${b} Z`;
    case "mountain":
      return `M${X(0)},${b} L${X(0.4)},${Y(0.06)} Q${X(0.5)},${Y(-0.02)} ${X(0.6)},${Y(0.06)} L${X(1)},${b} Z`;
    default:
      return `M${x},${b} L${x},${y} L${x + w},${y} L${x + w},${b} Z`;
  }
}
