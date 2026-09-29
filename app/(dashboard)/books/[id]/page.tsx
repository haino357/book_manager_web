import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCover } from "@/components/books/book-cover";
import { BookDetailsForm } from "@/components/books/book-details-form";
import { RatingStars } from "@/components/books/rating-stars";
import { ReadingDatesForm } from "@/components/books/reading-dates-form";
import { StoreLinks } from "@/components/books/store-links";
import { UserBookStatusSelect } from "@/components/books/user-book-status-select";
import { Separator } from "@/components/ui/separator";
import { amazonAssociateTag, buildStoreLinks } from "@/lib/books/store-links";
import { formatDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { BookStatus } from "@/lib/types/enums";

export const metadata: Metadata = { title: "書籍詳細" };

/**
 * M2: 書籍詳細・ステータス遷移・読書日付・再読履歴。
 * TODO:
 *   - #8: components/memos/memo-list.tsx（種別タブ）、memo-form.tsx、action の完了トグル
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

  const book = userBook.books;
  const title = book?.title ?? "（タイトル不明）";
  // 読了日の新しい順。読了日が無い行（未完了）は先頭
  const histories = [...userBook.reading_histories].sort((a, b) =>
    (b.completed_at ?? "9999").localeCompare(a.completed_at ?? "9999"),
  );
  const meta = [book?.publisher, book?.published_date && formatDate(book.published_date)]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="space-y-8">
      <Link href="/books" className="text-sm text-muted-foreground hover:underline">
        ← 蔵書一覧
      </Link>

      <section className="flex flex-col gap-6 sm:flex-row">
        <BookCover src={book?.cover_url} title={title} className="w-32" />
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-2xl font-bold leading-snug">{title}</h1>
          <p className="text-muted-foreground">
            {book?.authors?.length ? book.authors.join(", ") : "著者不明"}
          </p>
          {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
          {book && (
            <StoreLinks
              links={buildStoreLinks(
                { isbn13: book.isbn13, isbn10: book.isbn10, title: book.title, authors: book.authors },
                amazonAssociateTag(),
              )}
            />
          )}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm text-muted-foreground">ステータス</span>
            <UserBookStatusSelect
              userBookId={userBook.id}
              status={userBook.status as BookStatus}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">評価</span>
            <RatingStars userBookId={userBook.id} rating={userBook.rating} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">読書の記録</h2>
        <p className="text-sm text-muted-foreground">
          「読書中」にすると開始日、「読了」にすると読了日が今日の日付で入ります。
          読了済みの本の日付を直すと、最新の読書履歴にも反映されます。
        </p>
        <ReadingDatesForm
          userBookId={userBook.id}
          startedAt={userBook.started_at}
          completedAt={userBook.completed_at}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">ページ数・金額</h2>
        <BookDetailsForm
          userBookId={userBook.id}
          pageCount={book?.page_count ?? null}
          listPrice={book?.list_price ?? null}
          pricePaid={userBook.price_paid}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          読書履歴
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {histories.length} 回
          </span>
        </h2>
        {histories.length ? (
          <ol className="divide-y rounded-lg border">
            {histories.map((h, i) => (
              <li key={h.id} className="flex gap-4 px-4 py-2 text-sm">
                <span className="w-14 shrink-0 text-muted-foreground tabular-nums">
                  {histories.length - i} 回目
                </span>
                <span className="tabular-nums">
                  {h.started_at ? formatDate(h.started_at) : "開始日不明"} 〜{" "}
                  {h.completed_at ? formatDate(h.completed_at) : "読書中"}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            まだ読了していません。「読了」にすると履歴に追加されます。
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">メモ</h2>
        <p className="text-sm text-muted-foreground">
          {userBook.book_memos.length} 件（メモの追加・編集は準備中です）
        </p>
      </section>
    </div>
  );
}
