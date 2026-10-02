/**
 * 読了本を積み上げた高さと、身近なもの・遠いものとの比較（#25 #41）。純粋関数だけを置く。
 * 高さそのものは lib/stats/dashboard.ts の readStack で出す。
 */

/** 読了本が無い・ページ数が全部不明のときに使う 1 冊の厚さ（300 ページ = 150 枚 × 0.1 mm） */
export const DEFAULT_BOOK_MM = 15;

/**
 * 図の描き方。
 * - ground: 地面から立つもの（シルエットを目印の高さで描く）
 * - sky: 空・宇宙にあるもの（目印の高さに横線を引いて、アイコンを置く）
 */
export type LandmarkShape = "person" | "giraffe" | "statue" | "tower" | "mountain" | "plane" | "line" | "moon";

export type Landmark = {
  name: string;
  /** 高さ・距離（m） */
  m: number;
  shape: LandmarkShape;
};

/**
 * 低い順に並べる。数値は次の公表値（概数のものは「約」を付けて表示する）。
 * - 大人の身長: 目安
 * - キリン: 雄の成獣の目安
 * - 奈良の大仏: 東大寺の公表値（像高 14.98 m）
 * - 自由の女神: 米国国立公園局の公表値（台座の基部からトーチまで 93 m）
 * - 東京タワー: 公式サイト（333 m）
 * - 東京スカイツリー: 公式サイト（634 m）
 * - 富士山: 国土地理院（3,776 m）
 * - エベレスト: 2020 年の中国・ネパールの共同測量（8,849 m）
 * - 旅客機が飛ぶ高さ: 巡航高度の目安（10〜12 km）
 * - 宇宙との境目: 国際航空連盟（FAI）のカーマン・ライン（100 km）
 * - 国際宇宙ステーション: JAXA（約 400 km）
 * - 地球から月まで: NASA の平均距離（384,400 km）
 */
export const LANDMARKS: readonly Landmark[] = [
  { name: "大人の身長", m: 1.7, shape: "person" },
  { name: "キリン", m: 5, shape: "giraffe" },
  { name: "奈良の大仏", m: 15, shape: "statue" },
  { name: "自由の女神", m: 93, shape: "statue" },
  { name: "東京タワー", m: 333, shape: "tower" },
  { name: "東京スカイツリー", m: 634, shape: "tower" },
  { name: "富士山", m: 3776, shape: "mountain" },
  { name: "エベレスト", m: 8849, shape: "mountain" },
  { name: "旅客機が飛ぶ高さ", m: 10_000, shape: "plane" },
  { name: "宇宙との境目", m: 100_000, shape: "line" },
  { name: "国際宇宙ステーション", m: 400_000, shape: "line" },
  { name: "地球から月まで", m: 384_400_000, shape: "moon" },
];

const fmt = (n: number, digits = 1) => n.toLocaleString("ja-JP", { maximumFractionDigits: digits });

/**
 * 56 mm → "5.6 cm"、1234 mm → "1.23 m"、384,400,000,000 mm → "384,400 km"。
 * 富士山（3,776 m）やエベレスト（8,849 m）は m のほうがなじみがあるので、km は 10 km から
 */
export function formatHeight(mm: number): string {
  if (mm >= 10_000_000) return `${fmt(mm / 1_000_000, 2)} km`;
  if (mm >= 1000) return `${fmt(mm / 1000, 2)} m`;
  return `${fmt(mm / 10)} cm`;
}

/** 目印の高さの表示（"333 m"、"384,400 km"） */
export function formatLandmark(l: Landmark): string {
  return formatHeight(l.m * 1000);
}

/** 1234 → "1,234"、2,560,000,000 → "25.6億" */
export function formatCount(n: number): string {
  if (n < 10_000) return n.toLocaleString("ja-JP");
  return new Intl.NumberFormat("ja-JP", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** 身近なものとの比較。「東京タワー（333 m）の 1.2 倍」「大人の身長（1.7 m）の 35%」 */
export function compareHeight(mm: number): string | null {
  if (mm <= 0) return null;
  const m = mm / 1000;
  const { below } = landmarksAround(mm);
  if (!below) {
    const first = LANDMARKS[0];
    return `${first.name}（${formatLandmark(first)}）の ${Math.max(1, Math.round((m / first.m) * 100))}%`;
  }
  return `${below.name}（${formatLandmark(below)}）の ${fmt(m / below.m)} 倍`;
}

/** 高さ以下で一番高い目印（below）と、高さより上で一番低い目印（next） */
export function landmarksAround(mm: number): { below: Landmark | null; next: Landmark | null } {
  const m = mm / 1000;
  let below: Landmark | null = null;
  let next: Landmark | null = null;
  for (const l of LANDMARKS) {
    if (l.m <= m) below = l;
    else {
      next = l;
      break;
    }
  }
  return { below, next };
}

/**
 * 1 冊あたりの平均の厚さ（mm）。ページ数が分かる本だけで平均し、1 冊も無ければ DEFAULT_BOOK_MM。
 * @param counted ページ数が分かっていて heightMm に入っている冊数
 */
export function averageBookMm(heightMm: number, counted: number): number {
  if (counted <= 0 || heightMm <= 0) return DEFAULT_BOOK_MM;
  return heightMm / counted;
}

export type StackProgress = {
  below: Landmark | null;
  next: Landmark | null;
  /** 次の目印に対する今の高さ（0〜1）。月より高ければ null */
  ratioToNext: number | null;
  /** 次の目印に届くまでの冊数（1 冊あたり bookMm で計算）。月より高ければ null */
  booksToNext: number | null;
};

/** 次の目印まであと何冊か */
export function stackProgress(mm: number, bookMm: number): StackProgress {
  const { below, next } = landmarksAround(mm);
  if (!next) return { below, next, ratioToNext: null, booksToNext: null };
  const remaining = next.m * 1000 - mm;
  return {
    below,
    next,
    ratioToNext: Math.max(0, mm) / (next.m * 1000),
    booksToNext: Math.max(1, Math.ceil(remaining / bookMm)),
  };
}
