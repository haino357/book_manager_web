import type { Metadata } from "next";

export const metadata: Metadata = { title: "書籍を登録" };

/**
 * M2: 書籍登録。
 * TODO:
 *   - ISBN 入力 → /api/books/search を叩いてプレビュー → lib/actions/books.createUserBook
 *   - 見つからなければ手動入力フォーム（React Hook Form + Zod）
 * 対応コンポーネント: components/books/isbn-search-form.tsx, components/books/manual-book-form.tsx
 */
export default function AddBookPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">書籍を登録</h1>
      <p className="text-muted-foreground">
        ISBN 検索（Google Books → OpenBD）と手動入力フォームをここに実装する（M2）。
      </p>
    </div>
  );
}
