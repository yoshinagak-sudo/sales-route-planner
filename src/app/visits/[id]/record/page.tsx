import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import { getVisit } from "@/lib/db";
import { finishVisitAction } from "@/lib/actions";
import { formatTime } from "@/lib/format";
import {
  VISIT_PURPOSE_LABEL,
  VisitPurpose,
} from "@/lib/types";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

const PURPOSE_OPTIONS: VisitPurpose[] = [
  "FOLLOW_UP",
  "NEW_PROPOSAL",
  "RELATIONSHIP",
  "COMPLAINT_CARE",
  "CONTRACT",
  "DELIVERY",
  "OTHER",
];

export default async function VisitRecordPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const visit = getVisit(id);
  if (!visit || !visit.account) notFound();
  if (visit.status !== "IN_PROGRESS") {
    redirect(`/visits/${id}`);
  }

  const finish = finishVisitAction.bind(null, id);

  return (
    <div className="flex flex-col gap-5 pb-32">
      <Link
        href={`/visits/${id}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3" aria-hidden="true" />
        訪問詳細に戻る
      </Link>

      {/* タイトル: 会社名 + 訪問開始時刻 */}
      <header className="flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs text-accent-amber-foreground bg-accent-amber/15 self-start rounded-full px-2.5 py-0.5">
          <span className="size-1.5 rounded-full bg-accent-amber animate-pulse" />
          訪問中
        </span>
        <h1 className="text-xl sm:text-2xl font-heading font-bold leading-tight">
          {visit.account.name}
        </h1>
        <p className="text-xs text-muted-foreground tabular-nums inline-flex items-center gap-1.5">
          <Clock className="size-3" aria-hidden="true" />
          {formatTime(visit.arrivedAt ?? visit.scheduledAt)} 開始
          {visit.owner && ` / 担当 ${visit.owner.name}`}
        </p>
      </header>

      <p className="text-xs text-muted-foreground -mt-2">
        音声 → メモ → 用件 → 終了 の順で 30 秒以内を目安に。
      </p>

      {/* 録音ボタン（Phase 1: UI のみ、送信なし） */}
      <section aria-label="音声録音">
        <VoiceRecorder />
      </section>

      {/* 終了フォーム（メモ + 用件 + 次アクション + 終了ボタン） */}
      <form action={finish} className="flex flex-col gap-5">
        {/* メモ本文 */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="note-body"
            className="text-sm font-medium inline-flex items-center gap-2"
          >
            メモ
            <span className="text-[11px] font-normal text-muted-foreground">
              (任意)
            </span>
          </label>
          <textarea
            id="note-body"
            name="body"
            rows={5}
            placeholder="音声が使えない場合はここに打ち込んでOK&#10;例) サンプル渡し済、来週試食会の日程調整"
            className={cn(
              "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm leading-relaxed",
              "resize-y min-h-[7rem]",
              "focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:border-brand focus-visible:outline-none",
            )}
          />
        </div>

        {/* 用件（Horizontal radio buttons） */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">
            用件
            <span className="ml-2 text-[11px] font-normal text-muted-foreground">
              (任意)
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {PURPOSE_OPTIONS.map((p) => (
              <label
                key={p}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer",
                  "border-border bg-card text-foreground hover:bg-muted transition-colors",
                  "has-[:checked]:bg-brand has-[:checked]:text-brand-foreground has-[:checked]:border-brand",
                  "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand/30",
                )}
              >
                <input
                  type="radio"
                  name="purpose"
                  value={p}
                  className="sr-only"
                />
                {VISIT_PURPOSE_LABEL[p]}
              </label>
            ))}
          </div>
        </fieldset>

        {/* 次のアクション（Collapsible） */}
        <details className="rounded-lg border border-border bg-card group">
          <summary
            className={cn(
              "cursor-pointer list-none px-4 py-3 flex items-center justify-between",
              "text-sm font-medium hover:bg-muted/50 transition-colors",
              "rounded-lg group-open:rounded-b-none group-open:border-b group-open:border-border",
            )}
          >
            <span>
              次のアクション
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                (任意)
              </span>
            </span>
            <span
              aria-hidden="true"
              className="text-muted-foreground transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="px-4 py-3 flex flex-col gap-1.5">
            <label
              htmlFor="next-action"
              className="text-xs text-muted-foreground"
            >
              例: 来週月曜にサンプル提案 / 月末再訪
            </label>
            <input
              id="next-action"
              type="text"
              name="nextAction"
              placeholder="次にやること"
              className={cn(
                "w-full h-10 rounded-md border border-border bg-background px-3 text-sm",
                "focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:border-brand focus-visible:outline-none",
              )}
            />
          </div>
        </details>

        {/* 下部固定フッター: 終了 CTA */}
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95",
            "supports-backdrop-filter:backdrop-blur",
            "pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 px-4",
            "md:bottom-0",
          )}
        >
          <div className="mx-auto max-w-7xl">
            <button
              type="submit"
              className={cn(
                "w-[90%] mx-auto block h-16 rounded-xl",
                "bg-brand text-brand-foreground hover:bg-brand-dark",
                "shadow-md transition-colors",
                "text-base font-semibold",
                "focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:outline-none",
              )}
              aria-label="訪問を終了する"
            >
              ✓ 訪問を終了する
            </button>
            <p className="text-center text-[11px] text-muted-foreground mt-1.5">
              終了するとホームに戻ります
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
