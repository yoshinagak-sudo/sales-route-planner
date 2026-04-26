import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import { getVisit } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { VisitRecordForm } from "@/components/VisitRecordForm";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

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
        メモを書いて「AI で補完」で用件・次のアクションが自動入力されます。
      </p>

      <VisitRecordForm visitId={id} />
    </div>
  );
}
