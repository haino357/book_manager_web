import type { BookSource } from "@/lib/types/enums";

/** 外部 API から取得した書籍メタデータ（books テーブルに保存する前の共通形） */
export type BookMetadata = {
  isbn13: string | null;
  isbn10: string | null;
  title: string;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null; // YYYY-MM-DD / YYYY-MM / YYYY
  coverUrl: string | null;
  description: string | null;
  categories: string[];
  /** ページ数。取れなければ null */
  pageCount: number | null;
  /** 定価（税抜・円）。取れなければ null */
  listPrice: number | null;
  source: BookSource;
};

/** ISBN の正規化: ハイフン・空白を除き、ISBN-10 は ISBN-13 に変換する */
export function normalizeIsbn(input: string): {
  isbn13: string | null;
  isbn10: string | null;
} {
  const raw = input.replace(/[^0-9Xx]/g, "").toUpperCase();
  if (raw.length === 13) return { isbn13: raw, isbn10: null };
  if (raw.length === 10) return { isbn13: isbn10To13(raw), isbn10: raw };
  return { isbn13: null, isbn10: null };
}

export function isbn10To13(isbn10: string): string {
  const core = `978${isbn10.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return `${core}${check}`;
}

/** ISBN-13 → ISBN-10。978 で始まるものだけ変換できる（979 は ISBN-10 が無い） */
export function isbn13To10(isbn13: string): string | null {
  if (!/^978\d{10}$/.test(isbn13)) return null;
  const core = isbn13.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(core[i]) * (10 - i);
  const check = (11 - (sum % 11)) % 11;
  return `${core}${check === 10 ? "X" : check}`;
}
