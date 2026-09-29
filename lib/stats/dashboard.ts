import { BOOK_STATUSES } from "@/lib/books/schema";
import type { BookStatus } from "@/lib/types/enums";

/**
 * 統計ダッシュボードの集計（純粋関数。Server Component から呼ぶ）。
 *
 * 読了の数え方: 再読しても 1 冊は 1 回。読了日は「初めて読了した日」
 * = reading_histories.completed_at の最小値、履歴が無ければ user_books.completed_at。
 * 再読中（status = reading）の本も、一度読了していれば読了本として数える。
 */

export type StatsRow = {
  status: BookStatus;
  completed_at: string | null;
  price_paid: number | null;
  books: {
    page_count: number | null;
    list_price: number | null;
    categories: string[] | null;
  } | null;
  reading_histories: { completed_at: string | null }[];
};

/** 初めて読了した日（YYYY-MM-DD）。一度も読了していなければ null */
export function firstCompletedAt(row: StatsRow): string | null {
  const dates = row.reading_histories
    .map((h) => h.completed_at)
    .filter((d): d is string => !!d)
    .sort();
  return dates[0] ?? row.completed_at;
}

// --- #12 月別読了数 ---------------------------------------------------------

export type MonthlyPoint = { month: string; label: string; count: number };

/**
 * 月別の読了冊数。year を渡すとその年の 1〜12 月、無ければ today を含む直近 12 ヶ月。
 */
export function monthlyCompleted(rows: StatsRow[], today: string, year?: number): MonthlyPoint[] {
  const months: string[] = [];
  if (year) {
    for (let m = 1; m <= 12; m++) months.push(`${year}-${String(m).padStart(2, "0")}`);
  } else {
    const [y, m] = today.split("-").map(Number);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(y, m - 1 - i, 1));
      months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    }
  }

  const counts = new Map(months.map((m) => [m, 0]));
  for (const row of rows) {
    const month = firstCompletedAt(row)?.slice(0, 7);
    if (month && counts.has(month)) counts.set(month, counts.get(month)! + 1);
  }
  return months.map((month) => ({
    month,
    // 直近 12 ヶ月は年をまたぐので、1 月だけ年を付ける
    label:
      !year && month.endsWith("-01")
        ? `${month.slice(0, 4)}年1月`
        : `${Number(month.slice(5))}月`,
    count: counts.get(month)!,
  }));
}

/** 読了のある年（新しい順）。今年は必ず含める */
export function completedYears(rows: StatsRow[], today: string): number[] {
  const years = new Set([Number(today.slice(0, 4))]);
  for (const row of rows) {
    const d = firstCompletedAt(row);
    if (d) years.add(Number(d.slice(0, 4)));
  }
  return [...years].sort((a, b) => b - a);
}

// --- #13 ジャンル別 ---------------------------------------------------------

export type CategoryPoint = { name: string; count: number };

export const OTHER_CATEGORY = "その他";

/**
 * ジャンル別の冊数（全ステータス）。分類は categories の先頭、
 * Google Books の階層（"Computers / Programming"）は最初のセグメントに丸める。
 * 上位 topN 件 + 「その他」（未分類と topN 以下）。
 */
export function categoryBreakdown(rows: StatsRow[], topN = 8): CategoryPoint[] {
  const counts = new Map<string, number>();
  let other = 0;
  for (const row of rows) {
    const name = row.books?.categories?.[0]?.split("/")[0]?.trim();
    if (!name) other++;
    else counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const sorted = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"));
  const top = sorted.slice(0, topN).map(([name, count]) => ({ name, count }));
  other += sorted.slice(topN).reduce((sum, [, c]) => sum + c, 0);
  return other ? [...top, { name: OTHER_CATEGORY, count: other }] : top;
}

// --- #14 年間目標 -----------------------------------------------------------

export function completedInYear(rows: StatsRow[], year: number): number {
  const prefix = `${year}-`;
  return rows.filter((r) => firstCompletedAt(r)?.startsWith(prefix)).length;
}

// --- #24 金額 ---------------------------------------------------------------

export type PriceSummary = {
  status: BookStatus;
  books: number;
  /** 支払額、無ければ定価（税抜）の合計（円） */
  total: number;
  /** 金額が分からず合計に入っていない冊数 */
  unknown: number;
};

/** ステータス別の合計金額（現在のステータスで集計） */
export function priceByStatus(rows: StatsRow[]): PriceSummary[] {
  return BOOK_STATUSES.map((status) => {
    const target = rows.filter((r) => r.status === status);
    let total = 0;
    let unknown = 0;
    for (const r of target) {
      const price = r.price_paid ?? r.books?.list_price;
      if (price == null) unknown++;
      else total += price;
    }
    return { status, books: target.length, total, unknown };
  });
}

// --- #25 積み上げた高さ -----------------------------------------------------

/** 紙 1 枚 = 2 ページ、1 枚 0.1 mm として計算する（表紙は含めない） */
export const SHEET_THICKNESS_MM = 0.1;

export type StackSummary = {
  books: number;
  pages: number;
  /** ページ数が分からず合計に入っていない冊数 */
  unknown: number;
  heightMm: number;
};

export function readStack(rows: StatsRow[]): StackSummary {
  const read = rows.filter((r) => firstCompletedAt(r) != null);
  let pages = 0;
  let unknown = 0;
  for (const r of read) {
    const p = r.books?.page_count;
    if (p == null) unknown++;
    else pages += p;
  }
  return { books: read.length, pages, unknown, heightMm: (pages / 2) * SHEET_THICKNESS_MM };
}

/** 1234 mm → "1.23 m"、56 mm → "5.6 cm" */
export function formatHeight(mm: number): string {
  if (mm >= 1000) return `${(mm / 1000).toLocaleString("ja-JP", { maximumFractionDigits: 2 })} m`;
  return `${(mm / 10).toLocaleString("ja-JP", { maximumFractionDigits: 1 })} cm`;
}

const LANDMARKS = [
  { name: "大人の身長", m: 1.7 },
  { name: "奈良の大仏", m: 15 },
  { name: "東京タワー", m: 333 },
  { name: "東京スカイツリー", m: 634 },
  { name: "富士山", m: 3776 },
] as const;

/** 身近なものとの比較。「東京タワー（333 m）の 1.2 倍」「大人の身長（1.7 m）の 35%」 */
export function compareHeight(mm: number): string | null {
  if (mm <= 0) return null;
  const m = mm / 1000;
  const below = [...LANDMARKS].reverse().find((l) => l.m <= m);
  const fmt = (n: number) => n.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
  if (!below) {
    const first = LANDMARKS[0];
    return `${first.name}（${fmt(first.m)} m）の ${Math.max(1, Math.round((m / first.m) * 100))}%`;
  }
  return `${below.name}（${fmt(below.m)} m）の ${fmt(m / below.m)} 倍`;
}
