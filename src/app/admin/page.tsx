import { Download, Database } from "lucide-react";
import { getAccounts, getAllContacts, getUsers } from "@/lib/db";
import { formatDateJP } from "@/lib/format";
import { ACCOUNT_RANK_LABEL } from "@/lib/types";
import { BadgeRank } from "@/components/BadgeRank";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const accounts = getAccounts();
  const contacts = getAllContacts();
  const users = getUsers();

  // ownerId -> userName のマップ（取引先テーブル用）
  const userById = new Map(users.map((u) => [u.id, u.name] as const));
  const accountById = new Map(accounts.map((a) => [a.id, a.name] as const));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-2 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-heading font-bold inline-flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-brand/10 text-brand">
              <Database className="size-4" />
            </span>
            マスタ管理
          </h1>
          <p className="text-xs text-muted-foreground">
            読み取り専用ビュー / Phase 1 のデモでは編集機能なし
          </p>
        </div>
        <button
          type="button"
          aria-label="CSV エクスポート（Phase 2）"
          className="h-9 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
          disabled
          title="Phase 2 で実装"
        >
          <Download className="size-3.5" aria-hidden="true" />
          CSV エクスポート
        </button>
      </header>

      <Tabs defaultValue="accounts">
        <TabsList className="self-start">
          <TabsTrigger value="accounts">
            取引先{" "}
            <span className="ml-1 tabular-nums opacity-70">
              ({accounts.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="contacts">
            連絡先{" "}
            <span className="ml-1 tabular-nums opacity-70">
              ({contacts.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="users">
            ユーザー{" "}
            <span className="ml-1 tabular-nums opacity-70">
              ({users.length})
            </span>
          </TabsTrigger>
        </TabsList>

        {/* 取引先 */}
        <TabsContent value="accounts" className="mt-3">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>会社名</TableHead>
                  <TableHead className="w-20">ランク</TableHead>
                  <TableHead className="hidden sm:table-cell">担当</TableHead>
                  <TableHead className="text-right">最終訪問</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.name}
                      <span className="block text-[11px] text-muted-foreground font-normal truncate max-w-[36ch]">
                        {a.billingAddress}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5"
                        aria-label={ACCOUNT_RANK_LABEL[a.rank]}
                      >
                        <BadgeRank rank={a.rank} />
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {userById.get(a.ownerId) ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                      {formatDateJP(a.lastVisitAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* 連絡先 */}
        <TabsContent value="contacts" className="mt-3">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>氏名</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    所属取引先
                  </TableHead>
                  <TableHead className="hidden md:table-cell">役職</TableHead>
                  <TableHead className="hidden md:table-cell">電話</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    メール
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        {c.name}
                        {c.isPrimary && (
                          <span className="rounded-full bg-brand/10 text-brand px-1.5 py-0.5 text-[10px] font-medium">
                            主担当
                          </span>
                        )}
                      </span>
                      {c.nameKana && (
                        <span className="block text-[11px] text-muted-foreground font-normal">
                          {c.nameKana}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {accountById.get(c.accountId) ?? c.accountId}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {c.role ?? "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground tabular-nums">
                      {c.phone ?? "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {c.email ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ユーザー */}
        <TabsContent value="users" className="mt-3">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>氏名</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    部署
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    メール
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    ホーム拠点
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {u.department ?? "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {u.homeLabel ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-[11px] text-muted-foreground">
        ※ このタブのデータはデモ用 in-memory データです。再起動でリセットされます。
      </p>
    </div>
  );
}
