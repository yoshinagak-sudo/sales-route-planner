import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Phone, FileText, Users } from "lucide-react";
import {
  getAccountWithRelations,
  getInProgressVisitForAccount,
  getOpenOpportunitiesForAccount,
} from "@/lib/db";
import {
  daysSince,
  formatDateJP,
  formatTime,
  formatMonthDay,
} from "@/lib/format";
import { VISIT_PURPOSE_LABEL } from "@/lib/types";
import { BadgeVisitStatus } from "@/components/BadgeVisitStatus";
import { VisitActionButtons } from "@/components/VisitActionButtons";
import { getNotesForVisit } from "@/lib/db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function AccountDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const account = getAccountWithRelations(id);
  if (!account) notFound();

  const inProgressVisit = getInProgressVisitForAccount(id);
  const opportunities = getOpenOpportunitiesForAccount(id);
  const days = daysSince(account.lastVisitAt);

  const recentVisits = account.visits.slice(0, 3);
  const primaryContacts = account.contacts.slice(0, 2);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/accounts"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3" aria-hidden="true" />
        取引先一覧
      </Link>

      {/* ヘッダー: 会社名 + 経過日数 */}
      <header className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl font-heading font-bold leading-tight">
          {account.name}
        </h1>
        <div className="flex items-center gap-3 flex-wrap text-xs">
          {account.category && (
            <span className="text-muted-foreground">{account.category}</span>
          )}
          {account.category && account.owner && (
            <span className="text-muted-foreground/40">/</span>
          )}
          {account.owner && (
            <span className="text-muted-foreground">
              担当: {account.owner.name}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">最終訪問:</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {days === null ? "未訪問" : `${days}日前`}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            ({formatDateJP(account.lastVisitAt)})
          </span>
        </div>
      </header>

      {/* Primary Actions: 訪問開始 / ナビ / 電話 */}
      <VisitActionButtons
        account={{
          id: account.id,
          name: account.name,
          geoLat: account.geoLat,
          geoLng: account.geoLng,
          phone: account.phone,
        }}
        inProgressVisit={inProgressVisit ? { id: inProgressVisit.id } : null}
      />

      {/* メタ情報グリッド */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        aria-label="取引先メタ情報"
      >
        <MetaCard
          icon={<MapPin className="size-4" aria-hidden="true" />}
          label="住所"
        >
          <span className="text-sm">{account.billingAddress}</span>
        </MetaCard>
        <MetaCard
          icon={<Phone className="size-4" aria-hidden="true" />}
          label="電話番号"
        >
          {account.phone ? (
            <a
              href={`tel:${account.phone.replace(/[^0-9+]/g, "")}`}
              className="text-sm tabular-nums text-brand hover:underline"
            >
              {account.phone}
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">未登録</span>
          )}
        </MetaCard>
        {account.note && (
          <MetaCard
            icon={<FileText className="size-4" aria-hidden="true" />}
            label="備考"
            className="sm:col-span-2"
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {account.note}
            </p>
          </MetaCard>
        )}
      </section>

      {/* 進行中の商談 */}
      {opportunities.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            進行中の商談
          </h2>
          <ul className="flex flex-col gap-2">
            {opportunities.slice(0, 2).map((o) => (
              <li
                key={o.id}
                className="rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 flex flex-col gap-1"
              >
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="font-medium">{o.title}</span>
                  {o.amount !== null && (
                    <span className="text-sm tabular-nums text-brand font-semibold">
                      ¥{o.amount.toLocaleString()}
                    </span>
                  )}
                </div>
                {o.nextAction && (
                  <p className="text-xs text-muted-foreground">
                    次: {o.nextAction}
                    {o.nextActionDate && (
                      <span className="ml-1 tabular-nums">
                        ({formatMonthDay(o.nextActionDate)})
                      </span>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 訪問履歴 */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            訪問履歴
          </h2>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            全 {account.visits.length} 件
          </span>
        </div>
        {recentVisits.length === 0 ? (
          <div className="grid place-items-center py-8 rounded-lg border border-dashed border-border bg-muted/40">
            <p className="text-xs text-muted-foreground">
              訪問履歴がまだありません
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
            {recentVisits.map((v) => {
              const notes = getNotesForVisit(v.id);
              const firstNote = notes[0]?.body ?? null;
              return (
                <li key={v.id}>
                  <Link
                    href={`/visits/${v.id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[3.5rem]">
                      <span className="text-xs tabular-nums font-medium">
                        {formatMonthDay(v.scheduledAt)}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {formatTime(v.scheduledAt)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <BadgeVisitStatus status={v.status} />
                        {v.purpose && (
                          <span className="text-xs text-muted-foreground">
                            {VISIT_PURPOSE_LABEL[v.purpose]}
                          </span>
                        )}
                      </div>
                      {firstNote && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {firstNote.length > 40
                            ? firstNote.slice(0, 40) + "…"
                            : firstNote}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 担当者 */}
      {primaryContacts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground inline-flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden="true" />
            担当者
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {primaryContacts.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {c.isPrimary && (
                    <span className="rounded-full bg-brand/10 text-brand px-1.5 py-0.5 text-[10px] font-medium">
                      主担当
                    </span>
                  )}
                </div>
                {c.role && (
                  <span className="text-xs text-muted-foreground">
                    {c.role}
                  </span>
                )}
                {c.phone && (
                  <a
                    href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`}
                    className="text-xs tabular-nums text-brand hover:underline"
                  >
                    {c.phone}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function MetaCard({
  icon,
  label,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="grid size-4 place-items-center rounded bg-muted text-muted-foreground">
          {icon}
        </span>
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
