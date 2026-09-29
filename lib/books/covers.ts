import { resolveGoogleCover } from "./google-cover";
import { resolveNdlCover } from "./ndl-cover";
import type { BookMetadata } from "./types";

const CONCURRENCY = 8;

/**
 * API の結果に書影が無い本の補完。NDL サーチの書影 API（JPRO）→ Google の書影配信の順に試す。
 * どちらも API クォータを消費しない。
 */
export async function resolveCover(isbn13: string): Promise<string | null> {
  return (await resolveNdlCover(isbn13)) ?? (await resolveGoogleCover(isbn13));
}

/** 書影の無い本をまとめて補完する（ISBN 無し・既に書影ありはそのまま）。同時実行数を抑えて並列に解決 */
export async function fillMissingCovers(items: BookMetadata[]): Promise<BookMetadata[]> {
  const targets = items
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => !b.coverUrl && b.isbn13);
  if (targets.length === 0) return items;

  const resolved = new Map<number, string | null>();
  for (let start = 0; start < targets.length; start += CONCURRENCY) {
    const chunk = targets.slice(start, start + CONCURRENCY);
    const urls = await Promise.all(chunk.map(({ b }) => resolveCover(b.isbn13!)));
    chunk.forEach(({ i }, k) => resolved.set(i, urls[k]));
  }

  return items.map((b, i) => {
    const url = resolved.get(i);
    return url ? { ...b, coverUrl: url } : b;
  });
}
