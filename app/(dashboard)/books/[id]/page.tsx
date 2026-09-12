import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "書籍詳細" };

/**
 * M2: 書籍詳細・6 種別メモ・ステータス遷移・編集。
 * TODO:
 *   - components/memos/memo-list.tsx（種別タブ）、memo-form.tsx、action の完了トグル
 *   - components/books/status-select.tsx（reading → started_at、completed → completed_at + reading_histories）
 *   - M3: components/books/rating-stars.tsx
 */
export default async function BookDetailPage({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: userBook } = await supabase
    .from("user_books")
    .select("*, books(*), book_memos(*), reading_histories(*)")
    .eq("id", id)
    .maybeSingle();

  if (!userBook) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{userBook.books?.title}</h1>
      <p className="text-muted-foreground">
        {userBook.books?.authors?.join(", ")} / {userBook.books?.publisher}
      </p>
      <p className="text-sm">
        ステータス: {userBook.status} / メモ {userBook.book_memos.length} 件
      </p>
    </div>
  );
}
