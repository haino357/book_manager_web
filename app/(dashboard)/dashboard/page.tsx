import type { Metadata } from "next";

export const metadata: Metadata = { title: "統計" };

/**
 * M3: 統計ダッシュボード（Recharts）。
 * TODO:
 *   - components/dashboard/monthly-completed-chart.tsx  月別読了数（棒）
 *   - components/dashboard/category-pie-chart.tsx      ジャンル別（books.categories[0]・円）
 *   - components/dashboard/yearly-goal-progress.tsx    年間目標進捗（profiles.yearly_goal）
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">統計</h1>
      <p className="text-muted-foreground">
        月別読了数・ジャンル別分布・年間目標進捗をここに実装する（M3）。
      </p>
    </div>
  );
}
