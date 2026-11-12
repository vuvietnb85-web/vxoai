import type { ModuleId } from "@/components/vxo/types";
import { pullRates, pullWeather } from "@/lib/vxo/live.functions";

export type Place = { lat: number; lon: number; label: string };
export const NAM_DINH: Place = { lat: 20.42, lon: 106.168, label: "Nam Định" };

export type Wx = {
  temp: number;
  wind: number;
  humidity: number | null;
  code: number;
  at: string;
};

const wxMemo = new Map<string, { at: number; data: Wx }>();

export function weatherText(code: number) {
  if (code === 0) return "Quang";
  if (code <= 3) return "Nhiều mây";
  if (code === 45 || code === 48) return "Sương mù";
  if (code <= 57) return "Mưa phùn";
  if (code <= 67) return "Mưa";
  if (code <= 77) return "Tuyết";
  if (code <= 82) return "Mưa rào";
  if (code >= 95) return "Dông";
  return "Thay đổi";
}

export async function fetchWeather(lat: number, lon: number): Promise<Wx> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = wxMemo.get(key);
  if (hit && Date.now() - hit.at < 600_000) return hit.data;
  const res = await pullWeather({ data: { lat, lon } });
  if (!res.ok) throw new Error("weather");
  const data: Wx = {
    temp: res.temp,
    wind: res.wind,
    humidity: res.humidity,
    code: res.code,
    at: res.at,
  };
  wxMemo.set(key, { at: Date.now(), data });
  return data;
}

export type FxRow = { code: string; label: string; vnd: number };
export type Fx = { rows: FxRow[]; at: string };

let fxMemo: { at: number; data: Fx } | null = null;

export async function fetchRates(): Promise<Fx> {
  if (fxMemo && Date.now() - fxMemo.at < 600_000) return fxMemo.data;
  const res = await pullRates();
  if (!res.ok) throw new Error("fx");
  const rates = res.rates;
  const vndPerEur = rates.VND;
  if (!vndPerEur) throw new Error("fx");
  const order = [
    ["USD", "1 USD"],
    ["EUR", "1 EUR"],
    ["CNY", "1 CNY"],
    ["JPY", "100 JPY"],
    ["KRW", "100 KRW"],
  ] as const;
  const rows: FxRow[] = order.flatMap(([code, label]) => {
    const perEur = code === "EUR" ? 1 : rates[code];
    if (!perEur) return [];
    const unit = code === "JPY" || code === "KRW" ? 100 : 1;
    return [{ code, label, vnd: (vndPerEur / perEur) * unit }];
  });
  const data = { rows, at: res.date };
  fxMemo = { at: Date.now(), data };
  return data;
}

export function vnd(n: number) {
  return Math.round(n).toLocaleString("vi-VN");
}

export type Note = { id: string; text: string; at: string };
const NOTES_KEY = "vxoai.notes.v1";

export function readNotes(): Note[] {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((n): n is Note => !!n && typeof n === "object" && typeof (n as Note).text === "string")
      .slice(0, 40);
  } catch {
    return [];
  }
}

export function writeNotes(notes: Note[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes.slice(0, 40)));
}

export type Intent =
  | { type: "weather" }
  | { type: "rates" }
  | { type: "lunar" }
  | { type: "note-add"; text: string }
  | { type: "note-list" }
  | { type: "focus" }
  | { type: "health" }
  | { type: "open"; module: ModuleId }
  | { type: "ask" };

export function parseIntent(raw: string): Intent {
  const q = raw.trim();
  const s = q.toLowerCase();
  if (/^(xem|đọc|liệt kê|mở)\s+(ghi chú|ghi nhớ)/.test(s) || s === "ghi chú" || s === "ghi nhớ") {
    return { type: "note-list" };
  }
  const note = q.match(/^(?:ghi chú|ghi nhớ|nhớ)\s*[:：-]?\s+(.+)/i);
  if (note?.[1]) return { type: "note-add", text: note[1].trim() };
  if (/thời tiết|nhiệt độ|trời mưa|trời nắng/.test(s)) return { type: "weather" };
  if (/tỉ giá|tỷ giá|usd|đô la|euro|nhân dân tệ|yên nhật|won/.test(s)) return { type: "rates" };
  if (/âm lịch|can chi|ngày âm|hôm nay là ngày/.test(s)) return { type: "lunar" };
  if (/pomodoro|học 25|đồng hồ học|tập trung 25/.test(s)) return { type: "focus" };
  if (/sức khỏe|bệnh|đau|thuốc|sốt/.test(s)) return { type: "health" };
  if (/morse|điện báo/.test(s)) return { type: "open", module: "morse" };
  if (/radio|đài|vov/.test(s)) return { type: "open", module: "radio" };
  if (/truyền hình|tivi|kênh hình/.test(s)) return { type: "open", module: "tv" };
  if (/bản đồ|định vị|\bgps\b/.test(s)) return { type: "open", module: "map" };
  if (/ghi âm|thu âm|micro/.test(s)) return { type: "open", module: "rec" };
  if (/epub|đọc sách|nhận dạng chữ/.test(s)) return { type: "open", module: "read" };
  if (/master|nhạc tải|loa3|dspss|xử lý âm/.test(s)) return { type: "open", module: "dsp" };
  if (/ngame|đèn hiệu/.test(s)) return { type: "open", module: "ngame" };
  return { type: "ask" };
}
