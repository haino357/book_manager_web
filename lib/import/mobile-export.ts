import { z } from "zod";

import type { BookStatus, MemoType } from "@/lib/types/database";

/**
 * モバイル haino357/book_manager Issue #24 のエクスポート JSON → v2 スキーマ変換。
 *
 * TODO(#24): モバイル側の形式が確定したら以下のスキーマを合わせる。
 * 現状はモバイルの sqflite スキーマ（lib/database/database_helper.dart）から推定した暫定形。
 *
 * 変換ポイント:
 *   - id は INTEGER 自動採番 → uuid は Supabase 側で default 生成。親子関係は旧 id で解決する
 *   - status は INTEGER（enum index）→ text
 */

/** モバイルの status enum index → v2 の文字列 */
const MOBILE_STATUS: Record<number, BookStatus> = {
  0: "unread",
  1: "reading",
  2: "completed",
};

const MEMO_TYPES = [
  "note",
  "quote",
  "summary",
  "review",
  "vocabulary",
  "action",
] as const satisfies readonly MemoType[];

/** モバイルの memo type enum index → v2 の文字列（順序はモバイルの enum 定義に合わせる） */
const MOBILE_MEMO_TYPE: Record<number, MemoType> = Object.fromEntries(
  MEMO_TYPES.map((t, i) => [i, t]),
) as Record<number, MemoType>;

const statusSchema = z.union([
  z.number().int().transform((n) => MOBILE_STATUS[n] ?? "unread"),
  z.enum(["wishlist", "unread", "reading", "completed"]),
]);

const memoTypeSchema = z.union([
  z.number().int().transform((n) => MOBILE_MEMO_TYPE[n] ?? "note"),
  z.enum(MEMO_TYPES),
]);

export const mobileExportSchema = z.object({
  version: z.number().int().optional(),
  exported_at: z.string().optional(),
  books: z.array(
    z.object({
      id: z.number().int(),
      isbn: z.string().nullable().optional(),
      title: z.string(),
      authors: z.union([z.string(), z.array(z.string())]).nullable().optional(),
      publisher: z.string().nullable().optional(),
      published_date: z.string().nullable().optional(),
      thumbnail_url: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      status: statusSchema,
      started_at: z.string().nullable().optional(),
      completed_at: z.string().nullable().optional(),
      created_at: z.string().nullable().optional(),
      updated_at: z.string().nullable().optional(),
    }),
  ),
  reading_histories: z
    .array(
      z.object({
        id: z.number().int(),
        book_id: z.number().int(),
        started_at: z.string().nullable().optional(),
        completed_at: z.string().nullable().optional(),
      }),
    )
    .default([]),
  book_memos: z
    .array(
      z.object({
        id: z.number().int(),
        book_id: z.number().int(),
        type: memoTypeSchema,
        content: z.string(),
        page: z.number().int().nullable().optional(),
        section: z.string().nullable().optional(),
        is_completed: z
          .union([z.boolean(), z.number().int()])
          .nullable()
          .optional()
          .transform((v) => (v == null ? null : Boolean(v))),
        created_at: z.string().nullable().optional(),
        updated_at: z.string().nullable().optional(),
      }),
    )
    .default([]),
});

export type MobileExport = z.infer<typeof mobileExportSchema>;

/** v2 スキーマへ投入する直前の中間表現（旧 id をキーに親子を紐づける） */
export type ImportPlan = {
  books: {
    mobileId: number;
    book: {
      isbn13: string | null;
      isbn10: string | null;
      title: string;
      authors: string[];
      publisher: string | null;
      published_date: string | null;
      cover_url: string | null;
      description: string | null;
    };
    userBook: {
      status: BookStatus;
      started_at: string | null;
      completed_at: string | null;
    };
    histories: { started_at: string | null; completed_at: string | null }[];
    memos: {
      type: MemoType;
      content: string;
      page: number | null;
      section: string | null;
      is_completed: boolean | null;
    }[];
  }[];
};

export function parseMobileExport(json: unknown): MobileExport {
  return mobileExportSchema.parse(json);
}

export function buildImportPlan(data: MobileExport): ImportPlan {
  return {
    books: data.books.map((b) => {
      const digits = (b.isbn ?? "").replace(/[^0-9Xx]/g, "");
      return {
        mobileId: b.id,
        book: {
          isbn13: digits.length === 13 ? digits : null,
          isbn10: digits.length === 10 ? digits : null,
          title: b.title,
          authors: Array.isArray(b.authors)
            ? b.authors
            : b.authors
              ? b.authors.split(/[,、]/).map((a) => a.trim()).filter(Boolean)
              : [],
          publisher: b.publisher ?? null,
          published_date: toDate(b.published_date),
          cover_url: b.thumbnail_url ?? null,
          description: b.description ?? null,
        },
        userBook: {
          status: b.status,
          started_at: toDate(b.started_at),
          completed_at: toDate(b.completed_at),
        },
        histories: data.reading_histories
          .filter((h) => h.book_id === b.id)
          .map((h) => ({
            started_at: toDate(h.started_at),
            completed_at: toDate(h.completed_at),
          })),
        memos: data.book_memos
          .filter((m) => m.book_id === b.id)
          .map((m) => ({
            type: m.type,
            content: m.content,
            page: m.page ?? null,
            section: m.section ?? null,
            is_completed: m.is_completed ?? null,
          })),
      };
    }),
  };
}

/** ISO 8601 文字列 → YYYY-MM-DD（date 型に入れる） */
function toDate(value?: string | null): string | null {
  if (!value) return null;
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}
