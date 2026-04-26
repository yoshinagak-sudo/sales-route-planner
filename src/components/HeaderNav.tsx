"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/map", label: "地図" },
  { href: "/accounts", label: "取引先" },
  { href: "/route-plans/today", label: "今日のルート" },
  { href: "/admin", label: "管理" },
];

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="主要ナビゲーション"
      className="hidden md:flex items-center gap-0.5"
    >
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              active
                ? "bg-brand/10 text-brand"
                : "text-foreground/70 hover:text-foreground hover:bg-muted",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
