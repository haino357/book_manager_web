import { formatPersonName } from "./openbd";
import type { BookMetadata } from "./types";
import { normalizeIsbn } from "./types";

/**
 * 国立国会図書館サーチ OpenSearch API（キー不要・無料）。
 * https://ndlsearch.ndl.go.jp/help/api/specifications
 * Google Books がクォータ超過（429）のときのキーワード検索フォールバック。書影は返さない。
 */
const ENDPOINT = "https://ndlsearch.ndl.go.jp/api/opensearch";

export async function searchNdlByKeyword(
  keyword: string,
  maxResults = 20,
): Promise<BookMetadata[]> {
  const q = keyword.trim();
  if (!q) return [];
  const cnt = Math.min(maxResults, 50);

  // `any` は説明文まで横断して関連度が低いので、タイトル一致 → 著者一致の順に並べる。
  // どちらも 0 件のときだけ `any` で拾う。
  const [byTitle, byCreator] = await Promise.all([
    fetchItems({ title: q }, cnt),
    fetchItems({ creator: q }, cnt),
  ]);
  let items = [...byTitle, ...byCreator];
  if (items.length === 0) items = await fetchItems({ any: q }, cnt);

  return items.slice(0, maxResults);
}

async function fetchItems(
  params: Record<string, string>,
  cnt: number,
): Promise<BookMetadata[]> {
  const url = new URL(ENDPOINT);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("mediatype", "books");
  url.searchParams.set("cnt", String(cnt));

  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } }).catch(() => null);
  if (!res?.ok) return [];

  const xml = await res.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items.map(parseItem).filter((b): b is BookMetadata => b !== null);
}

/** RSS の <item> 1 件を BookMetadata にする。タグは入れ子にならないので正規表現で十分 */
function parseItem(item: string): BookMetadata | null {
  const title = text(item, "dc:title");
  if (!title) return null;

  const isbnRaw = text(item, "dc:identifier", 'xsi:type="dcndl:ISBN"');
  const { isbn13, isbn10 } = isbnRaw ? normalizeIsbn(isbnRaw) : { isbn13: null, isbn10: null };

  return {
    isbn13,
    isbn10,
    title: cleanTitle(title),
    authors: textAll(item, "dc:creator").map(formatPersonName).filter(Boolean),
    publisher: text(item, "dc:publisher"),
    publishedDate: formatIssued(text(item, "dcterms:issued") ?? text(item, "dc:date")),
    coverUrl: null,
    description: null,
    // xsi:type 無しの dc:subject が件名（NDLC / NDC コードは除く）
    categories: textAll(item, "dc:subject", /* untypedOnly */ true),
    source: "ndl",
  };
}

/** 最初に見つかったタグの中身。attr を渡すとその属性を含むタグに限定する */
function text(xml: string, tag: string, attr?: string): string | null {
  const re = attr
    ? new RegExp(`<${tag}[^>]*${escapeRe(attr)}[^>]*>([\\s\\S]*?)</${tag}>`)
    : new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`);
  const m = xml.match(re);
  return m ? decode(m[1]).trim() || null : null;
}

function textAll(xml: string, tag: string, untypedOnly = false): string[] {
  const re = new RegExp(`<${tag}((?:\\s[^>]*)?)>([\\s\\S]*?)</${tag}>`, "g");
  const out: string[] = [];
  for (const m of xml.matchAll(re)) {
    if (untypedOnly && /xsi:type=/.test(m[1])) continue;
    const v = decode(m[2]).trim();
    if (v) out.push(v);
  }
  return [...new Set(out)];
}

/** "リーダブルコード : より良い…" のようにサブタイトルが " : " で続く形はそのまま残す（情報として有用） */
function cleanTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}

/** "2012.6" → "2012-06"、"2012" → "2012"、"2022.4.30" → "2022-04-30" */
function formatIssued(v: string | null): string | null {
  if (!v) return null;
  const m = v.match(/^(\d{4})(?:\.(\d{1,2}))?(?:\.(\d{1,2}))?/);
  if (!m) return null;
  const [, y, mo, d] = m;
  if (d && mo) return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  if (mo) return `${y}-${mo.padStart(2, "0")}`;
  return y;
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
