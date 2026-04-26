import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

type Props = {
  days: number;
  threshold?: number;
  className?: string;
};

/** 最終訪問から N 日以上経過した場合に出す停滞警告帯 */
export function DormantBanner({ days, threshold = 60, className }: Props) {
  if (days < threshold) return null;
  const severe = days >= threshold * 2; // 120日以上は強表示
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        severe
          ? "border-danger/40 bg-danger/5 text-danger"
          : "border-accent-amber/50 bg-accent-amber/10 text-accent-amber-foreground",
        className,
      )}
    >
      <AlertTriangle className="size-4 shrink-0" />
      <span className="font-medium">
        最終訪問から <span className="tabular-nums">{days}</span> 日経過
      </span>
      <span className="text-xs opacity-75">
        {severe ? "要早期訪問" : "訪問を検討しましょう"}
      </span>
    </div>
  );
}
