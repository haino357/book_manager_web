"use client";

/** Recharts の Tooltip content に渡る props のうち、使う分だけ */
type Props = {
  active?: boolean;
  payload?: readonly { value?: unknown; payload?: unknown }[];
  label?: unknown;
  unit?: string;
};

/**
 * 棒グラフ共通のツールチップ。値は本文色、系列の色は横の四角で示す（文字に系列色を使わない）。
 */
export function CountTooltip({
  active,
  payload,
  label,
  unit = "冊",
}: Props) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0].value ?? 0);
  const name = (payload[0].payload as { name?: string } | undefined)?.name ?? String(label ?? "");
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-sm">
      <p className="text-xs text-muted-foreground">{name}</p>
      <p className="mt-0.5 flex items-center gap-2 font-medium tabular-nums">
        <span className="size-2.5 rounded-[2px] bg-viz-series" aria-hidden />
        {value.toLocaleString()} {unit}
      </p>
    </div>
  );
}
