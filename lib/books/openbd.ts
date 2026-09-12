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
    CollateralDetail?: {
      TextContent?: { TextType: string; Text: string }[];
    };
  };
} | null;

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

  const res = await fetch(`${ENDPOINT}?isbn=${q}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return null;

  const [item] = (await res.json()) as OpenBdItem[];
  if (!item?.summary?.title) return null;

  const s = item.summary;
  const description =
    item.onix?.CollateralDetail?.TextContent?.find((t) => t.TextType === "03")
      ?.Text ?? null;

  return {
    isbn13: s.isbn.length === 13 ? s.isbn : isbn13,
    isbn10,
    title: s.title,
    // OpenBD の author は「著者名／著」形式のカンマ区切り。役割表記を落とす
    authors: s.author
      ? s.author.split(/[,、]/).map((a) => a.replace(/／.*$/, "").trim()).filter(Boolean)
      : [],
    publisher: s.publisher || null,
    publishedDate: formatPubdate(s.pubdate),
    coverUrl: s.cover || null,
    description,
    categories: [],
    source: "openbd",
  };
}

function formatPubdate(pubdate?: string): string | null {
  if (!pubdate) return null;
  if (/^\d{8}$/.test(pubdate))
    return `${pubdate.slice(0, 4)}-${pubdate.slice(4, 6)}-${pubdate.slice(6, 8)}`;
  if (/^\d{6}$/.test(pubdate))
    return `${pubdate.slice(0, 4)}-${pubdate.slice(4, 6)}`;
  return pubdate;
}
