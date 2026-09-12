import type { Metadata } from "next";

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
      <p className="text-muted-foreground">
        モバイルアプリのエクスポート JSON をここから取り込む（M2）。
      </p>
    </div>
  );
}
