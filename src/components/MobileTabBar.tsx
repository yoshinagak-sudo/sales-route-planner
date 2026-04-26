"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "ホーム", Icon: Home },
  { href: "/map", label: "地図", Icon: Map },
  { href: "/route-plans/today", label: "ルート", Icon: ClipboardList },
  { href: "/admin", label: "管理", Icon: Settings },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="下部ナビゲーション"
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-40",
        "bg-card/95 supports-backdrop-filter:backdrop-blur border-t border-border",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                  "min-h-12",
                  active ? "text-brand" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
