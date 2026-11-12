import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/live.functions-CxBFVRc9.js
var pullWeather_createServerFn_handler = createServerRpc({
	id: "44391f8232f977f18e3c1003b4667efa10ee6b753ca590c2080517305ec06b56",
	name: "pullWeather",
	filename: "src/lib/vxo/live.functions.ts"
}, (opts) => pullWeather.__executeServer(opts));
var pullWeather = createServerFn({ method: "POST" }).validator((input) => {
	const lat = Number(input?.lat);
	const lon = Number(input?.lon);
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("Thiếu tọa độ");
	return {
		lat: Math.min(90, Math.max(-90, lat)),
		lon: Math.min(180, Math.max(-180, lon))
	};
}).handler(pullWeather_createServerFn_handler, async ({ data }) => {
	try {
		const url = `https://api.open-meteo.com/v1/forecast?latitude=${data.lat}&longitude=${data.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia%2FHo_Chi_Minh`;
		const res = await fetch(url);
		if (!res.ok) return { ok: false };
		const current = (await res.json()).current;
		if (!current || typeof current.temperature_2m !== "number") return { ok: false };
		return {
			ok: true,
			temp: current.temperature_2m,
			wind: current.wind_speed_10m ?? 0,
			humidity: current.relative_humidity_2m ?? null,
			code: current.weather_code ?? -1,
			at: (/* @__PURE__ */ new Date()).toLocaleString("vi-VN", {
				timeZone: "Asia/Ho_Chi_Minh",
				hour12: false
			})
		};
	} catch {
		return { ok: false };
	}
});
var pullRates_createServerFn_handler = createServerRpc({
	id: "4618b2cc687dbbd349bf406bcc53093577153ceda9c8a8591bc42d00860cf8e0",
	name: "pullRates",
	filename: "src/lib/vxo/live.functions.ts"
}, (opts) => pullRates.__executeServer(opts));
var pullRates = createServerFn({ method: "GET" }).handler(pullRates_createServerFn_handler, async () => {
	try {
		const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=VND,USD,JPY,CNY,KRW");
		if (!res.ok) return { ok: false };
		const json = await res.json();
		if (!json.rates?.VND) return { ok: false };
		return {
			ok: true,
			date: json.date ?? "",
			rates: json.rates
		};
	} catch {
		return { ok: false };
	}
});
//#endregion
export { pullRates_createServerFn_handler, pullWeather_createServerFn_handler };
