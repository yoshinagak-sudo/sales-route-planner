"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
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

/** ピンの単一カラー（brand トークンに揃える） */
const PIN_FILL = "#2F6B3D";
const PIN_STROKE = "#1E4A2A";

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
  centerLat = 33.3194,
  centerLng = 130.5092,
  zoom = 11,
}: Props) {
  // SSR 中は Leaflet を初期化しない。クライアント mount 後に地図描画。
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const plotable = accounts.filter(
    (a): a is AccountPin & { geoLat: number; geoLng: number } =>
      typeof a.geoLat === "number" && typeof a.geoLng === "number",
  );

  // ピンアイコンは1種類のみ。マウントごとに作り直す必要なし。
  const icon = React.useMemo(() => buildDivIcon(PIN_FILL, PIN_STROKE), []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">
          取引先
          <span className="ml-1 tabular-nums text-foreground font-medium">
            {plotable.length}
          </span>
          {" / "}
          <span className="tabular-nums">{accounts.length}</span> 件 描画
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
              const d = daysSince(a.lastVisitAt);
              return (
                <Marker
                  key={a.id}
                  position={[a.geoLat, a.geoLng]}
                  icon={icon}
                >
                  <Popup>
                    <div className="flex flex-col gap-1 min-w-40">
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
    </div>
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
