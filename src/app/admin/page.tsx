import Link from "next/link";
import {
  Download,
  Database,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Users as UsersIcon,
  CalendarClock,
  Activity,
} from "lucide-react";
import { getAccounts, getAllContacts, getUsers } from "@/lib/db";
import { formatDateJP, formatDuration } from "@/lib/format";
import {
  type Opportunity,
  type User,
  type Visit,
} from "@/lib/types";
import {
  mockUsers,
  mockAccounts,
  mockVisits,
  mockVisitNotes,
  mockOpportunities,
} from "@/lib/mock-data";
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
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ============= 集計ヘルパー（このファイル内に閉じる） =============

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isCompletedNoteMissing(visit: Visit): boolean {
  if (visit.status !== "COMPLETED") return false;
  return !mockVisitNotes.some((n) => n.visitId === visit.id);
}

// ============= ページ本体 =============

export default async function AdminPage() {
  const accounts = getAccounts();
  const contacts = getAllContacts();
  const users = getUsers();

  // ownerId -> userName のマップ（取引先テーブル + 横断一覧用）
  const userById = new Map(users.map((u) => [u.id, u] as const));
  const accountById = new Map(accounts.map((a) => [a.id, a] as const));

  // ============= ダッシュボード集計 =============

  // 1) 全社 KPI
  const todayVisits = mockVisits.filter((v) => isToday(v.scheduledAt));
  const todayCompletedAll = todayVisits.filter(
    (v) => v.status === "COMPLETED",
  ).length;
  const pendingNoteCountAll = mockVisits.filter(isCompletedNoteMissing).length;
  const openOpps = mockOpportunities.filter((o) => o.status === "OPEN");
  const openOppsAmount = openOpps.reduce((sum, o) => sum + (o.amount ?? 0), 0);

  // 2) 営業ごとの集計
  type SalesRow = {
    user: User;
    accountCount: number;
    todayPlanned: number;
    todayCompleted: number;
    pendingNote: number;
  };
  const salesRows: SalesRow[] = mockUsers.map((user) => {
    const userAccounts = mockAccounts.filter((a) => a.ownerId === user.id);
    const userTodayVisits = todayVisits.filter((v) => v.ownerId === user.id);
    const userPendingNote = mockVisits.filter(
      (v) => v.ownerId === user.id && isCompletedNoteMissing(v),
    ).length;
    return {
      user,
      accountCount: userAccounts.length,
      todayPlanned: userTodayVisits.length,
      todayCompleted: userTodayVisits.filter((v) => v.status === "COMPLETED")
        .length,
      pendingNote: userPendingNote,
    };
  });

  // 3) 進行中商談（金額降順）
  const openOppsSorted: Opportunity[] = [...openOpps].sort(
    (a, b) => (b.amount ?? 0) - (a.amount ?? 0),
  );

  // 4) 過去 7 日間の活動量
  const sevenDaysCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCompleted = mockVisits.filter(
    (v) =>
      v.status === "COMPLETED" &&
      (v.leftAt ?? v.scheduledAt).getTime() >= sevenDaysCutoff,
  );
  const recentCount = recentCompleted.length;
  const recentDurations = recentCompleted
    .map((v) => v.durationMin)
    .filter((m): m is number => typeof m === "number");
  const recentAvgMin =
    recentDurations.length > 0
      ? Math.round(
          recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length,
        )
      : null;
  const recentByUser: { user: User; count: number }[] = mockUsers.map(
    (user) => ({
      user,
      count: recentCompleted.filter((v) => v.ownerId === user.id).length,
    }),
  );

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

      <Tabs defaultValue="dashboard">
        <TabsList className="self-start">
          <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
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

        {/* ============= ダッシュボード ============= */}
        <TabsContent value="dashboard" className="mt-3">
          <div className="flex flex-col gap-6">
            {/* 1) KPI サマリー */}
            <section
              aria-label="全社 KPI サマリー"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <KpiCard
                label="本日の訪問予定"
                value={`${todayCompletedAll}/${todayVisits.length}`}
                unit="件"
                hint={
                  todayVisits.length === 0
                    ? "予定なし"
                    : `${Math.round((todayCompletedAll / Math.max(todayVisits.length, 1)) * 100)}% 完了`
                }
                icon={<ClipboardList className="size-4" />}
                tone="default"
              />
              <KpiCard
                label="未記録の訪問"
                value={String(pendingNoteCountAll)}
                unit="件"
                hint={
                  pendingNoteCountAll > 0
                    ? "完了済 / メモ未記入"
                    : "全て記録済み"
                }
                icon={<AlertTriangle className="size-4" />}
                tone={pendingNoteCountAll > 0 ? "warn" : "default"}
              />
              <KpiCard
                label="進行中の商談"
                value={String(openOpps.length)}
                unit="件"
                hint={`合計 ¥${openOppsAmount.toLocaleString("ja-JP")}`}
                icon={<TrendingUp className="size-4" />}
                tone="default"
              />
            </section>

            {/* 2) 営業ごとの活動表 */}
            <section aria-labelledby="sales-table-heading">
              <div className="flex items-center gap-2 mb-2">
                <UsersIcon className="size-4 text-muted-foreground" />
                <h2
                  id="sales-table-heading"
                  className="text-sm font-medium text-muted-foreground"
                >
                  営業ごとの活動
                </h2>
              </div>
              <div className="rounded-lg border border-border bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>営業</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        部署
                      </TableHead>
                      <TableHead className="text-right">担当数</TableHead>
                      <TableHead className="text-right">今日の予定</TableHead>
                      <TableHead className="text-right">完了</TableHead>
                      <TableHead className="text-right">未記録</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesRows.map((row) => (
                      <TableRow key={row.user.id}>
                        <TableCell className="font-medium">
                          {row.user.name}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {row.user.department ?? "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.accountCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.todayPlanned}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.todayCompleted}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            row.pendingNote > 0 &&
                              "text-accent-amber font-semibold",
                          )}
                        >
                          {row.pendingNote}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            {/* 3) 進行中商談一覧 */}
            <section aria-labelledby="opps-heading">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-brand" />
                <h2
                  id="opps-heading"
                  className="text-sm font-medium text-muted-foreground"
                >
                  進行中の商談
                </h2>
                <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                  {openOppsSorted.length} 件 / ¥
                  {openOppsAmount.toLocaleString("ja-JP")}
                </span>
              </div>
              {openOppsSorted.length === 0 ? (
                <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                  進行中の商談はありません
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>取引先</TableHead>
                        <TableHead className="hidden md:table-cell">
                          案件名
                        </TableHead>
                        <TableHead className="text-right">金額</TableHead>
                        <TableHead className="hidden sm:table-cell text-right">
                          期日
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          担当
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          次のアクション
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openOppsSorted.map((o) => {
                        const acc = accountById.get(o.accountId);
                        const owner = acc ? userById.get(acc.ownerId) : null;
                        const overdue =
                          o.dueDate !== null &&
                          o.dueDate.getTime() < Date.now();
                        return (
                          <TableRow key={o.id}>
                            <TableCell className="font-medium">
                              {acc ? (
                                <Link
                                  href={`/accounts/${acc.id}`}
                                  className="hover:underline"
                                >
                                  {acc.name}
                                </Link>
                              ) : (
                                o.accountId
                              )}
                              <span className="block md:hidden text-[11px] text-muted-foreground font-normal truncate max-w-[40ch]">
                                {o.title}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[28ch]">
                              {o.title}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">
                              {o.amount === null
                                ? "-"
                                : `¥${o.amount.toLocaleString("ja-JP")}`}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "hidden sm:table-cell text-right tabular-nums text-xs",
                                overdue
                                  ? "text-danger font-semibold"
                                  : "text-muted-foreground",
                              )}
                            >
                              {formatDateJP(o.dueDate)}
                              {overdue && (
                                <span className="ml-1 text-[10px]">超過</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                              {owner?.name ?? "-"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-xs truncate max-w-[28ch]">
                              {o.nextAction ?? "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* 4) 過去 7 日間の活動量 */}
            <section aria-labelledby="activity-heading">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="size-4 text-muted-foreground" />
                <h2
                  id="activity-heading"
                  className="text-sm font-medium text-muted-foreground"
                >
                  過去 7 日間の活動量
                </h2>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
                  <ActivityStat
                    label="訪問件数"
                    value={`${recentCount}`}
                    unit="件"
                    icon={<ClipboardList className="size-3.5" />}
                  />
                  <ActivityStat
                    label="平均所要"
                    value={
                      recentAvgMin === null
                        ? "-"
                        : formatDuration(recentAvgMin)
                    }
                    icon={<CalendarClock className="size-3.5" />}
                  />
                  {recentByUser.map((r) => (
                    <ActivityStat
                      key={r.user.id}
                      label={r.user.name}
                      value={`${r.count}`}
                      unit="件"
                      icon={<UsersIcon className="size-3.5" />}
                    />
                  ))}
                </div>
                {recentCount === 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    過去 7 日間に完了した訪問はありません
                  </p>
                )}
              </div>
            </section>
          </div>
        </TabsContent>

        {/* ============= 取引先（既存維持） ============= */}
        <TabsContent value="accounts" className="mt-3">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>会社名</TableHead>
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
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {userById.get(a.ownerId)?.name ?? "-"}
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

        {/* ============= 連絡先（既存維持） ============= */}
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
                      {accountById.get(c.accountId)?.name ?? c.accountId}
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

        {/* ============= ユーザー（既存維持） ============= */}
        <TabsContent value="users" className="mt-3">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>氏名</TableHead>
                  <TableHead className="hidden sm:table-cell">部署</TableHead>
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

// ============= サブコンポーネント =============

function KpiCard({
  label,
  value,
  unit,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "warn" | "danger";
}) {
  const toneCls =
    tone === "danger"
      ? "border-danger/30 bg-danger/5"
      : tone === "warn"
        ? "border-accent-amber/40 bg-accent-amber/5"
        : "border-border bg-card";
  const iconCls =
    tone === "danger"
      ? "bg-danger/10 text-danger"
      : tone === "warn"
        ? "bg-accent-amber/15 text-accent-amber"
        : "bg-brand/10 text-brand";
  return (
    <div className={cn("rounded-xl border px-4 py-3 flex flex-col gap-1", toneCls)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn("grid size-5 place-items-center rounded-md", iconCls)}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums leading-none">
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && (
        <div className="text-[11px] text-muted-foreground truncate">{hint}</div>
      )}
    </div>
  );
}

function ActivityStat({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon && (
          <span className="grid size-4 place-items-center text-muted-foreground/80">
            {icon}
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold tabular-nums leading-none">
          {value}
        </span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
