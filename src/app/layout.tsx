import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import { getCurrentUser } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { HeaderNav } from "@/components/HeaderNav";
import { MobileTabBar } from "@/components/MobileTabBar";
import { UserSwitcher } from "@/components/UserSwitcher";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "営業訪問プランナー",
  description:
    "地図で取引先を可視化し、訪問記録を3秒で残すデモ用Webアプリ (sales-route-planner)",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDemo = (process.env.AUTH_MODE ?? "demo") !== "production";
  const users = getUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    department: u.department,
  }));
  const me = await getCurrentUser();
  const current = me
    ? { id: me.id, name: me.name, email: me.email, department: me.department }
    : null;

  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoJp.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 supports-backdrop-filter:backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-4 min-w-0">
              <Link
                href="/"
                className="flex items-center gap-2 font-heading font-bold tracking-tight"
                aria-label="営業訪問プランナー ホーム"
              >
                <span className="grid size-8 place-items-center rounded-md bg-brand text-brand-foreground">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <span className="hidden sm:inline text-base">
                  営業訪問プランナー
                </span>
                {isDemo && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-accent-amber/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-accent-amber-foreground">
                    DEMO
                  </span>
                )}
              </Link>
              <HeaderNav />
            </div>
            <div className="flex items-center gap-2">
              <UserSwitcher initialUsers={users} initialCurrent={current} />
            </div>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 pb-24 md:pb-6">
          {children}
        </main>

        <MobileTabBar />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
