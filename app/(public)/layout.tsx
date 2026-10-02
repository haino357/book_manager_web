import Link from "next/link";

import { SiteFooterLinks } from "@/components/site-footer";

// Tailwind の typography プラグインは入れていないので、規約などの文章ページの見た目はここで当てる
const ARTICLE =
  "space-y-4 leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:pt-2 [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6";

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
        <article className={ARTICLE}>{children}</article>
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <SiteFooterLinks />
      </footer>
    </div>
  );
}
