import type { BookMetadata } from "./types";
import { normalizeIsbn } from "./types";

const ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

type VolumeInfo = {
  title?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  categories?: string[];
  industryIdentifiers?: { type: string; identifier: string }[];
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
};

type VolumesResponse = {
  totalItems: number;
  items?: { volumeInfo: VolumeInfo }[];
};

/**
 * Google Books API で ISBN 検索する（優先）。
 * モバイル lib/services/book_search_service.dart と同じソース。categories が取れる。
 */
export async function fetchFromGoogleBooks(
  isbn: string,
): Promise<BookMetadata | null> {
  const { isbn13 } = normalizeIsbn(isbn);
  const q = isbn13 ?? isbn.replace(/[^0-9Xx]/g, "");
  if (!q) return null;

  const url = new URL(ENDPOINT);
  url.searchParams.set("q", `isbn:${q}`);
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) url.searchParams.set("key", apiKey);

  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) return null;

  const data = (await res.json()) as VolumesResponse;
  const info = data.items?.[0]?.volumeInfo;
  if (!info?.title) return null;

  const ids = info.industryIdentifiers ?? [];
  const id13 = ids.find((i) => i.type === "ISBN_13")?.identifier ?? isbn13;
  const id10 = ids.find((i) => i.type === "ISBN_10")?.identifier ?? null;

  // http → https に寄せる（Google Books はしばしば http を返す）
  const cover =
    info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null;

  return {
    isbn13: id13 ?? null,
    isbn10: id10,
    title: info.title,
    authors: info.authors ?? [],
    publisher: info.publisher ?? null,
    publishedDate: info.publishedDate ?? null,
    coverUrl: cover ? cover.replace(/^http:\/\//, "https://") : null,
    description: info.description ?? null,
    categories: info.categories ?? [],
    source: "google_books",
  };
}
