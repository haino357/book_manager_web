import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link href="/" className="font-semibold">
            Book Manager
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {children}
        </article>
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <Link href="/privacy" className="mx-2 hover:underline">
          プライバシーポリシー
        </Link>
        <Link href="/support" className="mx-2 hover:underline">
          サポート
        </Link>
      </footer>
    </div>
  );
}
