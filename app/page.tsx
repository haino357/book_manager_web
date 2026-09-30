import Link from "next/link";

import { SiteFooterLinks } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { deleted } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      {deleted === "1" && (
        <p role="status" className="rounded-md bg-muted px-4 py-3 text-sm">
          アカウントとデータを削除しました。ご利用ありがとうございました。
        </p>
      )}
      <h1 className="text-4xl font-bold tracking-tight">Book Manager</h1>
      <p className="max-w-md text-muted-foreground">
        蔵書の登録、読書ステータスの管理、メモ、統計ダッシュボード。
        モバイルアプリとデータを共有する読書管理 Web です。
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">ログイン</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/signup">新規登録</Link>
        </Button>
      </div>
      <SiteFooterLinks className="mt-8 text-sm text-muted-foreground" />
    </main>
  );
}
