import { z } from "zod";

import { normalizeIsbn } from "./types";

/**
 * 書籍登録の Zod スキーマ。
 * "use server" ファイルは async 関数しか export できないため、スキーマはここに置く。
 */

export const BOOK_STATUSES = ["wishlist", "unread", "reading", "completed"] as const;
export const BOOK_SOURCES = ["google_books", "openbd", "ndl", "manual"] as const;

export const SOURCE_LABELS: Record<(typeof BOOK_SOURCES)[number], string> = {
  google_books: "Google Books",
  openbd: "OpenBD",
  ndl: "NDL サーチ",
  manual: "手動",
};

export const bookStatusSchema = z.enum(BOOK_STATUSES);

export const STATUS_LABELS: Record<(typeof BOOK_STATUSES)[number], string> = {
  wishlist: "欲しい本",
  unread: "積読",
  reading: "読書中",
  completed: "読了",
};

/** 外部 API / 手動入力の共通形（BookMetadata と同じ構造） */
export const bookMetadataSchema = z.object({
  isbn13: z.string().regex(/^\d{13}$/).nullable(),
  isbn10: z.string().regex(/^\d{9}[\dX]$/).nullable(),
  title: z.string().trim().min(1, "タイトルは必須です").max(500),
  authors: z.array(z.string().trim().min(1)).max(50),
  publisher: z.string().trim().max(200).nullable(),
  publishedDate: z
    .string()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "YYYY / YYYY-MM / YYYY-MM-DD の形式で入力してください")
    .nullable(),
  coverUrl: z.string().url().max(2000).nullable(),
  description: z.string().max(10000).nullable(),
  categories: z.array(z.string().trim().min(1)).max(50),
  source: z.enum(BOOK_SOURCES),
});

export const createUserBookSchema = z.object({
  metadata: bookMetadataSchema,
  status: bookStatusSchema,
});

export type CreateUserBookInput = z.infer<typeof createUserBookSchema>;

/**
 * 手動入力フォームの値（フォーム上は文字列で扱い、送信時に BookMetadata へ変換する）。
 * 空文字は「未入力」とみなして null に落とす。
 */
const emptyToNull = (v: string) => (v.trim() === "" ? null : v.trim());

export const manualBookFormSchema = z.object({
  title: z.string().trim().min(1, "タイトルは必須です").max(500),
  authors: z.string().max(1000),
  publisher: z.string().max(200),
  publishedDate: z
    .string()
    .refine(
      (v) => v.trim() === "" || /^\d{4}(-\d{2}(-\d{2})?)?$/.test(v.trim()),
      "YYYY / YYYY-MM / YYYY-MM-DD の形式で入力してください",
    ),
  isbn: z.string().refine((v) => {
    const raw = v.replace(/[^0-9Xx]/g, "");
    return raw === "" || raw.length === 10 || raw.length === 13;
  }, "ISBN は 10 桁または 13 桁で入力してください"),
  coverUrl: z
    .string()
    .refine(
      (v) => v.trim() === "" || /^https?:\/\/\S+$/.test(v.trim()),
      "http(s):// から始まる URL を入力してください",
    ),
  description: z.string().max(10000),
  status: bookStatusSchema,
});

export type ManualBookFormValues = z.infer<typeof manualBookFormSchema>;

/** 手動入力フォームの値を createUserBook の入力に変換する */
export function manualFormToInput(values: ManualBookFormValues): CreateUserBookInput {
  const { isbn13, isbn10 } = normalizeIsbn(values.isbn);
  return {
    metadata: {
      isbn13,
      isbn10,
      title: values.title.trim(),
      authors: values.authors
        .split(/[,、，]/)
        .map((a) => a.trim())
        .filter(Boolean),
      publisher: emptyToNull(values.publisher),
      publishedDate: emptyToNull(values.publishedDate),
      coverUrl: emptyToNull(values.coverUrl),
      description: emptyToNull(values.description),
      categories: [],
      source: "manual",
    },
    status: values.status,
  };
}

/**
 * Postgres の date 列に入れられる形へ揃える。
 * Google Books は "2012" / "2012-06" を返すことがあるので、月・日を 01 で補う。
 */
export function toPostgresDate(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{4}$/.test(value)) return `${value}-01-01`;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}
