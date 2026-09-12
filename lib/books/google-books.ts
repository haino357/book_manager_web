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

/** キー無しの共有クォータは 429 になりやすい。呼び出し側でフォールバックする */
export class GoogleBooksQuotaError extends Error {
  constructor() {
    super("Google Books API quota exceeded");
    this.name = "GoogleBooksQuotaError";
  }
}

function buildUrl(q: string, maxResults: number): URL {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", q);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("printType", "books");
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) url.searchParams.set("key", apiKey);
  return url;
}

async function fetchVolumes(q: string, maxResults: number): Promise<VolumesResponse | null> {
  const res = await fetch(buildUrl(q, maxResults), {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (res.status === 429) throw new GoogleBooksQuotaError();
  if (!res.ok) return null;
  return (await res.json()) as VolumesResponse;
}

/** volumeInfo → BookMetadata。title が無いものは null */
function mapVolume(info: VolumeInfo | undefined, fallbackIsbn13: string | null = null): BookMetadata | null {
  if (!info?.title) return null;

  const ids = info.industryIdentifiers ?? [];
  const id13 = ids.find((i) => i.type === "ISBN_13")?.identifier ?? fallbackIsbn13;
  const id10 = ids.find((i) => i.type === "ISBN_10")?.identifier ?? null;

  // http → https に寄せる（Google Books はしばしば http を返す）
  const cover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null;

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

/**
 * Google Books API で ISBN 検索する（優先）。
 * モバイル lib/services/book_search_service.dart と同じソース。categories が取れる。
 */
export async function fetchFromGoogleBooks(isbn: string): Promise<BookMetadata | null> {
  const { isbn13 } = normalizeIsbn(isbn);
  const q = isbn13 ?? isbn.replace(/[^0-9Xx]/g, "");
  if (!q) return null;

  const data = await fetchVolumes(`isbn:${q}`, 1);
  return mapVolume(data?.items?.[0]?.volumeInfo, isbn13);
}

/**
 * Google Books API でキーワード検索する（タイトル・著者などの全文）。
 * モバイルは `intitle:` を使うが、著者名でも探せるように素の q で投げる。
 * 429 のときは GoogleBooksQuotaError を投げる（呼び出し側で NDL にフォールバック）。
 */
export async function searchGoogleBooksByKeyword(
  keyword: string,
  maxResults = 20,
): Promise<BookMetadata[]> {
  const q = keyword.trim();
  if (!q) return [];

  const data = await fetchVolumes(q, Math.min(maxResults, 40));
  return (data?.items ?? [])
    .map((item) => mapVolume(item.volumeInfo))
    .filter((b): b is BookMetadata => b !== null);
}
