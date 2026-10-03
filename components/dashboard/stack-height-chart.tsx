import { BookOpenIcon } from "lucide-react";

import { LandmarkIllustration } from "@/components/dashboard/landmark-illustration";
import { formatHeight, formatLandmark, type Landmark, type StackProgress } from "@/lib/stats/stack";

type Props = {
  heightMm: number;
  /** 1 冊あたりの厚さ（mm）。描ける縮尺の場合に本の区切りを表す */
  bookMm: number;
  progress: StackProgress;
  label: string;
};

const W = 360;
const GROUND = 220;
const TOP = 12;
const PLOT_H = GROUND - TOP;

/** 棒の高さだけを共通の縮尺で比較。イラストと長い名前は図の外に置き、変形・重なりを防ぐ。 */
export function StackHeightChart({ heightMm, bookMm, progress, label }: Props) {
  const landmarks = [progress.below, progress.next].filter((l): l is Landmark => l !== null);
  const columns = landmarks.length + 1;
  const columnW = W / columns;
  const topMm = Math.max(heightMm, ...landmarks.map((l) => l.m * 1000), 1);
  const px = (mm: number) => (mm / topMm) * PLOT_H;
  const stackH = px(heightMm);
  const bookPx = px(bookMm);
  const bookLines = bookPx >= 3 ? Math.min(80, Math.floor(stackH / bookPx)) : 0;
  const stackX = columnW / 2 - 26;

  return (
    <figure className="w-full min-w-0 max-w-lg justify-self-center rounded-lg bg-muted/40 p-3 sm:p-4">
      <svg viewBox={`0 0 ${W} 228`} role="img" aria-label={label} className="h-auto w-full">
        <title>{label}</title>
        <desc>読了本と目印の棒は同じ縮尺です。下のイラストは対象を示すもので、実寸比ではありません。</desc>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line key={ratio} x1={8} x2={W - 8} y1={GROUND - ratio * PLOT_H} y2={GROUND - ratio * PLOT_H} className="stroke-border" strokeDasharray={ratio === 0 ? undefined : "3 5"} />
        ))}
        {landmarks.map((landmark, i) => {
          const cx = columnW * (i + 1.5);
          const h = px(landmark.m * 1000);
          return (
            <g key={landmark.name}>
              <rect x={cx - 20} y={GROUND - h} width={40} height={h} rx={Math.min(4, h / 2)} className="fill-muted-foreground/30" />
              <line x1={cx - 20} x2={cx + 20} y1={GROUND - h} y2={GROUND - h} className="stroke-muted-foreground" strokeWidth={2} />
            </g>
          );
        })}
        <g className="stack-grow">
          <rect x={stackX} y={GROUND - stackH} width={52} height={stackH} rx={Math.min(3, stackH / 2)} className="fill-viz-series" />
          {Array.from({ length: Math.max(0, bookLines - 1) }, (_, i) => (
            <line key={i} x1={stackX + 3} x2={stackX + 49} y1={GROUND - bookPx * (i + 1)} y2={GROUND - bookPx * (i + 1)} className="stroke-background" strokeWidth={1.5} />
          ))}
        </g>
      </svg>
      <div className="grid items-start" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        <div className="flex min-w-0 flex-col items-center gap-1 px-1 text-center">
          <div className="flex h-16 items-center"><BookOpenIcon className="size-9 text-viz-series" strokeWidth={1.5} aria-hidden /></div>
          <p className="text-sm font-semibold">読了本</p>
          <p className="text-sm font-semibold tabular-nums text-viz-series">{formatHeight(heightMm)}</p>
          <p className="text-xs text-muted-foreground">積み上げた高さ</p>
        </div>
        {landmarks.map((landmark) => (
          <div key={landmark.name} className="flex min-w-0 flex-col items-center gap-1 px-1 text-center">
            <LandmarkIllustration landmark={landmark} />
            <p className="text-sm font-medium [overflow-wrap:anywhere]">{landmark.name}</p>
            <p className="text-sm font-semibold tabular-nums">{formatLandmark(landmark)}</p>
            <p className="text-xs text-muted-foreground">{landmark === progress.next ? "次の目印" : "到達した目印"}</p>
          </div>
        ))}
      </div>
      <figcaption className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
        棒の高さは同じ縮尺です。イラストは実寸比ではありません。
      </figcaption>
    </figure>
  );
}
