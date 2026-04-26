"use client";

import dynamic from "next/dynamic";
import { Navigation } from "lucide-react";

type Stop = {
  visitId: string;
  accountId: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  scheduledAt: string;
};

type Props = {
  start: { lat: number; lng: number; label: string };
  end: { lat: number; lng: number; label: string };
  stops: Stop[];
};

const RouteMapInner = dynamic(
  () => import("./RouteMapInner").then((m) => m.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] w-full overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid h-full w-full place-items-center bg-muted/40">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Navigation className="size-6 animate-pulse" />
            <span className="text-sm">地図を読込中...</span>
          </div>
        </div>
      </div>
    ),
  },
);

export function RouteMap(props: Props) {
  return <RouteMapInner {...props} />;
}
