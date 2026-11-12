import { createServerFn } from "@tanstack/react-start";

export const pullWeather = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const lat = Number((input as { lat?: unknown } | null)?.lat);
    const lon = Number((input as { lon?: unknown } | null)?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("Thiếu tọa độ");
    return {
      lat: Math.min(90, Math.max(-90, lat)),
      lon: Math.min(180, Math.max(-180, lon)),
    };
  })
  .handler(async ({ data }) => {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${data.lat}&longitude=${data.lon}` +
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia%2FHo_Chi_Minh";
      const res = await fetch(url);
      if (!res.ok) return { ok: false as const };
      const json = (await res.json()) as {
        current?: {
          temperature_2m?: number;
          wind_speed_10m?: number;
          relative_humidity_2m?: number;
          weather_code?: number;
        };
      };
      const current = json.current;
      if (!current || typeof current.temperature_2m !== "number") return { ok: false as const };
      return {
        ok: true as const,
        temp: current.temperature_2m,
        wind: current.wind_speed_10m ?? 0,
        humidity: current.relative_humidity_2m ?? null,
        code: current.weather_code ?? -1,
        at: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }),
      };
    } catch {
      return { ok: false as const };
    }
  });

export const pullRates = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=VND,USD,JPY,CNY,KRW");
    if (!res.ok) return { ok: false as const };
    const json = (await res.json()) as { date?: string; rates?: Record<string, number> };
    if (!json.rates?.VND) return { ok: false as const };
    return { ok: true as const, date: json.date ?? "", rates: json.rates };
  } catch {
    return { ok: false as const };
  }
});
