import type { BookMetadata } from "./types";
import { normalizeIsbn } from "./types";

/**
 * 楽天ブックス書籍検索 API（#27）。
 * https://webservice.rakuten.co.jp/documentation/books-book-search
 *
 * 2026 年の新エンドポイントは applicationId に加えて accessKey が必要。
 * どちらかが未設定なら呼ばずに空を返す（Google Books / OpenBD / NDL だけで動く）。
 * 利用時はクレジット表示が必須（app/(dashboard)/layout.tsx のフッター）。
 */
const ENDPOINT = "https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404";

type RakutenItem = {
  title?: string;
  subTitle?: string;
  author?: string;
  publisherName?: string;
  isbn?: string;
  itemCaption?: string;
  salesDate?: string;
  itemPrice?: number;
  largeImageUrl?: string;
  mediumImageUrl?: string;
};

type RakutenResponse = {
  // formatVersion=2 は Items: [{...}]。念のため formatVersion=1 の Items: [{ Item: {...} }] も受ける
  Items?: (RakutenItem | { Item: RakutenItem })[];
};

/** 楽天の API 呼び出し回数制限（429）。呼び出し側で次のソースにフォールバックする */
export class RakutenQuotaError extends Error {
  constructor() {
    super("Rakuten Books API rate limit exceeded");
    this.name = "RakutenQuotaError";
  }
}

export function isRakutenConfigured(): boolean {
  return !!process.env.RAKUTEN_APPLICATION_ID && !!process.env.RAKUTEN_ACCESS_KEY;
}

async function fetchItems(params: Record<string, string>, hits: number): Promise<RakutenItem[]> {
  if (!isRakutenConfigured()) return [];

  const url = new URL(ENDPOINT);
  url.searchParams.set("applicationId", process.env.RAKUTEN_APPLICATION_ID!);
  url.searchParams.set("accessKey", process.env.RAKUTEN_ACCESS_KEY!);
  url.searchParams.set("format", "json");
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("hits", String(Math.min(hits, 30)));
  url.searchParams.set("outOfStockFlag", "1"); // 品切れ・絶版も含める（読了本の登録に必要）
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (res.status === 429) throw new RakutenQuotaError();
  // 404 = 該当なし、400 = キーワードが短すぎるなど。どちらも結果なしとして扱う
  if (!res.ok) return [];

  const data = (await res.json()) as RakutenResponse;
  return (data.Items ?? []).map((i) => ("Item" in i ? i.Item : i));
}

/** ISBN で 1 件取得する */
export async function fetchFromRakuten(isbn: string): Promise<BookMetadata | null> {
  const { isbn13 } = normalizeIsbn(isbn);
  if (!isbn13) return null;
  const [item] = await fetchItems({ isbn: isbn13 }, 1);
  return item ? mapItem(item) : null;
}

/**
 * タイトル・著者で探す。書籍検索 API は自由なキーワードを受け付けないので、
 * タイトル一致 → 著者一致を並列に引いて、この順に並べる（NDL と同じ考え方）。
 */
export async function searchRakutenByKeyword(
  keyword: string,
  maxResults = 20,
): Promise<BookMetadata[]> {
  const q = keyword.trim();
  if (!q) return [];

  const [byTitle, byAuthor] = await Promise.all([
    fetchItems({ title: q, sort: "standard" }, maxResults),
    fetchItems({ author: q, sort: "standard" }, maxResults),
  ]);
  return [...byTitle, ...byAuthor]
    .map(mapItem)
    .filter((b): b is BookMetadata => b !== null)
    .slice(0, maxResults);
}

function mapItem(item: RakutenItem): BookMetadata | null {
  if (!item.title) return null;
  const { isbn13, isbn10 } = item.isbn ? normalizeIsbn(item.isbn) : { isbn13: null, isbn10: null };

  return {
    isbn13,
    isbn10,
    title: item.title,
    authors: parseAuthors(item.author),
    publisher: item.publisherName || null,
    publishedDate: parseSalesDate(item.salesDate),
    coverUrl: parseImageUrl(item.largeImageUrl ?? item.mediumImageUrl),
    description: item.itemCaption || null,
    // booksGenreId はコード（"001004008"）で名前が無いので、カテゴリには使わない
    categories: [],
    // ページ数は返らない（size は判型）
    pageCount: null,
    listPrice: toTaxExcluded(item.itemPrice),
    source: "rakuten",
  };
}

/** "Dustin Boswell/Trevor Foucher/角征典" → 配列 */
export function parseAuthors(author: string | undefined): string[] {
  return (author ?? "")
    .split("/")
    .map((a) => a.trim())
    .filter(Boolean);
}

/** "2012年06月23日頃" → "2012-06-23"、"2012年06月" → "2012-06"、"2012年" → "2012" */
export function parseSalesDate(v: string | undefined): string | null {
  const m = v?.match(/(\d{4})年(?:(\d{1,2})月(?:(\d{1,2})日)?)?/);
  if (!m) return null;
  const [, y, mo, d] = m;
  if (mo && d) return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  if (mo) return `${y}-${mo.padStart(2, "0")}`;
  return y;
}

/** 書影なしのときは noimage の画像 URL が返るので除外する */
export function parseImageUrl(url: string | undefined): string | null {
  if (!url || /noimage/i.test(url)) return null;
  return url;
}

/**
 * itemPrice は税込。#24 で定価は税抜に揃えたので 10% で割り戻す。
 * 書籍は再販制度で定価販売なので、ほぼ定価（税抜）に一致する。
 */
export function toTaxExcluded(itemPrice: number | undefined): number | null {
  if (!itemPrice || itemPrice <= 0) return null;
  return Math.round(itemPrice / 1.1);
}
