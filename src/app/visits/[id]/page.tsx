import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Clock, FileText } from "lucide-react";
import { getVisit } from "@/lib/db";
import { finishVisitAction } from "@/lib/actions";
import {
  formatDateJP,
  formatTime,
  formatDuration,
} from "@/lib/format";
import { VISIT_PURPOSE_LABEL } from "@/lib/types";
import { BadgeVisitStatus } from "@/components/BadgeVisitStatus";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function VisitDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const visit = getVisit(id);
  if (!visit || !visit.account) notFound();

  const { account, owner, notes } = visit;
  const isInProgress = visit.status === "IN_PROGRESS";
  const isCompleted = visit.status === "COMPLETED";
  const finish = finishVisitAction.bind(null, id);

  return (
    <div className="flex flex-col gap-5 pb-24">
      <Link
        href={`/accounts/${account.id}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3" aria-hidden="true" />
        {account.name}
      </Link>

      {/* ヘッダー */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <BadgeVisitStatus status={visit.status} />
          {visit.purpose && (
            <span className="text-xs text-muted-foreground">
              {VISIT_PURPOSE_LABEL[visit.purpose]}
            </span>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold leading-tight">
          {account.name}
        </h1>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatDateJP(visit.scheduledAt)} {formatTime(visit.scheduledAt)}
          {owner && ` / 担当 ${owner.name}`}
        </p>
      </header>

      {/* 訪問情報 */}
      <section
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm"
        aria-label="訪問情報"
      >
        <InfoCell label="開始" value={formatTime(visit.arrivedAt)} />
        <InfoCell label="終了" value={formatTime(visit.leftAt)} />
        <InfoCell
          label="滞在時間"
          value={formatDuration(visit.durationMin)}
        />
        <InfoCell
          label="GPS"
          value={
            visit.arrivedLat !== null && visit.arrivedLng !== null
              ? "取得済"
              : "なし"
          }
        />
      </section>

      {/* メモ一覧 */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground inline-flex items-center gap-1.5">
            <FileText className="size-3.5" aria-hidden="true" />
            訪問メモ
          </h2>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {notes.length} 件
          </span>
        </div>
        {notes.length === 0 ? (
          <div className="grid place-items-center py-8 rounded-lg border border-dashed border-border bg-muted/40">
            <p className="text-xs text-muted-foreground">
              {isInProgress
                ? "メモはまだ未記入。下のボタンから記録できます"
                : "この訪問にはメモがありません"}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
                  <Clock className="size-3" aria-hidden="true" />
                  {formatDateJP(n.createdAt)} {formatTime(n.createdAt)}
                  <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    {n.kind === "TEXT_TYPED"
                      ? "手入力"
                      : n.kind === "VOICE_RAW"
                        ? "音声"
                        : n.kind === "VOICE_CLEANED"
                          ? "音声整文"
                          : "AI要約"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {n.body}
                </p>
                {n.extractedNextAction && (
                  <div className="rounded-md bg-accent-amber/10 border border-accent-amber/30 px-3 py-2 text-xs">
                    <span className="font-medium text-accent-amber-foreground">
                      次のアクション:
                    </span>{" "}
                    <span>{n.extractedNextAction}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* GPS 表示 */}
      {visit.arrivedLat !== null && visit.arrivedLng !== null && (
        <section className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-3">
          <MapPin className="size-4 text-brand shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-muted-foreground">到着位置</div>
            <div className="text-xs tabular-nums truncate">
              {visit.arrivedLat.toFixed(4)}, {visit.arrivedLng.toFixed(4)}
            </div>
          </div>
          <a
            href={`https://www.google.com/maps?q=${visit.arrivedLat},${visit.arrivedLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand hover:underline"
          >
            地図で開く →
          </a>
        </section>
      )}

      {isCompleted && (
        <Link
          href={`/accounts/${account.id}`}
          className={cn(
            "self-start text-xs text-brand hover:underline",
            "inline-flex items-center gap-1",
          )}
        >
          取引先詳細へ戻る →
        </Link>
      )}

      {/* IN_PROGRESS なら下部固定で「メモして終了」CTA */}
      {isInProgress && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95",
            "supports-backdrop-filter:backdrop-blur",
            "pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 px-4",
            "md:bottom-0",
          )}
        >
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row gap-2">
            <Link
              href={`/visits/${id}/record`}
              className={cn(
                "flex-1 h-14 rounded-xl bg-brand text-brand-foreground",
                "flex items-center justify-center gap-2 text-base font-semibold",
                "hover:bg-brand-dark transition-colors shadow-sm",
              )}
            >
              ✏️ メモを書いて終了する
            </Link>
            <form action={finish} className="sm:flex-none">
              <button
                type="submit"
                className={cn(
                  "w-full sm:w-auto h-14 rounded-xl border-2 border-border bg-card",
                  "px-5 text-sm font-medium hover:bg-muted transition-colors",
                )}
                aria-label="メモなしで終了"
              >
                メモなしで終了
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
