import { fetchFromGoogleBooks } from "./google-books";
import { resolveGoogleCover } from "./google-cover";
import { fetchFromOpenBd } from "./openbd";
import type { BookMetadata } from "./types";

/**
 * 取得戦略: Google Books → 失敗または書影なしなら OpenBD で補完 → それでもなければ null（手動入力へ）。
 * 書影がどちらにも無ければ Google の書影配信（API クォータ外）を試す。
 */
export async function searchBookByIsbn(
  isbn: string,
): Promise<BookMetadata | null> {
  const google = await fetchFromGoogleBooks(isbn).catch(() => null);
  if (google?.coverUrl) return google;

  const openbd = await fetchFromOpenBd(isbn).catch(() => null);
  let book: BookMetadata | null;
  if (!google) book = openbd;
  else if (!openbd) book = google;
  else {
    // Google Books の結果を正としつつ、書影・出版社を OpenBD で補完
    book = {
      ...google,
      coverUrl: google.coverUrl ?? openbd.coverUrl,
      publisher: google.publisher ?? openbd.publisher,
      description: google.description ?? openbd.description,
    };
  }

  if (book && !book.coverUrl && book.isbn13) {
    const cover = await resolveGoogleCover(book.isbn13);
    if (cover) book = { ...book, coverUrl: cover };
  }
  return book;
}
