import Link from "next/link";
import { Navigation, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getVisitsToday, getRoutePlanForToday } from "@/lib/db";
import { formatDateJP, formatTime, formatDistance } from "@/lib/format";
import { VISIT_PURPOSE_LABEL } from "@/lib/types";
import { BadgeVisitStatus } from "@/components/BadgeVisitStatus";
import { RouteMap } from "@/components/RouteMap";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TodayRoutePage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <div className="grid place-items-center py-16">
        <p className="text-sm text-muted-foreground">
          ユーザーが見つかりません
        </p>
      </div>
    );
  }
  const visits = getVisitsToday(me.id);
  const plan = getRoutePlanForToday(me.id);

  const completed = visits.filter((v) => v.status === "COMPLETED").length;
  const inProgress = visits.filter((v) => v.status === "IN_PROGRESS").length;
  const planned = visits.filter((v) => v.status === "PLANNED").length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-heading font-bold">今日のルート</h1>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatDateJP(new Date())} / 担当 {me.name}
        </p>
      </header>

      {/* サマリ */}
      <section
        className="grid grid-cols-3 gap-2"
        aria-label="今日の訪問サマリ"
      >
        <SummaryPill label="完了" value={completed} tone="brand" />
        <SummaryPill label="訪問中" value={inProgress} tone="amber" />
        <SummaryPill label="予定" value={planned} tone="muted" />
      </section>

      {plan && plan.totalDistanceM !== null && (
        <div
          className={cn(
            "rounded-lg border border-border bg-card px-4 py-3",
            "flex items-center gap-3 text-xs text-muted-foreground",
          )}
        >
          <Navigation className="size-4 text-brand" aria-hidden="true" />
          <span>
            予定総距離{" "}
            <span className="font-medium tabular-nums text-foreground">
              {formatDistance(plan.totalDistanceM)}
            </span>
          </span>
          {plan.totalDurationS !== null && (
            <span>
              / 移動目安{" "}
              <span className="font-medium tabular-nums text-foreground">
                {Math.round(plan.totalDurationS / 60)}分
              </span>
            </span>
          )}
        </div>
      )}

      {/* マップ（始点 → 訪問先順 → 帰着 をルート線で結ぶ） */}
      {(() => {
        const start = {
          lat: plan?.startLat ?? me.homeLat ?? 35.6845,
          lng: plan?.startLng ?? me.homeLng ?? 139.7649,
          label: plan?.startLabel ?? me.homeLabel ?? "拠点",
        };
        const end = {
          lat: plan?.endLat ?? start.lat,
          lng: plan?.endLng ?? start.lng,
          label: plan?.endLabel ?? start.label,
        };
        const stops = visits
          .filter(
            (v) =>
              typeof v.account.geoLat === "number" &&
              typeof v.account.geoLng === "number",
          )
          .map((v) => ({
            visitId: v.id,
            accountId: v.account.id,
            name: v.account.name,
            lat: v.account.geoLat as number,
            lng: v.account.geoLng as number,
            status: v.status,
            scheduledAt: formatTime(v.scheduledAt),
          }));
        if (stops.length === 0) return null;
        return <RouteMap start={start} end={end} stops={stops} />;
      })()}

      {/* デッキ */}
      {visits.length === 0 ? (
        <div className="grid place-items-center py-16 rounded-lg border border-dashed border-border bg-muted/40">
          <p className="text-sm text-muted-foreground">
            今日の訪問予定はありません
          </p>
          <Link
            href="/map"
            className="mt-3 text-xs text-brand hover:underline"
          >
            地図で取引先を見る →
          </Link>
        </div>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="訪問カード一覧">
          {visits.map((v, i) => {
            const hasGeo =
              typeof v.account.geoLat === "number" &&
              typeof v.account.geoLng === "number";
            const mapsUrl = hasGeo
              ? `https://www.google.com/maps/dir/?api=1&destination=${v.account.geoLat},${v.account.geoLng}&travelmode=driving`
              : null;
            const isDone = v.status === "COMPLETED";
            return (
              <li key={v.id}>
                <div
                  className={cn(
                    "rounded-xl border bg-card p-4 flex items-stretch gap-3",
                    "transition-colors hover:bg-muted/30",
                    isDone
                      ? "border-border opacity-70"
                      : v.status === "IN_PROGRESS"
                        ? "border-accent-amber/40 bg-accent-amber/5"
                        : "border-border",
                  )}
                >
                  {/* 番号 */}
                  <div
                    className={cn(
                      "shrink-0 grid place-items-center size-10 rounded-full font-bold tabular-nums",
                      isDone
                        ? "bg-muted text-muted-foreground line-through"
                        : v.status === "IN_PROGRESS"
                          ? "bg-accent-amber text-accent-amber-foreground"
                          : "bg-brand/10 text-brand",
                    )}
                    aria-label={`訪問 ${i + 1} 番目`}
                  >
                    {i + 1}
                  </div>

                  {/* メイン情報（タップで詳細） */}
                  <Link
                    href={`/visits/${v.id}`}
                    className="flex-1 min-w-0 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {formatTime(v.scheduledAt)}
                      </span>
                      <BadgeVisitStatus status={v.status} />
                    </div>
                    <div
                      className={cn(
                        "font-medium leading-tight truncate",
                        isDone && "line-through",
                      )}
                    >
                      {v.account.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {v.purpose && (
                        <span>{VISIT_PURPOSE_LABEL[v.purpose]}</span>
                      )}
                      {v.account.category && (
                        <>
                          <span aria-hidden="true">/</span>
                          <span className="truncate">
                            {v.account.category}
                          </span>
                        </>
                      )}
                    </div>
                  </Link>

                  {/* ナビ */}
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "shrink-0 grid place-items-center size-12 rounded-lg",
                        "border border-brand/30 bg-card text-brand",
                        "hover:bg-brand/10 transition-colors",
                        "focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:outline-none",
                      )}
                      aria-label={`${v.account.name} をナビ起動`}
                    >
                      <Navigation className="size-5" aria-hidden="true" />
                    </a>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="shrink-0 grid place-items-center size-12 rounded-lg border border-border/50 bg-muted/30 text-muted-foreground/50"
                    >
                      <Navigation className="size-5" />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "brand" | "amber" | "muted";
}) {
  const cls =
    tone === "brand"
      ? "border-brand/30 bg-brand/5"
      : tone === "amber"
        ? "border-accent-amber/40 bg-accent-amber/10"
        : "border-border bg-card";
  const valueCls =
    tone === "brand"
      ? "text-brand"
      : tone === "amber"
        ? "text-accent-amber-foreground"
        : "text-foreground";
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 flex flex-col items-center gap-0.5",
        cls,
      )}
    >
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn("text-xl font-bold tabular-nums", valueCls)}>
        {value}
      </span>
    </div>
  );
}
