"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/books", label: "蔵書" },
  { href: "/books/search", label: "検索" },
  { href: "/books/add", label: "登録" },
  { href: "/dashboard", label: "統計" },
  { href: "/import", label: "インポート" },
  { href: "/settings", label: "設定" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  const active = NAV.find((item) => item.href === pathname)?.href
    ?? (pathname.startsWith("/books/") ? "/books" : null);

  return (
    <nav aria-label="メインメニュー" className="grid grid-cols-3 gap-1 pb-3 sm:flex sm:flex-wrap">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active === item.href ? "page" : undefined}
          className={cn(
            "flex min-h-10 items-center justify-center whitespace-nowrap rounded-md px-2 text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-3",
            active === item.href ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
