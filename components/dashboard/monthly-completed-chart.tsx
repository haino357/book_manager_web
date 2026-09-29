"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CountTooltip } from "@/components/dashboard/chart-tooltip";
import type { MonthlyPoint } from "@/lib/stats/dashboard";

/** 月別読了数の縦棒グラフ（#12）。集計は Server Component 側で済ませて渡す */
export function MonthlyCompletedChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="月別読了数の棒グラフ">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            minTickGap={4}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={(props) => <CountTooltip {...props} />}
          />
          <Bar
            dataKey="count"
            name="読了数"
            fill="var(--viz-series)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
