import { Navigation, Phone, PlayCircle, Edit } from "lucide-react";
import {
  startVisitAtAccountAction,
  startVisitAction,
} from "@/lib/actions";
import { cn } from "@/lib/utils";

type Account = {
  id: string;
  name: string;
  geoLat: number | null;
  geoLng: number | null;
  phone: string | null;
};

type InProgressVisit = { id: string } | null;

type Props = {
  account: Account;
  /** 同じ取引先で進行中の Visit があれば「訪問中（メモ追加）」に切替 */
  inProgressVisit: InProgressVisit;
  className?: string;
};

/**
 * Account Detail 上部の主要アクション 3 ボタン
 * - 訪問を開始 / 訪問中(メモ追加)  (Primary, 緑, 64px)
 * - ナビ起動                       (Secondary, 外部リンク, 48px)
 * - 電話                           (Ghost, tel: リンク, 48px)
 *
 * Server Action で訪問を作成 → /visits/[id]/record へ遷移する。
 * Phase 1 の方針として fetch / API Route は使わない。
 */
export function VisitActionButtons({
  account,
  inProgressVisit,
  className,
}: Props) {
  const hasGeo =
    typeof account.geoLat === "number" && typeof account.geoLng === "number";
  const mapsUrl = hasGeo
    ? `https://www.google.com/maps/dir/?api=1&destination=${account.geoLat},${account.geoLng}&travelmode=driving`
    : null;
  const telUrl = account.phone
    ? `tel:${account.phone.replace(/[^0-9+]/g, "")}`
    : null;

  // Server Action は事前 bind（form action に渡せる形に）
  const startNew = startVisitAtAccountAction.bind(null, account.id);
  const continueVisit = inProgressVisit
    ? startVisitAction.bind(null, inProgressVisit.id)
    : null;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-[2fr_1fr_1fr]",
        className,
      )}
    >
      {inProgressVisit && continueVisit ? (
        <form action={continueVisit} className="col-span-2 sm:col-span-1">
          <button
            type="submit"
            className={cn(
              "w-full h-16 rounded-xl px-4 text-base font-semibold",
              "bg-accent-amber text-accent-amber-foreground hover:bg-accent-amber/90",
              "shadow-sm transition-colors",
              "flex items-center justify-center gap-2",
              "focus-visible:ring-3 focus-visible:ring-accent-amber/40 focus-visible:outline-none",
            )}
            aria-label="訪問中のメモ画面を開く"
          >
            <Edit className="size-5" aria-hidden="true" />
            訪問中（メモ追加）
          </button>
        </form>
      ) : (
        <form action={startNew} className="col-span-2 sm:col-span-1">
          <button
            type="submit"
            className={cn(
              "w-full h-16 rounded-xl px-4 text-base font-semibold",
              "bg-brand text-brand-foreground hover:bg-brand-dark",
              "shadow-sm transition-colors",
              "flex items-center justify-center gap-2",
              "focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:outline-none",
            )}
            aria-label="訪問を開始する"
          >
            <PlayCircle className="size-5" aria-hidden="true" />
            訪問を開始
          </button>
        </form>
      )}

      {mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "h-16 rounded-xl border-2 border-brand/30 bg-card text-brand",
            "flex items-center justify-center gap-2 text-sm font-medium",
            "hover:bg-brand/5 transition-colors",
            "focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:outline-none",
          )}
          aria-label="Google Maps でナビを起動"
        >
          <Navigation className="size-4" aria-hidden="true" />
          ナビ
        </a>
      ) : (
        <span
          aria-hidden="true"
          className="h-16 rounded-xl border-2 border-border/50 bg-muted/30 text-muted-foreground/60 flex items-center justify-center gap-2 text-xs"
        >
          <Navigation className="size-4" />
          座標未登録
        </span>
      )}

      {telUrl ? (
        <a
          href={telUrl}
          className={cn(
            "h-16 rounded-xl border border-border bg-card text-foreground/80",
            "flex items-center justify-center gap-2 text-sm font-medium",
            "hover:bg-muted transition-colors",
            "focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:outline-none",
          )}
          aria-label={`電話 ${account.phone} に発信`}
        >
          <Phone className="size-4" aria-hidden="true" />
          電話
        </a>
      ) : (
        <span
          aria-hidden="true"
          className="h-16 rounded-xl border border-border/50 bg-muted/30 text-muted-foreground/60 flex items-center justify-center gap-2 text-xs"
        >
          <Phone className="size-4" />
          電話番号なし
        </span>
      )}
    </div>
  );
}
