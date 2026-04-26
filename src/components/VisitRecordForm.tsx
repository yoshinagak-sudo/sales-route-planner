"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { finishVisitAction } from "@/lib/actions";
import { inferFromMemo } from "@/lib/ai-stub";
import { VISIT_PURPOSE_LABEL, type VisitPurpose } from "@/lib/types";
import { cn } from "@/lib/utils";

const PURPOSE_OPTIONS: VisitPurpose[] = [
  "FOLLOW_UP",
  "NEW_PROPOSAL",
  "RELATIONSHIP",
  "COMPLAINT_CARE",
  "CONTRACT",
  "DELIVERY",
  "OTHER",
];

type Props = {
  visitId: string;
};

export function VisitRecordForm({ visitId }: Props) {
  const finish = finishVisitAction.bind(null, visitId);

  const [body, setBody] = React.useState("");
  const [purpose, setPurpose] = React.useState<string>("");
  const [nextAction, setNextAction] = React.useState("");
  const [hint, setHint] = React.useState<string | null>(null);

  const handleInfer = () => {
    const result = inferFromMemo(body);
    if (result.purpose) setPurpose(result.purpose);
    if (result.nextAction) setNextAction(result.nextAction);
    if (!result.purpose && !result.nextAction) {
      setHint("メモが短すぎます。商談内容を1〜2文で書いてください");
      return;
    }
    const parts: string[] = [];
    if (result.purpose)
      parts.push(`用件「${VISIT_PURPOSE_LABEL[result.purpose]}」`);
    if (result.nextAction) parts.push(`次のアクションを推定`);
    setHint(`✨ メモから ${parts.join(" / ")} を補完しました`);
  };

  const canInfer = body.trim().length >= 8;

  return (
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
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="商談内容を簡潔に&#10;例) サンプル渡し済、来週試食会の日程調整"
          className={cn(
            "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm leading-relaxed",
            "resize-y min-h-[7rem]",
            "focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:border-brand focus-visible:outline-none",
          )}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            メモを書いたら ↓ AI 補完で用件と次のアクションを自動入力できます
          </p>
          <button
            type="button"
            onClick={handleInfer}
            disabled={!canInfer}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full",
              "border border-brand/30 bg-brand/5 text-brand-dark",
              "px-3 py-1.5 text-xs font-semibold",
              "hover:bg-brand/10 transition-colors",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:outline-none",
            )}
            aria-label="メモから AI で用件と次のアクションを補完する"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI で補完
          </button>
        </div>
        {hint && (
          <p
            className={cn(
              "text-[11px] rounded-md px-2.5 py-1.5 mt-0.5",
              hint.startsWith("✨")
                ? "text-brand-dark bg-brand/5 border border-brand/20"
                : "text-accent-amber-foreground bg-accent-amber/10 border border-accent-amber/30",
            )}
            aria-live="polite"
          >
            {hint}
          </p>
        )}
      </div>

      {/* 用件 */}
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
                checked={purpose === p}
                onChange={() => setPurpose(p)}
                className="sr-only"
              />
              {VISIT_PURPOSE_LABEL[p]}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 次のアクション */}
      <details
        open={!!nextAction}
        className="rounded-lg border border-border bg-card group"
      >
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
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
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
  );
}
