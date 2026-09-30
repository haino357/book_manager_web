import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "ページが見つかりません" };

/** 404。存在しない URL と、/books/[id] の notFound()（他人の本・削除済み）で出る */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        URL が間違っているか、ページが削除された可能性があります。
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/books">蔵書一覧へ</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">トップへ</Link>
        </Button>
      </div>
    </main>
  );
}
