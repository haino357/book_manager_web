import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "インポート" };

/**
 * M2: モバイル #24 エクスポート JSON の取り込み。
 * TODO:
 *   - ファイル選択 → lib/import/mobile-export.parseMobileExport / buildImportPlan
 *   - プレビュー（冊数・メモ数）→ Server Action で books upsert → user_books / histories / memos insert
 */
export default function ImportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">インポート</h1>
      <div className="space-y-3 rounded-lg border border-dashed p-6 text-center sm:p-8">
        <h2 className="font-semibold">インポート機能は準備中です</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          モバイルアプリから書き出したデータの取り込みに対応予定です。
          現在は、ISBN 検索や手動入力で本を登録できます。
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/books/add">書籍を登録する</Link>
        </Button>
      </div>
    </div>
  );
}
