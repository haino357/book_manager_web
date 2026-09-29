import { fetchFromGoogleBooks } from "./google-books";
import { resolveGoogleCover } from "./google-cover";
import { fetchFromOpenBd } from "./openbd";
import type { BookMetadata } from "./types";

/**
 * 取得戦略: Google Books を正とし、OpenBD で書影・出版社・ページ数・定価を補完 → どちらも無ければ null（手動入力へ）。
 * 定価（税抜）は OpenBD からしか取れないので、両方を並列に引く。
 * 書影がどちらにも無ければ Google の書影配信（API クォータ外）を試す。
 */
export async function searchBookByIsbn(
  isbn: string,
): Promise<BookMetadata | null> {
  const [google, openbd] = await Promise.all([
    fetchFromGoogleBooks(isbn).catch(() => null),
    fetchFromOpenBd(isbn).catch(() => null),
  ]);
  let book: BookMetadata | null;
  if (!google) book = openbd;
  else if (!openbd) book = google;
  else {
    // Google Books の結果を正としつつ、足りない項目を OpenBD で補完
    book = {
      ...google,
      coverUrl: google.coverUrl ?? openbd.coverUrl,
      publisher: google.publisher ?? openbd.publisher,
      description: google.description ?? openbd.description,
      pageCount: google.pageCount ?? openbd.pageCount,
      listPrice: google.listPrice ?? openbd.listPrice,
    };
  }

  if (book && !book.coverUrl && book.isbn13) {
    const cover = await resolveGoogleCover(book.isbn13);
    if (cover) book = { ...book, coverUrl: cover };
  }
  return book;
}
