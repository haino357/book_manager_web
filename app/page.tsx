import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
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
      <nav className="mt-8 flex gap-4 text-sm text-muted-foreground">
        <Link href="/privacy" className="hover:underline">
          プライバシーポリシー
        </Link>
        <Link href="/support" className="hover:underline">
          サポート
        </Link>
      </nav>
    </main>
  );
}
