import { DORMANT_DAYS_THRESHOLD } from "./types";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

/** YYYY-MM-DD(曜) 形式 */
export function formatDateJP(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}(${WEEKDAY[date.getDay()]})`;
}

/** HH:MM */
export function formatTime(d: Date | string | null | undefined): string {
  if (!d) return "--:--";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "--:--";
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** MM/DD */
export function formatMonthDay(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "-";
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${m}/${day}`;
}

/** 最終訪問からの経過日数。未訪問は null */
export function daysSince(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** 停滞判定（A:60日, B:90日, C:無視） */
export function isDormant(
  rank: string,
  lastVisitAt: Date | string | null | undefined,
): boolean {
  const days = daysSince(lastVisitAt);
  if (days === null) return rank !== "C"; // 未訪問は A/B なら停滞扱い
  if (rank === "A") return days >= DORMANT_DAYS_THRESHOLD;
  if (rank === "B") return days >= 90;
  return false;
}

/** メートル → 1,234m / 12.3km 表記 */
export function formatDistance(m: number | null | undefined): string {
  if (m === null || m === undefined) return "-";
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

/** 分数 → 1時間20分 */
export function formatDuration(min: number | null | undefined): string {
  if (min === null || min === undefined) return "-";
  if (min < 60) return `${min}分`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}
