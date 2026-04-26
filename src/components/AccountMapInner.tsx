"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { cn } from "@/lib/utils";
import { daysSince, formatDateJP } from "@/lib/format";

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
  /** 互換性のため残置。Leafletでは未使用。 */
  apiKey?: string | null;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
};

/** 2軸合成式: ランク x 最終訪問日でピン色を決める */
export function getPinColor(
  rank: string,
  lastVisitAt: string | Date | null | undefined,
): {
  fill: string;
  stroke: string;
  label: string;
} {
  const days = daysSince(lastVisitAt ?? null);
  if (rank === "A") {
    if (days === null || days >= 60) {
      // 停滞A -> 赤
      return { fill: "#C23B22", stroke: "#7a2416", label: "A停滞" };
    }
    return { fill: "#1E4A2A", stroke: "#0e2915", label: "A訪問済" }; // 濃緑
  }
  if (rank === "B") {
    if (days === null || days >= 90) {
      return { fill: "#E8A83A", stroke: "#8a6318", label: "B停滞" };
    }
    return { fill: "#4A8F58", stroke: "#2f6b3d", label: "B訪問済" };
  }
  return { fill: "#8a8f80", stroke: "#5b6150", label: "C" }; // グレー
}

/**
 * Leaflet の divIcon で SVG ピンを描画。
 * デフォルトのマーカー画像 (Webpack/Turbopack で壊れがち) を完全に避ける。
 */
function buildDivIcon(fill: string, stroke: string): L.DivIcon {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42" style="display:block;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,0.25));">
  <path d="M17 1 C8.72 1 2 7.5 2 15.4 c0 9.9 15 25 15 25 s15-15.1 15-25 C32 7.5 25.28 1 17 1 z"
    fill="${fill}" stroke="${stroke}" stroke-width="1.5" />
  <circle cx="17" cy="15" r="5" fill="#fff" />
</svg>`.trim();
  return L.divIcon({
    html: svg,
    className: "", // デフォルトの白背景・枠を消す
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36],
  });
}

export function AccountMap({
  accounts,
  centerLat = 38.2682,
  centerLng = 140.8694,
  zoom = 11,
}: Props) {
  const [rankFilter, setRankFilter] = React.useState<string | null>(null);
  // SSR 中は Leaflet を初期化しない。クライアント mount 後に地図描画。
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = rankFilter
    ? accounts.filter((a) => a.rank === rankFilter)
    : accounts;
  const plotable = filtered.filter(
    (a): a is AccountPin & { geoLat: number; geoLng: number } =>
      typeof a.geoLat === "number" && typeof a.geoLng === "number",
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">絞り込み:</span>
        <FilterChip
          label="全て"
          active={rankFilter === null}
          onClick={() => setRankFilter(null)}
        />
        <FilterChip
          label="Aランク"
          active={rankFilter === "A"}
          onClick={() => setRankFilter("A")}
        />
        <FilterChip
          label="Bランク"
          active={rankFilter === "B"}
          onClick={() => setRankFilter("B")}
        />
        <FilterChip
          label="Cランク"
          active={rankFilter === "C"}
          onClick={() => setRankFilter("C")}
        />
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {plotable.length} / {filtered.length} 件 描画
        </span>
      </div>
      <div className="h-[60vh] min-h-96 w-full overflow-hidden rounded-xl border border-border bg-card">
        {mounted ? (
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {plotable.map((a) => {
              const pin = getPinColor(a.rank, a.lastVisitAt);
              const icon = buildDivIcon(pin.fill, pin.stroke);
              const d = daysSince(a.lastVisitAt);
              return (
                <Marker
                  key={a.id}
                  position={[a.geoLat, a.geoLng]}
                  icon={icon}
                >
                  <Popup>
                    <div className="flex flex-col gap-1 min-w-40">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ backgroundColor: pin.fill }}
                          aria-hidden="true"
                        />
                        <span className="text-xs font-semibold tracking-wide text-muted-foreground">
                          {pin.label}
                        </span>
                      </div>
                      <div className="text-sm font-medium leading-tight">
                        {a.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        最終訪問: {formatDateJP(a.lastVisitAt)}
                        {d !== null ? `（${d}日前）` : ""}
                      </div>
                      <a
                        href={`/accounts/${a.id}`}
                        className="mt-1 text-xs font-medium text-brand hover:underline"
                      >
                        詳細を見る →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          <MapSkeleton />
        )}
      </div>
      <MapLegend />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 rounded-full px-3 text-xs font-medium border transition-colors",
        active
          ? "bg-brand text-brand-foreground border-brand"
          : "border-border bg-card text-foreground hover:bg-muted",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function MapLegend() {
  const items: { color: string; label: string }[] = [
    { color: "#C23B22", label: "A停滞 (60日超)" },
    { color: "#1E4A2A", label: "A訪問済" },
    { color: "#E8A83A", label: "B停滞 (90日超)" },
    { color: "#4A8F58", label: "B訪問済" },
    { color: "#8a8f80", label: "C" },
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      {items.map((i) => (
        <li key={i.color} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: i.color }}
            aria-hidden="true"
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function MapSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center bg-muted/40">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <MapPin className="size-6 animate-pulse" />
        <span className="text-sm">地図を読込中...</span>
      </div>
    </div>
  );
}
