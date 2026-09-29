import { fillMissingCovers } from "./covers";
import { GoogleBooksQuotaError, searchGoogleBooksByKeyword } from "./google-books";
import { searchNdlByKeyword } from "./ndl";
import { fetchManyFromOpenBd } from "./openbd";
import { RakutenQuotaError, searchRakutenByKeyword } from "./rakuten";
import type { BookMetadata } from "./types";

export type TextSearchResult = {
  items: BookMetadata[];
  /** 実際に結果を返したソース。UI で「NDL サーチの結果です」などを出すために使う */
  provider: "google_books" | "rakuten" | "ndl" | null;
  /** Google Books がクォータ超過で使えなかった場合 true */
  googleQuotaExceeded: boolean;
};

/**
 * 自由記述（タイトル・著者など）で書籍を探す。
 *
 * 取得戦略: Google Books（書影・カテゴリが取れる）→ 429 または 0 件なら楽天ブックス（日本の本に強い）
 * → それでも 0 件（未設定・429 を含む）なら NDL サーチ。
 * どの結果も、ISBN があるものは OpenBD でまとめて補完する（書影・説明・ページ数・定価）。
 * 書影がまだ無い本は NDL の書影 API → Google の書影配信で補完する。
 * 結果は isbn13 で重複排除する（ISBN 無しはタイトル+著者で判定）。
 */
export async function searchBooksByText(
  query: string,
  maxResults = 20,
): Promise<TextSearchResult> {
  const q = query.trim();
  if (!q) return { items: [], provider: null, googleQuotaExceeded: false };

  let googleQuotaExceeded = false;
  let items: BookMetadata[] = [];
  let provider: TextSearchResult["provider"] = null;

  try {
    items = await searchGoogleBooksByKeyword(q, maxResults);
    if (items.length) {
      provider = "google_books";
      items = await enrichWithOpenBd(items);
    }
  } catch (e) {
    if (e instanceof GoogleBooksQuotaError) googleQuotaExceeded = true;
    // それ以外のネットワークエラーもフォールバックへ
  }

  if (items.length === 0) {
    try {
      const rakuten = await searchRakutenByKeyword(q, maxResults);
      if (rakuten.length) {
        provider = "rakuten";
        items = await enrichWithOpenBd(rakuten);
      }
    } catch (e) {
      // 429 もネットワークエラーも NDL へ
      if (!(e instanceof RakutenQuotaError)) console.error("rakuten search failed", e);
    }
  }

  if (items.length === 0) {
    const ndl = await searchNdlByKeyword(q, maxResults).catch(() => [] as BookMetadata[]);
    if (ndl.length) {
      provider = "ndl";
      items = await enrichWithOpenBd(ndl);
    }
  }

  // 書影が無い本は NDL の書影 API → Google の書影配信（どちらも API クォータ外）で補完する
  const withCovers = await fillMissingCovers(dedupe(items));
  return { items: withCovers, provider, googleQuotaExceeded };
}

/** OpenBD の書影・説明・ページ数・定価で足りない項目を埋める。OpenBD に無いものはそのまま */
async function enrichWithOpenBd(items: BookMetadata[]): Promise<BookMetadata[]> {
  const isbns = items.map((b) => b.isbn13).filter((s): s is string => !!s);
  if (isbns.length === 0) return items;

  const openbd = await fetchManyFromOpenBd(isbns).catch(
    () => new Map<string, BookMetadata>(),
  );
  return items.map((b) => {
    const o = b.isbn13 ? openbd.get(b.isbn13) : undefined;
    if (!o) return b;
    return {
      ...b,
      coverUrl: b.coverUrl ?? o.coverUrl,
      description: b.description ?? o.description,
      publisher: b.publisher ?? o.publisher,
      publishedDate: b.publishedDate ?? o.publishedDate,
      pageCount: b.pageCount ?? o.pageCount,
      listPrice: b.listPrice ?? o.listPrice,
    };
  });
}

function dedupe(items: BookMetadata[]): BookMetadata[] {
  const seen = new Set<string>();
  return items.filter((b) => {
    const key = b.isbn13 ?? `${b.title}|${b.authors.join(",")}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
