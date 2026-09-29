import type { Metadata } from "next";
import Link from "next/link";

import { BookCard } from "@/components/books/book-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BOOK_STATUSES, STATUS_LABELS } from "@/lib/books/schema";
import { createClient } from "@/lib/supabase/server";
import type { BookStatus } from "@/lib/types/enums";

export const metadata: Metadata = { title: "蔵書" };

/**
 * M2: 蔵書一覧（ステータスタブ + 件数）。
 * `(list)` ルートグループに置き、loading.tsx のスケルトンを /books/[id] などに波及させない。
 */
export default async function BooksPage({ searchParams }: PageProps<"/books">) {
  const params = await searchParams;
  const status = (
    BOOK_STATUSES.some((s) => s === params.status) ? params.status : "reading"
  ) as BookStatus;

  const supabase = await createClient();
  const [{ data: userBooks }, { data: statusRows }] = await Promise.all([
    supabase
      .from("user_books")
      .select("id, status, rating, started_at, completed_at, books(title, authors, cover_url)")
      .eq("status", status)
      .order("updated_at", { ascending: false }),
    // タブの件数。個人の蔵書規模なら status 列だけ全件取って数えれば足りる
    supabase.from("user_books").select("status"),
  ]);

  const counts = Object.fromEntries(BOOK_STATUSES.map((s) => [s, 0])) as Record<
    BookStatus,
    number
  >;
  for (const row of statusRows ?? []) counts[row.status as BookStatus]++;

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
              <Link href={`/books?status=${s}`}>
                {STATUS_LABELS[s]}
                <span className="text-xs tabular-nums text-muted-foreground">{counts[s]}</span>
              </Link>
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
            <BookCard
              key={ub.id}
              userBookId={ub.id}
              status={ub.status as BookStatus}
              rating={ub.rating}
              startedAt={ub.started_at}
              completedAt={ub.completed_at}
              book={ub.books}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
