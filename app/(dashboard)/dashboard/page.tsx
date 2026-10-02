import type { Metadata } from "next";
import Link from "next/link";

import { CategoryBarChart } from "@/components/dashboard/category-bar-chart";
import { MonthlyCompletedChart } from "@/components/dashboard/monthly-completed-chart";
import { StackHeightChart } from "@/components/dashboard/stack-height-chart";
import { StatTile } from "@/components/dashboard/stat-tile";
import { YearlyGoalProgress } from "@/components/dashboard/yearly-goal-progress";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS } from "@/lib/books/schema";
import { todayJst } from "@/lib/dates";
import {
  categoryBreakdown,
  completedInYear,
  completedYears,
  monthlyCompleted,
  priceByStatus,
  ratingSummary,
  readStack,
  type StatsRow,
} from "@/lib/stats/dashboard";
import {
  averageBookMm,
  compareHeight,
  formatCount,
  formatHeight,
  formatLandmark,
  LANDMARKS,
  stackProgress,
} from "@/lib/stats/stack";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "統計" };

const yen = (n: number) => `${n.toLocaleString()} 円`;

/**
 * M3: 統計ダッシュボード。
 * 集計は Server Component で行い（lib/stats/dashboard.ts）、グラフだけクライアントコンポーネントに渡す。
 * - #12 月別読了数（?year= で年を切り替え、無ければ直近 12 ヶ月）
 * - #13 ジャンル別
 * - #14 年間目標
 * - #24 ステータス別の金額
 * - #25 #41 読了本を積み上げた高さと、目印との比較の図
 * - #11 評価の平均と分布
 */
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: profile }] = await Promise.all([
    supabase
      .from("user_books")
      .select(
        "status, completed_at, price_paid, rating, books(page_count, list_price, categories), reading_histories(completed_at)",
      ),
    supabase.from("profiles").select("yearly_goal").eq("id", user!.id).maybeSingle(),
  ]);
  const rows = (data ?? []) as StatsRow[];

  const today = todayJst();
  const thisYear = Number(today.slice(0, 4));
  const years = completedYears(rows, today);
  const yearParam = Number(params.year);
  const selectedYear = years.includes(yearParam) ? yearParam : undefined;

  const monthly = monthlyCompleted(rows, today, selectedYear);
  const monthlyTotal = monthly.reduce((sum, m) => sum + m.count, 0);
  const categories = categoryBreakdown(rows);
  const prices = priceByStatus(rows);
  const ratings = ratingSummary(rows);
  const stack = readStack(rows);
  const comparison = compareHeight(stack.heightMm);
  const bookMm = averageBookMm(stack.heightMm, stack.books - stack.unknown);
  const progress = stackProgress(stack.heightMm, bookMm);

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">統計</h1>
        <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">本を登録すると、ここに読書の統計が表示されます。</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/books/add">書籍を登録する</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">統計</h1>

      <YearlyGoalProgress
        year={thisYear}
        completed={completedInYear(rows, thisYear)}
        goal={profile?.yearly_goal ?? null}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">金額</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {prices.map((p) => (
            <StatTile
              key={p.status}
              label={STATUS_LABELS[p.status]}
              value={yen(p.total)}
              note={`${p.books} 冊${p.unknown ? `（うち ${p.unknown} 冊は金額不明）` : ""}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          支払額を入力した本はその金額、無い本は定価（税抜）で合計しています。金額は各本の詳細画面で入力できます。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">読了本を積み上げると</h2>
        <div className="rounded-xl border p-5">
          <div className="grid items-end gap-6 md:grid-cols-[auto_1fr]">
            <div className="md:min-w-56">
              <p className="text-4xl font-semibold">{formatHeight(stack.heightMm)}</p>
              {comparison && <p className="mt-1 text-sm">{comparison}</p>}
              <NextLandmark progress={progress} />
            </div>
            <StackHeightChart
              heightMm={stack.heightMm}
              bookMm={bookMm}
              progress={progress}
              label={[`読了本の高さ ${formatHeight(stack.heightMm)}`, comparison].filter(Boolean).join("。")}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {stack.books} 冊・{stack.pages.toLocaleString()} ページ
            {stack.unknown ? `（うち ${stack.unknown} 冊はページ数不明で含まれていません）` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            紙 1 枚 = 2 ページ、厚さ 0.1 mm として計算（表紙は含めない）。再読した本も 1 冊として数えます。
            残りの冊数は、読了本 1 冊あたりの平均の厚さ（{formatHeight(bookMm)}）で計算しています。
          </p>
          <DataTable
            caption="目印の高さと、届くまでの冊数"
            headers={["目印", "高さ・届くまで"]}
            rows={LANDMARKS.map((l) => {
              const left = l.m * 1000 - stack.heightMm;
              return [
                l.name,
                `${formatLandmark(l)}・${left <= 0 ? "到達" : `あと ${formatCount(Math.ceil(left / bookMm))} 冊`}`,
              ];
            })}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            月別の読了数
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {selectedYear ? `${selectedYear} 年` : "直近 12 ヶ月"}・計 {monthlyTotal} 冊
            </span>
          </h2>
          <nav className="flex flex-wrap gap-1" aria-label="期間の切り替え">
            <YearLink href="/dashboard" active={!selectedYear}>
              直近 12 ヶ月
            </YearLink>
            {years.map((y) => (
              <YearLink key={y} href={`/dashboard?year=${y}`} active={selectedYear === y}>
                {y} 年
              </YearLink>
            ))}
          </nav>
        </div>
        <div className="rounded-xl border p-4">
          <MonthlyCompletedChart data={monthly} />
          <DataTable
            caption="月別の読了数"
            headers={["月", "冊数"]}
            rows={monthly.map((m) => [m.month.replace("-", "/"), m.count])}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          初めて読み終えた月で数えています（再読は数えません）。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          ジャンル別
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            全ステータス・{rows.length} 冊
          </span>
        </h2>
        <div className="rounded-xl border p-4">
          <CategoryBarChart data={categories} />
          <DataTable
            caption="ジャンル別の冊数"
            headers={["ジャンル", "冊数"]}
            rows={categories.map((c) => [c.name, c.count])}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          書誌のカテゴリ（Google Books・NDL サーチ）の先頭で分類しています。カテゴリが無い本と上位 8 件より下は「その他」です。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">評価</h2>
        {ratings.rated ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile
                label="平均評価"
                value={`★ ${ratings.average!.toFixed(1)}`}
                note={`${ratings.rated} 冊の平均`}
              />
              <StatTile
                label="評価した本"
                value={`${ratings.rated} 冊`}
                note={ratings.unrated ? `未評価 ${ratings.unrated} 冊` : "すべて評価済み"}
              />
            </div>
            <div className="rounded-xl border p-4">
              <CategoryBarChart
                data={ratings.distribution}
                ariaLabel="評価別冊数の横棒グラフ"
                labelWidth={40}
              />
              <DataTable
                caption="評価別の冊数"
                headers={["評価", "冊数"]}
                rows={ratings.distribution.map((r) => [r.name, r.count])}
              />
            </div>
          </>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            まだ評価した本がありません。各本の詳細画面で ★ を付けると、ここに平均と分布が表示されます。
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          ステータスに関係なく、★ を付けた本で集計しています。
        </p>
      </section>
    </div>
  );
}

function YearLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button asChild size="sm" variant={active ? "secondary" : "ghost"}>
      <Link href={href} aria-current={active ? "page" : undefined} className={cn(active && "font-semibold")}>
        {children}
      </Link>
    </Button>
  );
}

/** グラフと同じ値の表（色に頼らず値を読めるように。折りたたみ） */
/** 次の目印までの進み具合。年間目標（#14）と同じメーターで出す */
function NextLandmark({ progress }: { progress: ReturnType<typeof stackProgress> }) {
  const { next, ratioToNext, booksToNext } = progress;
  if (!next || ratioToNext == null || booksToNext == null) {
    return <p className="mt-4 text-sm text-muted-foreground">月まで届きました。</p>;
  }
  return (
    <div className="mt-4 space-y-1.5">
      <p className="text-sm">
        {next.name}（{formatLandmark(next)}）まで
        <span className="mx-1 text-lg font-semibold tabular-nums">あと {formatCount(booksToNext)} 冊</span>
      </p>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-viz-track"
        role="meter"
        aria-label={`${next.name}までの進み具合`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratioToNext * 100)}
      >
        <div className="h-full rounded-full bg-viz-series" style={{ width: `${ratioToNext * 100}%` }} />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {ratioToNext < 0.01 && ratioToNext > 0 ? "1% 未満" : `${Math.floor(ratioToNext * 100)}%`}
      </p>
    </div>
  );
}

function DataTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: [string, string];
  rows: (string | number)[][];
}) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-muted-foreground">表で見る</summary>
      <table className="mt-2 w-full max-w-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-1 font-normal">{headers[0]}</th>
            <th className="py-1 text-right font-normal">{headers[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={String(a)} className="border-b last:border-0">
              <td className="py-1">{a}</td>
              <td className="py-1 text-right tabular-nums">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
