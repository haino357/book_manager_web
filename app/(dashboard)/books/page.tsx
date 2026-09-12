import type { Metadata } from "next";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import type { BookStatus } from "@/lib/types/enums";

export const metadata: Metadata = { title: "蔵書" };

const STATUS_TABS: { value: BookStatus; label: string }[] = [
  { value: "wishlist", label: "欲しい本" },
  { value: "unread", label: "積読" },
  { value: "reading", label: "読書中" },
  { value: "completed", label: "読了" },
];

/**
 * M2: 蔵書一覧（ステータスタブ）。
 * TODO: BookCard コンポーネント（components/books/）、タブ切替を searchParams に反映
 */
export default async function BooksPage({ searchParams }: PageProps<"/books">) {
  const params = await searchParams;
  const status = (
    STATUS_TABS.some((t) => t.value === params.status) ? params.status : "reading"
  ) as BookStatus;

  const supabase = await createClient();
  const { data: userBooks } = await supabase
    .from("user_books")
    .select("id, status, rating, started_at, completed_at, books(title, authors, cover_url)")
    .eq("status", status)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">蔵書</h1>
      <Tabs value={status}>
        <TabsList>
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} asChild>
              <a href={`/books?status=${t.value}`}>{t.label}</a>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {!userBooks?.length ? (
        <p className="text-muted-foreground">この状態の本はまだありません。</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userBooks.map((ub) => (
            <li key={ub.id} className="rounded-lg border p-4">
              <a href={`/books/${ub.id}`} className="font-medium hover:underline">
                {ub.books?.title}
              </a>
              <p className="text-sm text-muted-foreground">
                {ub.books?.authors?.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
