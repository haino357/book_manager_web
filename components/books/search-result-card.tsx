"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { BookCover } from "@/components/books/book-cover";
import { StatusSelect } from "@/components/books/status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createUserBook, type CreateUserBookError } from "@/lib/actions/books";
import { SOURCE_LABELS } from "@/lib/books/schema";
import type { BookMetadata } from "@/lib/books/types";
import type { BookStatus } from "@/lib/types/enums";

type Props = {
  book: BookMetadata;
  /** すでに本棚にある場合の user_books.id */
  registeredUserBookId?: string;
};

/**
 * 検索結果 1 件。書影・書誌 + ステータス選択 + 登録ボタン。
 * 登録済みなら「本棚で見る」リンクに置き換える。
 */
export function SearchResultCard({ book, registeredUserBookId }: Props) {
  const [status, setStatus] = useState<BookStatus>("unread");
  const [actionError, setActionError] = useState<CreateUserBookError | null>(null);
  const [pending, startTransition] = useTransition();

  function handleRegister() {
    setActionError(null);
    startTransition(async () => {
      // 成功時は Server Action 内で /books/[id] へ redirect される
      const result = await createUserBook({ metadata: book, status });
      if (result?.error) setActionError(result);
    });
  }

  const meta = [book.publisher, book.publishedDate].filter(Boolean).join(" / ");

  return (
    <li className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row">
      <BookCover src={book.coverUrl} title={book.title} className="w-20" />
      <div className="min-w-0 flex-1 space-y-2">
        <h2 className="font-semibold leading-snug">{book.title}</h2>
        <p className="text-sm text-muted-foreground">
          {book.authors.length ? book.authors.join(", ") : "著者不明"}
        </p>
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{SOURCE_LABELS[book.source]}</Badge>
          {book.isbn13 ? (
            <Badge variant="secondary">ISBN {book.isbn13}</Badge>
          ) : (
            <Badge variant="secondary">ISBN なし</Badge>
          )}
          {book.categories.slice(0, 4).map((c) => (
            <Badge key={c} variant="secondary">
              {c}
            </Badge>
          ))}
        </div>
        {book.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{book.description}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:w-44 sm:items-stretch">
        {registeredUserBookId ? (
          <>
            <Badge className="w-fit">登録済み</Badge>
            <Button asChild variant="outline" size="sm">
              <Link href={`/books/${registeredUserBookId}`}>本棚で見る</Link>
            </Button>
          </>
        ) : (
          <>
            <StatusSelect
              value={status}
              onChange={setStatus}
              disabled={pending}
              className="w-full"
            />
            <Button size="sm" onClick={handleRegister} disabled={pending}>
              {pending ? "登録中…" : "登録する"}
            </Button>
            {actionError && (
              <p role="alert" className="text-xs text-destructive">
                {actionError.error}
                {actionError.existingUserBookId && (
                  <>
                    {" "}
                    <Link href={`/books/${actionError.existingUserBookId}`} className="underline">
                      本棚で見る
                    </Link>
                  </>
                )}
              </p>
            )}
          </>
        )}
      </div>
    </li>
  );
}
