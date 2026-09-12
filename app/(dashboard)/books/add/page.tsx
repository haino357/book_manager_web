import type { Metadata } from "next";

import { AddBook } from "@/components/books/add-book";

export const metadata: Metadata = { title: "書籍を登録" };

/**
 * 書籍登録。
 * ISBN 検索（/api/books/search → Google Books → OpenBD）と手動入力の 2 タブ。
 * 登録処理は lib/actions/books.createUserBook。
 */
export default function AddBookPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">書籍を登録</h1>
        <p className="text-sm text-muted-foreground">
          ISBN で検索すると書誌情報と書影を自動で取得します。見つからない本は手動で入力できます。
        </p>
      </div>
      <AddBook />
    </div>
  );
}
