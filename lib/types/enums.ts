/**
 * DB の check 制約と対応するリテラル型。
 * `lib/types/database.ts` は `npm run gen:types` で再生成されるため、
 * 手書きのエイリアスはこのファイルに置く。
 * 値を変える場合は `supabase/migrations` の check 制約も合わせて更新する。
 */
export type BookStatus = "wishlist" | "unread" | "reading" | "completed";
export type BookSource = "google_books" | "openbd" | "manual";
export type MemoType =
  | "note"
  | "quote"
  | "summary"
  | "review"
  | "vocabulary"
  | "action";
