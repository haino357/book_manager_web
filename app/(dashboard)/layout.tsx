import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { amazonAssociateTag } from "@/lib/books/store-links";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/books", label: "蔵書" },
  { href: "/books/search", label: "検索" },
  { href: "/books/add", label: "登録" },
  { href: "/dashboard", label: "統計" },
  { href: "/import", label: "インポート" },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <nav className="flex items-center gap-1">
            <Link href="/books" className="mr-4 font-semibold">
              Book Manager
            </Link>
            {NAV.map((item) => (
              <Button key={item.href} asChild variant="ghost" size="sm">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
          <form action={signOut} className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <Button type="submit" variant="outline" size="sm">
              ログアウト
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground">
          {amazonAssociateTag() && (
            <p>Amazon のアソシエイトとして、当サイトは適格販売により収入を得ています。</p>
          )}
          {/* a タグ自体は改変できないので、下線は親から当てる */}
          <p className="[&_a]:underline [&_a]:underline-offset-2">
            書籍情報: Google Books / openBD / 国立国会図書館サーチ /{" "}
            {/* 楽天ウェブサービスのクレジット表示。規約で HTML の改変が禁止されているので、このまま使う */}
            {/* Rakuten Web Services Attribution Snippet FROM HERE */}
            <a href="https://developers.rakuten.com/" target="_blank">Supported by Rakuten Developers</a>
            {/* Rakuten Web Services Attribution Snippet TO HERE */}
          </p>
        </div>
      </footer>
    </div>
  );
}
