import { createHash } from "node:crypto";

import type { BookMetadata } from "./types";

/**
 * Google Books の書影配信 URL（Books API とは別系統で、API クォータを消費しない）。
 * 存在しない ISBN でも 200 で「画像なし」のプレースホルダー画像が返るため、
 * ハッシュで判定して本物の書影だけを採用する。
 */
export function googleCoverUrl(isbn13: string): string {
  return `https://books.google.com/books/content?vid=ISBN${isbn13}&printsec=frontcover&img=1&zoom=1`;
}

/** 観測済みのプレースホルダー（1269 バイトの「image not available」）。実行時にも 1 件取得して補強する */
const KNOWN_PLACEHOLDER_HASHES = new Set(["e3f8c414b288cbdf"]);
/** これより小さい画像は書影ではないとみなす（プレースホルダーは 1.3KB、実物は 6KB 以上） */
const MIN_COVER_BYTES = 2000;
/** 実在しない ISBN（チェックデジットは正しい）。プレースホルダーの現在のハッシュを取るために使う */
const PROBE_ISBN = "9784999999995";

const CONCURRENCY = 8;
const REVALIDATE = 60 * 60 * 24 * 7;

let placeholderProbe: Promise<void> | null = null;

function hashOf(buf: ArrayBuffer): string {
  return createHash("sha256").update(Buffer.from(buf)).digest("hex").slice(0, 16);
}

async function fetchImage(url: string): Promise<ArrayBuffer | null> {
  const res = await fetch(url, { next: { revalidate: REVALIDATE } }).catch(() => null);
  if (!res?.ok) return null;
  if (!res.headers.get("content-type")?.startsWith("image/")) return null;
  return res.arrayBuffer();
}

/** プレースホルダー画像が差し替わっても追従できるよう、起動後 1 回だけ実物を取ってハッシュに加える */
function ensurePlaceholderHash(): Promise<void> {
  placeholderProbe ??= (async () => {
    const buf = await fetchImage(googleCoverUrl(PROBE_ISBN));
    if (buf) KNOWN_PLACEHOLDER_HASHES.add(hashOf(buf));
  })().catch(() => {
    placeholderProbe = null; // 失敗したら次回やり直す
  });
  return placeholderProbe;
}

/**
 * ISBN-13 に対応する Google の書影が実在すれば URL を、プレースホルダーなら null を返す。
 */
export async function resolveGoogleCover(isbn13: string): Promise<string | null> {
  if (!/^\d{13}$/.test(isbn13)) return null;
  await ensurePlaceholderHash();

  const url = googleCoverUrl(isbn13);
  const buf = await fetchImage(url);
  if (!buf) return null;
  if (buf.byteLength < MIN_COVER_BYTES) return null;
  if (KNOWN_PLACEHOLDER_HASHES.has(hashOf(buf))) return null;
  return url;
}

/**
 * 書影の無い本に Google の書影を補完する（ISBN 無し・既に書影ありはそのまま）。
 * 同時実行数を抑えつつ並列に解決する。
 */
export async function fillMissingCovers(items: BookMetadata[]): Promise<BookMetadata[]> {
  const targets = items
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => !b.coverUrl && b.isbn13);
  if (targets.length === 0) return items;

  const resolved = new Map<number, string | null>();
  for (let start = 0; start < targets.length; start += CONCURRENCY) {
    const chunk = targets.slice(start, start + CONCURRENCY);
    const urls = await Promise.all(chunk.map(({ b }) => resolveGoogleCover(b.isbn13!)));
    chunk.forEach(({ i }, k) => resolved.set(i, urls[k]));
  }

  return items.map((b, i) => {
    const url = resolved.get(i);
    return url ? { ...b, coverUrl: url } : b;
  });
}
