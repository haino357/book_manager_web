import { resolveCover } from "./covers";
import { fetchFromGoogleBooks } from "./google-books";
import { fetchFromOpenBd } from "./openbd";
import { fetchFromRakuten } from "./rakuten";
import type { BookMetadata } from "./types";

/**
 * 取得戦略: Google Books・OpenBD・楽天ブックスを並列に引き、Google → OpenBD → 楽天の順に正とする。
 * 足りない項目（書影・出版社・説明・ページ数・定価）は後ろのソースで補完する。
 * 定価（税抜）は OpenBD を優先し、無ければ楽天の税込価格から換算した値を使う。
 * どれにも無ければ null（手動入力へ）。書影がどれにも無ければ NDL の書影 API → Google の書影配信を試す。
 */
export async function searchBookByIsbn(
  isbn: string,
): Promise<BookMetadata | null> {
  const results = await Promise.all([
    fetchFromGoogleBooks(isbn).catch(() => null),
    fetchFromOpenBd(isbn).catch(() => null),
    fetchFromRakuten(isbn).catch(() => null),
  ]);

  let book = mergeMetadata(results);
  if (book && !book.coverUrl && book.isbn13) {
    const cover = await resolveCover(book.isbn13);
    if (cover) book = { ...book, coverUrl: cover };
  }
  return book;
}

/**
 * 先頭のソースを正とし、null・空配列の項目だけを後ろのソースで埋める。
 * source は正としたソースのまま（どの API の結果を元に登録したかを残す）。
 */
export function mergeMetadata(sources: (BookMetadata | null)[]): BookMetadata | null {
  const found = sources.filter((b): b is BookMetadata => b !== null);
  if (found.length === 0) return null;
  const [primary, ...rest] = found;

  const merged = { ...primary };
  for (const other of rest) {
    merged.isbn13 ??= other.isbn13;
    merged.isbn10 ??= other.isbn10;
    merged.publisher ??= other.publisher;
    merged.publishedDate ??= other.publishedDate;
    merged.coverUrl ??= other.coverUrl;
    merged.description ??= other.description;
    merged.pageCount ??= other.pageCount;
    merged.listPrice ??= other.listPrice;
    if (merged.authors.length === 0) merged.authors = other.authors;
    if (merged.categories.length === 0) merged.categories = other.categories;
  }
  return merged;
}
