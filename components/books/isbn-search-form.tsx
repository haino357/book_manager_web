"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { BookCover } from "@/components/books/book-cover";
import { StatusSelect } from "@/components/books/status-select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { createUserBook, type CreateUserBookError } from "@/lib/actions/books";
import { SOURCE_LABELS } from "@/lib/books/schema";
import type { BookMetadata } from "@/lib/books/types";
import { normalizeIsbn } from "@/lib/books/types";
import type { BookStatus } from "@/lib/types/enums";

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; book: BookMetadata }
  | { kind: "not_found"; isbn: string }
  | { kind: "error"; message: string };

type Props = {
  /** 見つからなかったときに「手動で入力する」を押した場合に呼ばれる */
  onSwitchToManual: (isbn: string) => void;
};

/**
 * ISBN 入力 → /api/books/search（Google Books → OpenBD）→ プレビュー → ステータス選択 → 登録。
 * 外部 API はクライアントから直接呼ばず、必ず BFF を経由する（CLAUDE.md 規約）。
 */
export function IsbnSearchForm({ onSwitchToManual }: Props) {
  const [isbn, setIsbn] = useState("");
  const [search, setSearch] = useState<SearchState>({ kind: "idle" });
  const [status, setStatus] = useState<BookStatus>("unread");
  const [actionError, setActionError] = useState<CreateUserBookError | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionError(null);

    const normalized = normalizeIsbn(isbn);
    if (!normalized.isbn13) {
      setSearch({ kind: "error", message: "ISBN は 10 桁または 13 桁で入力してください" });
      return;
    }

    setSearch({ kind: "loading" });
    try {
      const res = await fetch(
        `/api/books/search?isbn=${encodeURIComponent(normalized.isbn13)}`,
      );
      if (res.status === 404) {
        setSearch({ kind: "not_found", isbn: normalized.isbn13 });
        return;
      }
      if (res.status === 401) {
        setSearch({ kind: "error", message: "ログインが必要です。再度ログインしてください" });
        return;
      }
      if (!res.ok) {
        setSearch({ kind: "error", message: `検索に失敗しました（${res.status}）` });
        return;
      }
      const book = (await res.json()) as BookMetadata;
      setSearch({ kind: "found", book });
    } catch {
      setSearch({ kind: "error", message: "検索に失敗しました。通信環境を確認してください" });
    }
  }

  function handleRegister(book: BookMetadata) {
    setActionError(null);
    startTransition(async () => {
      // 成功時は Server Action 内で /books/[id] へ redirect される
      const result = await createUserBook({ metadata: book, status });
      if (result?.error) setActionError(result);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-2">
        <Label htmlFor="isbn">ISBN</Label>
        <div className="flex gap-2">
          <Input
            id="isbn"
            name="isbn"
            inputMode="numeric"
            autoComplete="off"
            placeholder="978-4-87311-969-4"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            disabled={search.kind === "loading"}
            className="max-w-xs"
          />
          <Button type="submit" disabled={search.kind === "loading" || !isbn.trim()}>
            {search.kind === "loading" ? "検索中…" : "検索"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          ハイフンあり・なしどちらでも可。ISBN-10 は自動で ISBN-13 に変換します。
        </p>
        {search.kind === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {search.message}
          </p>
        )}
      </form>

      {search.kind === "loading" && (
        <Card>
          <CardContent className="flex gap-4 pt-6">
            <Skeleton className="aspect-[2/3] w-24 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}

      {search.kind === "not_found" && (
        <Card>
          <CardHeader>
            <CardTitle>見つかりませんでした</CardTitle>
            <CardDescription>
              ISBN {search.isbn} は Google Books にも OpenBD にも登録がありません。手動で入力して登録できます。
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => onSwitchToManual(search.isbn)}>
              手動で入力する
            </Button>
          </CardFooter>
        </Card>
      )}

      {search.kind === "found" && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row">
            <BookCover src={search.book.coverUrl} title={search.book.title} />
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-lg font-semibold leading-tight">{search.book.title}</h2>
              <p className="text-sm text-muted-foreground">
                {search.book.authors.length ? search.book.authors.join(", ") : "著者不明"}
              </p>
              <p className="text-sm text-muted-foreground">
                {[search.book.publisher, search.book.publishedDate].filter(Boolean).join(" / ")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{SOURCE_LABELS[search.book.source]}</Badge>
                {search.book.isbn13 && <Badge variant="secondary">ISBN {search.book.isbn13}</Badge>}
                {search.book.categories.map((c) => (
                  <Badge key={c} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </div>
              {search.book.description && (
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {search.book.description}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="status">ステータス</Label>
              <StatusSelect id="status" value={status} onChange={setStatus} disabled={pending} />
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Button onClick={() => handleRegister(search.book)} disabled={pending}>
                {pending ? "登録中…" : "この本を登録する"}
              </Button>
              {actionError && (
                <p role="alert" className="text-sm text-destructive">
                  {actionError.error}
                  {actionError.existingUserBookId && (
                    <>
                      {" "}
                      <Link
                        href={`/books/${actionError.existingUserBookId}`}
                        className="underline"
                      >
                        登録済みの本を見る
                      </Link>
                    </>
                  )}
                </p>
              )}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
