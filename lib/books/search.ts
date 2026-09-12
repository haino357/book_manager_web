import { fetchFromGoogleBooks } from "./google-books";
import { fetchFromOpenBd } from "./openbd";
import type { BookMetadata } from "./types";

/**
 * 取得戦略: Google Books → 失敗または書影なしなら OpenBD で補完 → それでもなければ null（手動入力へ）。
 */
export async function searchBookByIsbn(
  isbn: string,
): Promise<BookMetadata | null> {
  const google = await fetchFromGoogleBooks(isbn).catch(() => null);
  if (google?.coverUrl) return google;

  const openbd = await fetchFromOpenBd(isbn).catch(() => null);
  if (!google) return openbd;
  if (!openbd) return google;

  // Google Books の結果を正としつつ、書影・出版社を OpenBD で補完
  return {
    ...google,
    coverUrl: google.coverUrl ?? openbd.coverUrl,
    publisher: google.publisher ?? openbd.publisher,
    description: google.description ?? openbd.description,
  };
}
