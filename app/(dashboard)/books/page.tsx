import type { Metadata } from "next";
import Link from "next/link";

import { BookCover } from "@/components/books/book-cover";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BOOK_STATUSES, STATUS_LABELS } from "@/lib/books/schema";
import { createClient } from "@/lib/supabase/server";
import type { BookStatus } from "@/lib/types/enums";

export const metadata: Metadata = { title: "蔵書" };

/**
 * M2: 蔵書一覧（ステータスタブ）。
 * TODO(#7): BookCard コンポーネントへ切り出し、評価・日付の表示を追加
 */
export default async function BooksPage({ searchParams }: PageProps<"/books">) {
  const params = await searchParams;
  const status = (
    BOOK_STATUSES.some((s) => s === params.status) ? params.status : "reading"
  ) as BookStatus;

  const supabase = await createClient();
  const { data: userBooks } = await supabase
    .from("user_books")
    .select("id, status, rating, started_at, completed_at, books(title, authors, cover_url)")
    .eq("status", status)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">蔵書</h1>
        <Button asChild size="sm">
          <Link href="/books/add">書籍を登録</Link>
        </Button>
      </div>
      <Tabs value={status}>
        <TabsList>
          {BOOK_STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} asChild>
              <Link href={`/books?status=${s}`}>{STATUS_LABELS[s]}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {!userBooks?.length ? (
        <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            「{STATUS_LABELS[status]}」の本はまだありません。
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/books/add">書籍を登録する</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userBooks.map((ub) => (
            <li key={ub.id} className="flex gap-3 rounded-lg border p-3">
              <BookCover
                src={ub.books?.cover_url}
                title={ub.books?.title ?? ""}
                className="w-16"
              />
              <div className="min-w-0">
                <Link
                  href={`/books/${ub.id}`}
                  className="line-clamp-2 font-medium leading-snug hover:underline"
                >
                  {ub.books?.title}
                </Link>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {ub.books?.authors?.join(", ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
