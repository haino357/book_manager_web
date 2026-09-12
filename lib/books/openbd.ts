import type { BookMetadata } from "./types";
import { normalizeIsbn } from "./types";

const ENDPOINT = "https://api.openbd.jp/v1/get";

type OpenBdSummary = {
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  pubdate?: string; // YYYYMMDD or YYYYMM
  cover?: string;
};

type OpenBdItem = {
  summary: OpenBdSummary;
  onix?: {
    DescriptiveDetail?: {
      Contributor?: {
        ContributorRole?: string[];
        PersonName?: { content?: string };
        PersonNameInverted?: { content?: string };
      }[];
    };
    CollateralDetail?: {
      TextContent?: { TextType: string; Text: string }[];
    };
  };
} | null;

async function fetchItems(isbns: string[]): Promise<OpenBdItem[]> {
  if (isbns.length === 0) return [];
  const res = await fetch(`${ENDPOINT}?isbn=${isbns.join(",")}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return [];
  return (await res.json()) as OpenBdItem[];
}

/**
 * OpenBD で ISBN 検索する（補完）。
 * Google Books で見つからない、または書影が無い日本書の補完に使う。
 */
export async function fetchFromOpenBd(
  isbn: string,
): Promise<BookMetadata | null> {
  const { isbn13, isbn10 } = normalizeIsbn(isbn);
  const q = isbn13 ?? isbn10;
  if (!q) return null;

  const [item] = await fetchItems([q]);
  return mapItem(item, isbn13, isbn10);
}

/**
 * 複数 ISBN をまとめて取得し、isbn13 → BookMetadata の Map で返す（キーワード検索結果の書影補完用）。
 * OpenBD はカンマ区切りで複数 ISBN を受け付ける。
 */
export async function fetchManyFromOpenBd(
  isbn13s: string[],
): Promise<Map<string, BookMetadata>> {
  const unique = [...new Set(isbn13s.filter((s) => /^\d{13}$/.test(s)))];
  const map = new Map<string, BookMetadata>();
  // 1 リクエストあたりの ISBN 数を抑える（URL 長対策）
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const items = await fetchItems(chunk).catch(() => [] as OpenBdItem[]);
    items.forEach((item, idx) => {
      const book = mapItem(item, chunk[idx], null);
      if (book?.isbn13) map.set(book.isbn13, book);
    });
  }
  return map;
}

function mapItem(
  item: OpenBdItem,
  isbn13: string | null,
  isbn10: string | null,
): BookMetadata | null {
  if (!item?.summary?.title) return null;

  const s = item.summary;
  const description =
    item.onix?.CollateralDetail?.TextContent?.find((t) => t.TextType === "03")
      ?.Text ?? null;

  return {
    isbn13: s.isbn.length === 13 ? s.isbn : isbn13,
    isbn10,
    title: s.title,
    authors: parseAuthors(item),
    publisher: s.publisher || null,
    publishedDate: formatPubdate(s.pubdate),
    coverUrl: s.cover || null,
    description,
    categories: [],
    source: "openbd",
  };
}

/**
 * 著者名を取り出す。ONIX の Contributor があればそれを優先し、無ければ summary.author を解析する。
 *
 * OpenBD のデータは 2 系統ある:
 *   - 国立国会図書館系: "渋川,よしき 辻,大志郎,1990- 真野,隼記,1986-"（人物はスペース区切り、姓・名・生年はカンマ区切り）
 *   - 出版社系:         "渋川よしき／著 辻大志郎／著"（人物はスペース区切り、役割は「／著」など）
 */
function parseAuthors(item: NonNullable<OpenBdItem>): string[] {
  const contributors = item.onix?.DescriptiveDetail?.Contributor ?? [];
  const fromOnix = contributors
    .map((c) => c.PersonName?.content ?? c.PersonNameInverted?.content ?? "")
    .map(formatPersonName)
    .filter(Boolean);
  if (fromOnix.length) return fromOnix;

  const raw = item.summary.author?.trim();
  if (!raw) return [];
  return raw
    .replace(/／[^\s]*/g, "") // 役割表記（／著、／訳 …）を落とす
    .split(/\s+/)
    .map(formatPersonName)
    .filter(Boolean);
}

/**
 * "姓, 名, 生年-" 形式を表示名にする。
 *   "渋川, よしき"          → "渋川よしき"
 *   "辻, 大志郎, 1990-"     → "辻大志郎"
 *   "Boswell, Dustin"      → "Dustin Boswell"
 *   "渋川よしき"            → "渋川よしき"（カンマ無しはそのまま）
 */
export function formatPersonName(name: string): string {
  const parts = name
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/^\d{4}-?(\d{4})?$/.test(p)); // 生没年を除く
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const [family, ...given] = parts;
  const givenName = given.join(" ");
  const isLatin = /^[A-Za-zÀ-ɏ.'\- ]+$/.test(family + givenName);
  return isLatin ? `${givenName} ${family}` : `${family}${givenName}`;
}

function formatPubdate(pubdate?: string): string | null {
  if (!pubdate) return null;
  if (/^\d{8}$/.test(pubdate))
    return `${pubdate.slice(0, 4)}-${pubdate.slice(4, 6)}-${pubdate.slice(6, 8)}`;
  if (/^\d{6}$/.test(pubdate))
    return `${pubdate.slice(0, 4)}-${pubdate.slice(4, 6)}`;
  return pubdate;
}
