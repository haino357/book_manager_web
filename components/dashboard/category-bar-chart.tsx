"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CountTooltip } from "@/components/dashboard/chart-tooltip";
import type { CategoryPoint } from "@/lib/stats/dashboard";

/**
 * ジャンル別の冊数（#13）。Issue では円グラフの想定だったが、ジャンル名が長く件数も多いので
 * 読み比べやすい横棒にした（1 色。ジャンルは軸ラベルで示すので色分けしない）。
 */
export function CategoryBarChart({ data }: { data: CategoryPoint[] }) {
  // 1 本 32px + 余白。名前が多くても潰れないよう高さを件数で決める
  const height = Math.max(120, data.length * 32 + 16);
  return (
    <div className="w-full" style={{ height }} role="img" aria-label="ジャンル別冊数の横棒グラフ">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={128}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
            tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 10)}…` : v)}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={(props) => <CountTooltip {...props} />}
          />
          <Bar
            dataKey="count"
            name="冊数"
            fill="var(--viz-series)"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="count"
              position="right"
              className="tabular-nums"
              style={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
