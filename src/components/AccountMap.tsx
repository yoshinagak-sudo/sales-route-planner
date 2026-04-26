"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

type AccountPin = {
  id: string;
  name: string;
  rank: string;
  billingAddress: string;
  geoLat: number | null;
  geoLng: number | null;
  lastVisitAt: string | null;
};

type Props = {
  accounts: AccountPin[];
  apiKey?: string | null;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
};

const AccountMapInner = dynamic(
  () => import("./AccountMapInner").then((m) => m.AccountMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[60vh] min-h-96 w-full overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid h-full w-full place-items-center bg-muted/40">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <MapPin className="size-6 animate-pulse" />
            <span className="text-sm">地図を読込中...</span>
          </div>
        </div>
      </div>
    ),
  },
);

export function AccountMap(props: Props) {
  return <AccountMapInner {...props} />;
}
