import type { BookStatus } from "@/lib/types/enums";

type ReadingDates = {
  started_at: string | null;
  completed_at: string | null;
};

/**
 * ステータス変更時に user_books へ書き込む日付の差分。
 * - → reading: started_at が空なら今日。completed からの再読なら started_at を今日で上書きし completed_at を NULL に
 * - → completed: completed_at を今日に（reading_histories への追加は RPC change_user_book_status）
 * - → wishlist / unread: 日付は触らない
 */
export function statusTransitionPatch(
  current: ReadingDates & { status: BookStatus },
  next: BookStatus,
  today: string,
): Partial<ReadingDates> {
  switch (next) {
    case "reading":
      return current.status === "completed"
        ? { started_at: today, completed_at: null }
        : { started_at: current.started_at ?? today };
    case "completed":
      return { completed_at: today };
    case "wishlist":
    case "unread":
      return {};
  }
}
