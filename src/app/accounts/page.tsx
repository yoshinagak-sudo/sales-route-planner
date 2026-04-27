import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/db";
import { daysSince, formatDateJP } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string }>;

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").trim();

  const ownerId = await getCurrentUserId();
  const accounts = getAccounts({
    ownerId,
    rank: null,
    q: q || null,
  });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-heading font-bold">取引先一覧</h1>
          <p className="text-xs text-muted-foreground">
            担当の取引先 {accounts.length} 件
          </p>
        </div>
      </header>

      {/* 検索バー */}
      <form
        action="/accounts"
        method="get"
        className="flex flex-col sm:flex-row gap-2 sm:items-center"
        role="search"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="社名・住所で検索"
            aria-label="社名・住所で検索"
            className={cn(
              "w-full h-10 rounded-lg border border-border bg-card pl-9 pr-3 text-sm",
              "focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:border-brand focus-visible:outline-none",
            )}
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-lg bg-brand text-brand-foreground px-4 text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          検索
        </button>
      </form>

      {accounts.length === 0 ? (
        <div className="grid place-items-center py-16 rounded-lg border border-dashed border-border bg-muted/40">
          <p className="text-sm text-muted-foreground">
            該当する取引先がありません
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>会社名</TableHead>
                <TableHead className="hidden sm:table-cell">カテゴリ</TableHead>
                <TableHead className="text-right">最終訪問</TableHead>
                <TableHead className="hidden md:table-cell">注釈</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => {
                const d = daysSince(a.lastVisitAt);
                return (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={undefined}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/accounts/${a.id}`}
                        className="block hover:text-brand"
                      >
                        {a.name}
                        <span className="block text-[11px] text-muted-foreground font-normal truncate max-w-[28ch] sm:max-w-[40ch]">
                          {a.billingAddress}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      <Link href={`/accounts/${a.id}`} className="block">
                        {a.category ?? "-"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Link
                        href={`/accounts/${a.id}`}
                        className="block text-muted-foreground"
                      >
                        {d === null
                          ? "未訪問"
                          : d === 0
                            ? "今日"
                            : `${d}日前`}
                        <span className="block text-[10px] font-normal opacity-70">
                          {formatDateJP(a.lastVisitAt)}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      <Link
                        href={`/accounts/${a.id}`}
                        className="block max-w-[40ch] truncate"
                      >
                        {a.note ?? "-"}
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
