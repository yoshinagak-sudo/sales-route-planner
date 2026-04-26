import { cn } from "@/lib/utils";
import { VISIT_STATUS_LABEL } from "@/lib/types";

type Props = {
  status: string;
  className?: string;
};

export function BadgeVisitStatus({ status, className }: Props) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none";
  let tone = "bg-muted text-muted-foreground";
  let dot = "bg-muted-foreground";
  switch (status) {
    case "COMPLETED":
      tone = "bg-brand/10 text-brand";
      dot = "bg-brand";
      break;
    case "IN_PROGRESS":
      tone = "bg-accent-amber/15 text-accent-amber";
      dot = "bg-accent-amber animate-pulse";
      break;
    case "PLANNED":
      tone = "bg-secondary text-foreground/70";
      dot = "bg-foreground/40";
      break;
    case "CANCELLED":
      tone = "bg-muted text-muted-foreground line-through";
      dot = "bg-muted-foreground";
      break;
    case "NO_SHOW":
      tone = "bg-danger/10 text-danger";
      dot = "bg-danger";
      break;
  }
  return (
    <span className={cn(base, tone, className)}>
      <span className={cn("inline-block size-1.5 rounded-full", dot)} />
      {VISIT_STATUS_LABEL[status] ?? status}
    </span>
  );
}
