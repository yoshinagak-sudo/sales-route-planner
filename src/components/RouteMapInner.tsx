"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

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

type Tone = "start-end" | "in-progress" | "planned" | "completed";

const PALETTE: Record<Tone, { fill: string; stroke: string; text: string }> = {
  "start-end": { fill: "#1E4A2A", stroke: "#0e2915", text: "#ffffff" },
  "in-progress": { fill: "#E8A83A", stroke: "#8a6318", text: "#3a2a08" },
  planned: { fill: "#2F6B3D", stroke: "#1E4A2A", text: "#ffffff" },
  completed: { fill: "#8a8f80", stroke: "#5b6150", text: "#ffffff" },
};

function statusToTone(status: string): Tone {
  if (status === "IN_PROGRESS") return "in-progress";
  if (status === "COMPLETED") return "completed";
  return "planned";
}

function buildPinIcon(label: string, tone: Tone): L.DivIcon {
  const p = PALETTE[tone];
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48" style="display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.28));">
  <path d="M20 1 C10 1 2 8.5 2 18 c0 11 18 28 18 28 s18-17 18-28 C38 8.5 30 1 20 1 z"
    fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.5" />
  <circle cx="20" cy="18" r="9" fill="#fff" />
  <text x="20" y="22.5" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif"
    font-size="12" font-weight="700" fill="${p.fill}">${label}</text>
</svg>`.trim();
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [40, 48],
    iconAnchor: [20, 46],
    popupAnchor: [0, -42],
  });
}

export function RouteMap({ start, end, stops }: Props) {
  const positions: [number, number][] = React.useMemo(() => {
    return [
      [start.lat, start.lng],
      ...stops.map((s) => [s.lat, s.lng] as [number, number]),
      [end.lat, end.lng],
    ];
  }, [start, end, stops]);

  const sameStartEnd =
    Math.abs(start.lat - end.lat) < 1e-6 && Math.abs(start.lng - end.lng) < 1e-6;

  return (
    <div className="h-[380px] w-full overflow-hidden rounded-xl border border-border bg-card">
      <MapContainer
        bounds={positions}
        boundsOptions={{ padding: [40, 40] }}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* ルート線 */}
        <Polyline
          positions={positions}
          pathOptions={{
            color: "#2F6B3D",
            weight: 4,
            opacity: 0.75,
            dashArray: "8 6",
          }}
        />

        {/* 始点 */}
        <Marker position={[start.lat, start.lng]} icon={buildPinIcon("S", "start-end")}>
          <Popup>
            <div className="text-xs font-semibold text-muted-foreground tracking-wide">
              出発
            </div>
            <div className="text-sm font-medium">{start.label}</div>
          </Popup>
        </Marker>

        {/* 訪問先 */}
        {stops.map((s, i) => (
          <Marker
            key={s.visitId}
            position={[s.lat, s.lng]}
            icon={buildPinIcon(String(i + 1), statusToTone(s.status))}
          >
            <Popup>
              <div className="text-xs font-semibold text-muted-foreground tracking-wide">
                {i + 1}. {s.scheduledAt} 訪問予定
              </div>
              <div className="text-sm font-medium">{s.name}</div>
            </Popup>
          </Marker>
        ))}

        {/* 終点（始点と異なる場合のみ） */}
        {!sameStartEnd && (
          <Marker position={[end.lat, end.lng]} icon={buildPinIcon("E", "start-end")}>
            <Popup>
              <div className="text-xs font-semibold text-muted-foreground tracking-wide">
                帰着
              </div>
              <div className="text-sm font-medium">{end.label}</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
