import type { Metadata } from "next";
import Link from "next/link";

import { SearchBox } from "@/components/books/search-box";
import { SearchResultCard } from "@/components/books/search-result-card";
import { Button } from "@/components/ui/button";
import { searchBooksByText } from "@/lib/books/text-search";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "書籍を検索" };

const MAX_RESULTS = 20;

/**
 * 自由記述検索の結果一覧。
 * Google Books → NDL サーチ（OpenBD で書影補完）の順に探し、本棚にある本は「登録済み」を付ける。
 */
export default async function BookSearchPage({ searchParams }: PageProps<"/books/search">) {
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";

  const result = q ? await searchBooksByText(q, MAX_RESULTS) : null;

  // 本棚にある本（isbn13 で照合）
  const registered = new Map<string, string>();
  if (result?.items.length) {
    const isbns = result.items.map((b) => b.isbn13).filter((s): s is string => !!s);
    if (isbns.length) {
      const supabase = await createClient();
      const { data } = await supabase
        .from("user_books")
        .select("id, books!inner(isbn13)")
        .in("books.isbn13", isbns);
      for (const row of data ?? []) {
        if (row.books?.isbn13) registered.set(row.books.isbn13, row.id);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">書籍を検索</h1>
        <p className="text-sm text-muted-foreground">
          タイトルや著者名で探して、そのまま本棚に登録できます。ISBN が分かっている場合は
          <Link href="/books/add" className="ml-1 underline">
            ISBN で登録
          </Link>
          の方が確実です。
        </p>
      </div>

      <SearchBox defaultValue={q} autoFocus={!q} />

      {result && (
        <section aria-live="polite" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-muted-foreground">
            <p>
              「{q}」の検索結果 {result.items.length} 件
              {result.items.length >= MAX_RESULTS && "（上位のみ表示）"}
            </p>
            {result.provider && (
              <p>
                ソース: {result.provider === "google_books" ? "Google Books" : "NDL サーチ + OpenBD"}
              </p>
            )}
          </div>

          {result.googleQuotaExceeded && (
            <p className="rounded-md bg-muted p-3 text-sm">
              Google Books がクォータ超過のため NDL サーチで検索しました。書影やカテゴリが付かないことがあります。
              <code className="ml-1">GOOGLE_BOOKS_API_KEY</code> を設定すると解消します。
            </p>
          )}

          {result.items.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">見つかりませんでした。別のキーワードで試すか、手動で登録してください。</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/books/add">手動で登録する</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {result.items.map((book, i) => (
                <SearchResultCard
                  key={book.isbn13 ?? `${book.title}-${i}`}
                  book={book}
                  registeredUserBookId={book.isbn13 ? registered.get(book.isbn13) : undefined}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
