import { cn } from "@/lib/utils";

type Props = {
  rank: "A" | "B" | "C" | string;
  size?: "sm" | "md";
  className?: string;
};

/**
 * 取引先ランクバッジ
 * A: ブランド緑ベタ / B: アンバーアウトライン / C: グレーアウトライン
 * 色 + 文字(A/B/C) の両方で判別できるようにしている(色覚対応)。
 */
export function BadgeRank({ rank, size = "sm", className }: Props) {
  const base =
    "inline-flex items-center justify-center font-semibold tabular-nums leading-none";
  const sizing =
    size === "md"
      ? "h-6 w-6 text-xs rounded-md"
      : "h-5 w-5 text-[11px] rounded-[4px]";
  const tone =
    rank === "A"
      ? "bg-brand text-brand-foreground"
      : rank === "B"
        ? "border border-accent-amber text-accent-amber bg-accent-amber/10"
        : "border border-border text-muted-foreground bg-transparent";

  return (
    <span
      className={cn(base, sizing, tone, className)}
      aria-label={`ランク${rank}`}
    >
      {rank}
    </span>
  );
}
