import { getCurrentUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/db";
import { AccountMap } from "@/components/AccountMap";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const ownerId = await getCurrentUserId();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_CLIENT_KEY ?? null;

  const accounts = getAccounts(ownerId ? { ownerId } : undefined);
  const serialized = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    rank: a.rank,
    billingAddress: a.billingAddress,
    geoLat: a.geoLat,
    geoLng: a.geoLng,
    lastVisitAt: a.lastVisitAt ? a.lastVisitAt.toISOString() : null,
  }));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-heading font-bold">取引先マップ</h1>
          <p className="text-xs text-muted-foreground">
            担当の取引先 {accounts.length} 件 / ランク × 停滞日数で色分け
          </p>
        </div>
      </header>
      <AccountMap accounts={serialized} apiKey={apiKey} />
    </div>
  );
}
