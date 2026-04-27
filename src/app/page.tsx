import Link from "next/link";
import { Map, ClipboardList, AlertTriangle, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getVisitsToday,
  getPendingNoteVisits,
  getInProgressVisitForUser,
} from "@/lib/db";
import { formatDateJP, formatTime } from "@/lib/format";
import { VISIT_PURPOSE_LABEL } from "@/lib/types";
import { BadgeVisitStatus } from "@/components/BadgeVisitStatus";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <div className="grid place-items-center py-16">
        <p className="text-sm text-muted-foreground">ユーザーが見つかりません</p>
      </div>
    );
  }

  const todayVisits = getVisitsToday(me.id);
  const pending = getPendingNoteVisits(me.id);
  const inProgress = getInProgressVisitForUser(me.id);

  const todayCompleted = todayVisits.filter((v) => v.status === "COMPLETED").length;
  const todayTotal = todayVisits.length;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-heading font-bold">
          こんにちは、{me.name}さん
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDateJP(new Date())} / {me.department ?? "-"}
        </p>
      </section>

      {inProgress && (
        <Link
          href={`/visits/${inProgress.id}/record`}
          className={cn(
            "flex items-center gap-3 rounded-xl border border-accent-amber/40 bg-accent-amber/10 px-4 py-3",
            "hover:bg-accent-amber/15 transition-colors",
          )}
        >
          <span className="grid size-10 place-items-center rounded-full bg-accent-amber text-accent-amber-foreground">
            <Clock className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">訪問中</div>
            <div className="text-xs text-muted-foreground truncate">
              タップでメモを追加 → 訪問を終了できます
            </div>
          </div>
          <span className="text-xs font-medium text-accent-amber-foreground">
            続きへ →
          </span>
        </Link>
      )}

      <section
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        aria-label="今日のサマリ"
      >
        <SummaryCard
          label="今日の訪問"
          value={`${todayCompleted}/${todayTotal}`}
          unit="件"
          hint={
            todayTotal === 0
              ? "今日は予定なし"
              : `${Math.round((todayCompleted / Math.max(todayTotal, 1)) * 100)}% 完了`
          }
          icon={<ClipboardList className="size-4" />}
          tone="default"
        />
        <SummaryCard
          label="未記録の訪問"
          value={String(pending.length)}
          unit="件"
          hint={pending.length > 0 ? "訪問は済、メモ未記入" : "全て記録済み"}
          icon={<AlertTriangle className="size-4" />}
          tone={pending.length > 0 ? "warn" : "default"}
        />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/map"
          className={cn(
            "group flex items-center gap-4 rounded-xl bg-brand text-brand-foreground",
            "px-5 py-5 h-20 shadow-sm hover:bg-brand-dark transition-colors",
            "focus-visible:ring-3 focus-visible:ring-brand/40",
          )}
        >
          <span className="grid size-12 place-items-center rounded-lg bg-white/15">
            <Map className="size-6" />
          </span>
          <span className="flex-1">
            <span className="block text-base font-semibold">地図で取引先を見る</span>
            <span className="block text-xs opacity-80">担当エリアを俯瞰</span>
          </span>
          <span aria-hidden="true" className="text-xl">→</span>
        </Link>
        <Link
          href="/route-plans/today"
          className={cn(
            "group flex items-center gap-4 rounded-xl border-2 border-brand/30 bg-card",
            "px-5 py-5 h-20 hover:bg-brand/5 transition-colors",
            "focus-visible:ring-3 focus-visible:ring-brand/40",
          )}
        >
          <span className="grid size-12 place-items-center rounded-lg bg-brand/10 text-brand">
            <ClipboardList className="size-6" />
          </span>
          <span className="flex-1">
            <span className="block text-base font-semibold">今日のルート</span>
            <span className="block text-xs text-muted-foreground">
              {todayTotal > 0 ? `${todayTotal}件の訪問` : "予定なし"}
            </span>
          </span>
          <span aria-hidden="true" className="text-xl">→</span>
        </Link>
      </section>

      {todayVisits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-muted-foreground">今日の予定</h2>
            <Link href="/route-plans/today" className="text-xs text-brand hover:underline">
              ルート画面へ →
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {todayVisits.slice(0, 5).map((v, i) => (
              <li key={v.id}>
                <Link
                  href={`/visits/${v.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border bg-card",
                    "px-3 py-2.5 hover:bg-muted/50 transition-colors",
                  )}
                >
                  <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium tabular-nums min-w-12">
                    {formatTime(v.scheduledAt)}
                  </span>
                  <BadgeVisitStatus status={v.status} />
                  <span className="flex-1 min-w-0 truncate font-medium">
                    {v.account.name}
                  </span>
                  {v.purpose && (
                    <span className="hidden sm:inline text-xs text-muted-foreground">
                      {VISIT_PURPOSE_LABEL[v.purpose]}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SummaryCard({
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
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
