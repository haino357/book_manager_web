import { StarIcon } from "lucide-react";
import Link from "next/link";

import { BookCover } from "@/components/books/book-cover";
import { UserBookStatusSelect } from "@/components/books/user-book-status-select";
import { formatDate } from "@/lib/dates";
import type { BookStatus } from "@/lib/types/enums";
import { cn } from "@/lib/utils";

type Props = {
  userBookId: string;
  status: BookStatus;
  /** 1〜5。未評価は null */
  rating: number | null;
  startedAt: string | null;
  completedAt: string | null;
  book: {
    title: string;
    authors: string[] | null;
    cover_url: string | null;
  } | null;
};

/**
 * 蔵書一覧の 1 冊。書影・タイトル・著者・★評価・ステータス・読書日付。
 * ステータスはカード上のセレクトから直接変更できる（日付の自動セットは updateStatus）。
 * 評価の編集は詳細画面（RatingStars）で行い、ここでは表示のみ。
 */
export function BookCard({ userBookId, status, rating, startedAt, completedAt, book }: Props) {
  const title = book?.title ?? "（タイトル不明）";
  const dates =
    status === "completed" && completedAt
      ? `${formatDate(completedAt)} 読了`
      : status === "reading" && startedAt
        ? `${formatDate(startedAt)} から`
        : null;

  return (
    <li className="relative flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <BookCover src={book?.cover_url} title={title} className="w-16" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* カード全体をクリック可能にする（after: で li を覆う） */}
        <Link
          href={`/books/${userBookId}`}
          className="line-clamp-2 font-medium leading-snug after:absolute after:inset-0 after:content-[''] hover:underline"
        >
          {title}
        </Link>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {book?.authors?.length ? book.authors.join(", ") : "著者不明"}
        </p>
        {rating != null && <RatingDisplay rating={rating} />}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {/* カード全体のリンク（after:）より前面に出してクリックを奪われないようにする */}
          <UserBookStatusSelect
            userBookId={userBookId}
            status={status}
            size="sm"
            className="relative z-10 w-28"
          />
          {dates && <span className="text-xs text-muted-foreground">{dates}</span>}
        </div>
      </div>
    </li>
  );
}

function RatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`評価 ${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          aria-hidden
          className={cn(
            "size-3.5",
            n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}
