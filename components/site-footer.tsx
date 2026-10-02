import Link from "next/link";

const LINKS = [
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/support", label: "サポート" },
] as const;

/** 公開ページ・認証ページのフッター（利用規約・プライバシーポリシー・サポート） */
export function SiteFooterLinks({ className }: { className?: string }) {
  return (
    <nav className={className} aria-label="サイト情報">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="mx-2 hover:underline">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
