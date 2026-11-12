import { o as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as Map$1, c as CalendarRange, d as AudioLines, i as Mic, l as BookOpen, n as SlidersHorizontal, o as Gamepad2, r as Radio, s as CloudSun, t as Tv, u as BadgeDollarSign } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Ck6op4c2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var askGrok = createServerFn({ method: "POST" }).validator((input) => {
	const prompt = String(input?.prompt ?? "").trim();
	if (!prompt) throw new Error("Hãy nhập nhu cầu");
	return { prompt: prompt.slice(0, 800) };
}).handler(createSsrRpc("b0b74e6b9d0aa7062eafb358512a54c6363db73c7889d5822b9a123fa4271489"));
var MORSE = {
	A: ".-",
	B: "-...",
	C: "-.-.",
	D: "-..",
	E: ".",
	F: "..-.",
	G: "--.",
	H: "....",
	I: "..",
	J: ".---",
	K: "-.-",
	L: ".-..",
	M: "--",
	N: "-.",
	O: "---",
	P: ".--.",
	Q: "--.-",
	R: ".-.",
	S: "...",
	T: "-",
	U: "..-",
	V: "...-",
	W: ".--",
	X: "-..-",
	Y: "-.--",
	Z: "--..",
	0: "-----",
	1: ".----",
	2: "..---",
	3: "...--",
	4: "....-",
	5: ".....",
	6: "-....",
	7: "--...",
	8: "---..",
	9: "----."
};
var ctx = null;
var musicEl = null;
var radioEl = null;
var graph = null;
function getCtx() {
	if (typeof window === "undefined") throw new Error("audio");
	if (!ctx) ctx = new AudioContext();
	if (ctx.state === "suspended") ctx.resume();
	return ctx;
}
function unlockAudio() {
	try {
		getCtx();
	} catch {}
}
function tone(at, dur, freq, level = .18) {
	const audio = getCtx();
	const osc = audio.createOscillator();
	const gain = audio.createGain();
	osc.type = "sine";
	osc.frequency.value = freq;
	gain.gain.setValueAtTime(1e-4, at);
	gain.gain.exponentialRampToValueAtTime(level, at + .012);
	gain.gain.setValueAtTime(level, at + Math.max(dur - .02, .012));
	gain.gain.exponentialRampToValueAtTime(1e-4, at + dur);
	osc.connect(gain).connect(audio.destination);
	osc.start(at);
	osc.stop(at + dur + .02);
}
function chime() {
	const t = getCtx().currentTime + .02;
	tone(t, .12, 880, .12);
	tone(t + .16, .22, 1318, .1);
}
function clickTick() {
	tone(getCtx().currentTime + .01, .05, 980, .08);
}
function foldMorse(text) {
	return text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "d").toUpperCase();
}
/** Lịch theo AudioContext, chuẩn PARIS: dit = 1.2 / WPM giây. */
function scheduleMorse(text, wpm = 16) {
	const audio = getCtx();
	const dit = 1.2 / wpm;
	let t = audio.currentTime + .06;
	const folded = foldMorse(text);
	for (const ch of folded) {
		if (ch === " " || ch === "\n") {
			t += dit * 4;
			continue;
		}
		const code = MORSE[ch];
		if (!code) continue;
		for (const sym of code) {
			const dur = (sym === "-" ? 3 : 1) * dit;
			tone(t, dur * .92, 680, .16);
			t += dur + dit;
		}
		t += dit * 2;
	}
	return t - audio.currentTime;
}
function radioElement() {
	if (!radioEl) {
		radioEl = new Audio();
		radioEl.preload = "none";
	}
	return radioEl;
}
function musicElement() {
	if (!musicEl) {
		musicEl = new Audio();
		musicEl.preload = "auto";
	}
	return musicEl;
}
function ensureGraph() {
	if (graph) return graph;
	const audio = getCtx();
	const el = musicElement();
	const src = audio.createMediaElementSource(el);
	const hp = audio.createBiquadFilter();
	hp.type = "highpass";
	const low = audio.createBiquadFilter();
	low.type = "lowshelf";
	const mid = audio.createBiquadFilter();
	mid.type = "peaking";
	const presence = audio.createBiquadFilter();
	presence.type = "peaking";
	const air = audio.createBiquadFilter();
	air.type = "highshelf";
	const comp = audio.createDynamicsCompressor();
	const gain = audio.createGain();
	src.connect(hp);
	hp.connect(low);
	low.connect(mid);
	mid.connect(presence);
	presence.connect(air);
	air.connect(comp);
	comp.connect(gain);
	gain.connect(audio.destination);
	graph = {
		hp,
		low,
		mid,
		presence,
		air,
		comp,
		gain
	};
	applyPreset("music");
	return graph;
}
function applyPreset(id) {
	const g = ensureGraph();
	const set = {
		speech: {
			hp: 90,
			low: 0,
			midF: 400,
			midG: -1,
			preF: 2800,
			preG: 4,
			air: -2,
			thr: -20,
			ratio: 3.2,
			gain: 1.15
		},
		music: {
			hp: 35,
			low: 3,
			midF: 250,
			midG: 1.2,
			preF: 3200,
			preG: 1.4,
			air: 1.5,
			thr: -16,
			ratio: 2.2,
			gain: 1.2
		},
		tvpt: {
			hp: 180,
			low: -1,
			midF: 800,
			midG: -2,
			preF: 2500,
			preG: 6,
			air: .5,
			thr: -24,
			ratio: 6,
			gain: 1.2
		},
		tvqc: {
			hp: 80,
			low: -2,
			midF: 350,
			midG: -2.5,
			preF: 3e3,
			preG: 1,
			air: -3.5,
			thr: -18,
			ratio: 2,
			gain: 1.05
		}
	}[id];
	g.hp.frequency.value = set.hp;
	g.low.frequency.value = 120;
	g.low.gain.value = set.low;
	g.mid.frequency.value = set.midF;
	g.mid.Q.value = .8;
	g.mid.gain.value = set.midG;
	g.presence.frequency.value = set.preF;
	g.presence.Q.value = .9;
	g.presence.gain.value = set.preG;
	g.air.frequency.value = 7500;
	g.air.gain.value = set.air;
	g.comp.threshold.value = set.thr;
	g.comp.ratio.value = set.ratio;
	g.comp.knee.value = 8;
	g.comp.attack.value = .01;
	g.comp.release.value = .18;
	g.gain.gain.value = set.gain;
}
function armMusicGraph() {
	ensureGraph();
}
var pullWeather = createServerFn({ method: "POST" }).validator((input) => {
	const lat = Number(input?.lat);
	const lon = Number(input?.lon);
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("Thiếu tọa độ");
	return {
		lat: Math.min(90, Math.max(-90, lat)),
		lon: Math.min(180, Math.max(-180, lon))
	};
}).handler(createSsrRpc("44391f8232f977f18e3c1003b4667efa10ee6b753ca590c2080517305ec06b56"));
var pullRates = createServerFn({ method: "GET" }).handler(createSsrRpc("4618b2cc687dbbd349bf406bcc53093577153ceda9c8a8591bc42d00860cf8e0"));
var NAM_DINH = {
	lat: 20.42,
	lon: 106.168,
	label: "Nam Định"
};
var wxMemo = /* @__PURE__ */ new Map();
function weatherText(code) {
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
async function fetchWeather(lat, lon) {
	const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
	const hit = wxMemo.get(key);
	if (hit && Date.now() - hit.at < 6e5) return hit.data;
	const res = await pullWeather({ data: {
		lat,
		lon
	} });
	if (!res.ok) throw new Error("weather");
	const data = {
		temp: res.temp,
		wind: res.wind,
		humidity: res.humidity,
		code: res.code,
		at: res.at
	};
	wxMemo.set(key, {
		at: Date.now(),
		data
	});
	return data;
}
var fxMemo = null;
async function fetchRates() {
	if (fxMemo && Date.now() - fxMemo.at < 6e5) return fxMemo.data;
	const res = await pullRates();
	if (!res.ok) throw new Error("fx");
	const rates = res.rates;
	const vndPerEur = rates.VND;
	if (!vndPerEur) throw new Error("fx");
	const data = {
		rows: [
			["USD", "1 USD"],
			["EUR", "1 EUR"],
			["CNY", "1 CNY"],
			["JPY", "100 JPY"],
			["KRW", "100 KRW"]
		].flatMap(([code, label]) => {
			const perEur = code === "EUR" ? 1 : rates[code];
			if (!perEur) return [];
			const unit = code === "JPY" || code === "KRW" ? 100 : 1;
			return [{
				code,
				label,
				vnd: vndPerEur / perEur * unit
			}];
		}),
		at: res.date
	};
	fxMemo = {
		at: Date.now(),
		data
	};
	return data;
}
function vnd(n) {
	return Math.round(n).toLocaleString("vi-VN");
}
var NOTES_KEY = "vxoai.notes.v1";
function readNotes() {
	try {
		const raw = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
		if (!Array.isArray(raw)) return [];
		return raw.filter((n) => !!n && typeof n === "object" && typeof n.text === "string").slice(0, 40);
	} catch {
		return [];
	}
}
function writeNotes(notes) {
	localStorage.setItem(NOTES_KEY, JSON.stringify(notes.slice(0, 40)));
}
function parseIntent(raw) {
	const q = raw.trim();
	const s = q.toLowerCase();
	if (/^(xem|đọc|liệt kê|mở)\s+(ghi chú|ghi nhớ)/.test(s) || s === "ghi chú" || s === "ghi nhớ") return { type: "note-list" };
	const note = q.match(/^(?:ghi chú|ghi nhớ|nhớ)\s*[:：-]?\s+(.+)/i);
	if (note?.[1]) return {
		type: "note-add",
		text: note[1].trim()
	};
	if (/thời tiết|nhiệt độ|trời mưa|trời nắng/.test(s)) return { type: "weather" };
	if (/tỉ giá|tỷ giá|usd|đô la|euro|nhân dân tệ|yên nhật|won/.test(s)) return { type: "rates" };
	if (/âm lịch|can chi|ngày âm|hôm nay là ngày/.test(s)) return { type: "lunar" };
	if (/pomodoro|học 25|đồng hồ học|tập trung 25/.test(s)) return { type: "focus" };
	if (/sức khỏe|bệnh|đau|thuốc|sốt/.test(s)) return { type: "health" };
	if (/morse|điện báo/.test(s)) return {
		type: "open",
		module: "morse"
	};
	if (/radio|đài|vov/.test(s)) return {
		type: "open",
		module: "radio"
	};
	if (/truyền hình|tivi|kênh hình/.test(s)) return {
		type: "open",
		module: "tv"
	};
	if (/bản đồ|định vị|\bgps\b/.test(s)) return {
		type: "open",
		module: "map"
	};
	if (/ghi âm|thu âm|micro/.test(s)) return {
		type: "open",
		module: "rec"
	};
	if (/epub|đọc sách|nhận dạng chữ/.test(s)) return {
		type: "open",
		module: "read"
	};
	if (/master|nhạc tải|loa3|dspss|xử lý âm/.test(s)) return {
		type: "open",
		module: "dsp"
	};
	if (/ngame|đèn hiệu/.test(s)) return {
		type: "open",
		module: "ngame"
	};
	return { type: "ask" };
}
/** Âm lịch Việt Nam — thuật toán Hồ Ngọc Đức, múi giờ +7. */
var CAN = [
	"Giáp",
	"Ất",
	"Bính",
	"Đinh",
	"Mậu",
	"Kỷ",
	"Canh",
	"Tân",
	"Nhâm",
	"Quý"
];
var CHI = [
	"Tý",
	"Sửu",
	"Dần",
	"Mão",
	"Thìn",
	"Tỵ",
	"Ngọ",
	"Mùi",
	"Thân",
	"Dậu",
	"Tuất",
	"Hợi"
];
var WEEKDAY = [
	"Chủ nhật",
	"Thứ hai",
	"Thứ ba",
	"Thứ tư",
	"Thứ năm",
	"Thứ sáu",
	"Thứ bảy"
];
var TZ = 7;
function jdFromDate(dd, mm, yy) {
	const a = Math.floor((14 - mm) / 12);
	const y = yy + 4800 - a;
	const m = mm + 12 * a - 3;
	let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
	if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
	return jd;
}
function getNewMoonDay(k, timeZone) {
	const T = k / 1236.85;
	const T2 = T * T;
	const T3 = T2 * T;
	const dr = Math.PI / 180;
	let jd1 = 2415020.75933 + 29.53058868 * k + 1178e-7 * T2 - 155e-9 * T3;
	jd1 += 33e-5 * Math.sin((166.56 + 132.87 * T - .009173 * T2) * dr);
	const M = 359.2242 + 29.10535608 * k - 333e-7 * T2 - 347e-8 * T3;
	const Mpr = 306.0253 + 385.81691806 * k + .0107306 * T2 + 1236e-8 * T3;
	const F = 21.2964 + 390.67050646 * k - .0016528 * T2 - 239e-8 * T3;
	let c1 = (.1734 - 393e-6 * T) * Math.sin(M * dr) + .0021 * Math.sin(2 * dr * M);
	c1 = c1 - .4068 * Math.sin(Mpr * dr) + .0161 * Math.sin(dr * 2 * Mpr);
	c1 = c1 - 4e-4 * Math.sin(dr * 3 * Mpr);
	c1 = c1 + .0104 * Math.sin(dr * 2 * F) - .0051 * Math.sin(dr * (M + Mpr));
	c1 = c1 - .0074 * Math.sin(dr * (M - Mpr)) + 4e-4 * Math.sin(dr * (2 * F + M));
	c1 = c1 - 4e-4 * Math.sin(dr * (2 * F - M)) - 6e-4 * Math.sin(dr * (2 * F + Mpr));
	c1 = c1 + .001 * Math.sin(dr * (2 * F - Mpr)) + 5e-4 * Math.sin(dr * (2 * Mpr + M));
	const deltaT = T < -11 ? .001 + 839e-6 * T + 2261e-7 * T2 - 845e-8 * T3 - 81e-9 * T * T3 : -278e-6 + 265e-6 * T + 262e-6 * T2;
	return Math.floor(jd1 + c1 - deltaT + .5 + timeZone / 24);
}
function getSunLongitude(jdn, timeZone) {
	const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
	const T2 = T * T;
	const dr = Math.PI / 180;
	const M = 357.5291 + 35999.0503 * T - 1559e-7 * T2 - 48e-8 * T * T2;
	const L0 = 280.46645 + 36000.76983 * T + 3032e-7 * T2;
	let dl = (1.9146 - .004817 * T - 14e-6 * T2) * Math.sin(dr * M);
	dl += (.019993 - 101e-6 * T) * Math.sin(dr * 2 * M) + 29e-5 * Math.sin(dr * 3 * M);
	let L = (L0 + dl) * dr;
	L -= Math.PI * 2 * Math.floor(L / (Math.PI * 2));
	return Math.floor(L / Math.PI * 6);
}
function getLunarMonth11(yy, timeZone) {
	const off = jdFromDate(31, 12, yy) - 2415021;
	const k = Math.floor(off / 29.530588853);
	let nm = getNewMoonDay(k, timeZone);
	if (getSunLongitude(nm, timeZone) >= 9) nm = getNewMoonDay(k - 1, timeZone);
	return nm;
}
function getLeapMonthOffset(a11, timeZone) {
	const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + .5);
	let last = 0;
	let i = 1;
	let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
	do {
		last = arc;
		i += 1;
		arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
	} while (arc !== last && i < 14);
	return i - 1;
}
function canChiYear(year) {
	return `${CAN[(year + 6) % 10]} ${CHI[(year + 8) % 12]}`;
}
function solarToLunar(dd, mm, yy, timeZone = TZ) {
	const dayNumber = jdFromDate(dd, mm, yy);
	const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
	let monthStart = getNewMoonDay(k + 1, timeZone);
	if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);
	let a11 = getLunarMonth11(yy, timeZone);
	let b11 = a11;
	let lunarYear;
	if (a11 >= monthStart) {
		lunarYear = yy;
		a11 = getLunarMonth11(yy - 1, timeZone);
	} else {
		lunarYear = yy + 1;
		b11 = getLunarMonth11(yy + 1, timeZone);
	}
	const lunarDay = dayNumber - monthStart + 1;
	const diff = Math.floor((monthStart - a11) / 29);
	let lunarLeap = false;
	let lunarMonth = diff + 11;
	if (b11 - a11 > 365) {
		const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
		if (diff >= leapMonthDiff) {
			lunarMonth = diff + 10;
			if (diff === leapMonthDiff) lunarLeap = true;
		}
	}
	if (lunarMonth > 12) lunarMonth -= 12;
	if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
	return {
		d: lunarDay,
		m: lunarMonth,
		y: lunarYear,
		leap: lunarLeap,
		yearName: canChiYear(lunarYear),
		dayName: `${CAN[(dayNumber + 9) % 10]} ${CHI[(dayNumber + 1) % 12]}`
	};
}
function vnToday(now = /* @__PURE__ */ new Date()) {
	const fmt = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Ho_Chi_Minh",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23"
	});
	const bag = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
	const y = Number(bag.year);
	const m = Number(bag.month);
	const d = Number(bag.day);
	const weekday = WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
	return {
		y,
		m,
		d,
		hh: bag.hour,
		mm: bag.minute,
		ss: bag.second,
		weekday
	};
}
function addDays(base, n) {
	const t = new Date(Date.UTC(base.y, base.m - 1, base.d + n));
	return {
		y: t.getUTCFullYear(),
		m: t.getUTCMonth() + 1,
		d: t.getUTCDate()
	};
}
function dayNumber(a) {
	return Math.round(Date.UTC(a.y, a.m - 1, a.d) / 864e5);
}
var SOLAR = [
	{
		m: 1,
		d: 1,
		name: "Tết dương lịch"
	},
	{
		m: 3,
		d: 8,
		name: "Quốc tế phụ nữ"
	},
	{
		m: 4,
		d: 30,
		name: "Ngày thống nhất"
	},
	{
		m: 5,
		d: 1,
		name: "Quốc tế lao động"
	},
	{
		m: 7,
		d: 27,
		name: "Thương binh liệt sĩ"
	},
	{
		m: 9,
		d: 2,
		name: "Quốc khánh"
	},
	{
		m: 11,
		d: 20,
		name: "Nhà giáo Việt Nam"
	},
	{
		m: 12,
		d: 22,
		name: "Thành lập Quân đội"
	},
	{
		m: 12,
		d: 25,
		name: "Giáng sinh"
	}
];
var LUNAR_EVENTS = [
	{
		m: 1,
		d: 1,
		name: "Tết Nguyên Đán"
	},
	{
		m: 1,
		d: 15,
		name: "Rằm tháng Giêng"
	},
	{
		m: 3,
		d: 10,
		name: "Giỗ Tổ Hùng Vương"
	},
	{
		m: 7,
		d: 15,
		name: "Vu Lan"
	},
	{
		m: 8,
		d: 15,
		name: "Tết Trung thu"
	}
];
function upcomingEvents(today, horizon = 400) {
	const hits = [];
	const start = dayNumber(today);
	for (const item of SOLAR) {
		let when = {
			y: today.y,
			m: item.m,
			d: item.d
		};
		if (dayNumber(when) < start) when = {
			y: today.y + 1,
			m: item.m,
			d: item.d
		};
		hits.push({
			name: item.name,
			when,
			days: dayNumber(when) - start
		});
	}
	for (let i = 0; i <= horizon; i += 1) {
		const when = addDays(today, i);
		const lunar = solarToLunar(when.d, when.m, when.y);
		if (lunar.leap) continue;
		const found = LUNAR_EVENTS.find((e) => e.m === lunar.m && e.d === lunar.d);
		if (found && !hits.some((h) => h.name === found.name)) hits.push({
			name: found.name,
			when,
			days: i
		});
	}
	return hits.sort((a, b) => a.days - b.days);
}
function formatYmd(d) {
	return `${String(d.d).padStart(2, "0")}.${String(d.m).padStart(2, "0")}.${d.y}`;
}
var KEYS = [
	"A",
	"B",
	"X",
	"Y"
];
var BEST = "vxoai.ngame.best";
function Ngame({ onClose }) {
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [seq, setSeq] = (0, import_react.useState)([]);
	const [step, setStep] = (0, import_react.useState)(0);
	const [score, setScore] = (0, import_react.useState)(0);
	const [best, setBest] = (0, import_react.useState)(0);
	const [flash, setFlash] = (0, import_react.useState)(null);
	const [tempo, setTempo] = (0, import_react.useState)(0);
	const knob = (0, import_react.useRef)(null);
	const run = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		const n = Number(localStorage.getItem(BEST) || "0");
		if (Number.isFinite(n)) setBest(n);
	}, []);
	function wait(ms) {
		return new Promise((resolve) => window.setTimeout(resolve, ms));
	}
	async function playRound(length, token) {
		const next = Array.from({ length }, () => KEYS[Math.floor(Math.random() * KEYS.length)]);
		setSeq(next);
		setPhase("show");
		const gap = 460 - tempo * 180;
		for (const key of next) {
			if (run.current !== token) return;
			setFlash(key);
			clickTick();
			await wait(gap);
			if (run.current !== token) return;
			setFlash(null);
			await wait(140);
		}
		if (run.current !== token) return;
		setStep(0);
		setPhase("input");
	}
	function start() {
		const token = run.current + 1;
		run.current = token;
		setScore(0);
		playRound(1, token);
	}
	function press(key) {
		if (phase !== "input") return;
		clickTick();
		if (key !== seq[step]) {
			setPhase("done");
			setBest((b) => {
				const n = Math.max(b, score);
				localStorage.setItem(BEST, String(n));
				return n;
			});
			return;
		}
		if (step + 1 >= seq.length) {
			const nextScore = score + 1;
			setScore(nextScore);
			const token = run.current;
			playRound(seq.length + 1, token);
			return;
		}
		setStep(step + 1);
	}
	function onPad(e) {
		const rect = e.currentTarget.getBoundingClientRect();
		const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
		const clamped = Math.max(-1, Math.min(1, dy));
		setTempo(Math.max(0, Math.min(1, -clamped)));
		if (knob.current) knob.current.style.top = `${50 + clamped * 32}%`;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overlay",
		role: "dialog",
		"aria-label": "NGAME đèn hiệu",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ngame",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hemi",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pad",
						onPointerDown: onPad,
						onPointerMove: (e) => e.buttons === 1 && onPad(e),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "knob",
							ref: knob
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "kicker",
						children: "NHỊP"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ngame-mid",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "kicker",
							children: "NGAME"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "ĐÈN HIỆU" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "score",
							children: score
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "meta",
							children: [
								phase === "idle" && "Nhắc lại chuỗi đèn. Kỷ lục trên máy này.",
								phase === "show" && "Nhìn chuỗi, rồi bấm đúng thứ tự.",
								phase === "input" && `Lượt ${step + 1} / ${seq.length}`,
								phase === "done" && "Sai đèn. Bắt đầu lại khi sẵn sàng."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "meta",
							children: ["Kỷ lục ", best]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "primary",
								onClick: start,
								children: phase === "idle" || phase === "done" ? "BẮT ĐẦU" : "LÀM LẠI"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ghost",
								onClick: onClose,
								children: "ĐÓNG"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hemi",
					children: KEYS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: flash === key ? "abxy lit" : "abxy",
						onClick: () => press(key),
						children: key
					}, key))
				})
			]
		})
	});
}
var SCRIPT_ID = "vxoai-paypal-sdk";
var SCRIPT_SRC = "https://www.paypal.com/sdk/js?client-id=BAAIfuQli_a3Qud-8CIRqCRCeohqtiW29_i2Txx2rQM35pqMc-pbCIZX6L8tx1zbyOj_vp8AUE_dpSqOhc&components=hosted-buttons&disable-funding=venmo&currency=USD";
function Support({ onClose }) {
	const [note, setNote] = (0, import_react.useState)("Đang mở nút PayPal…");
	(0, import_react.useEffect)(() => {
		let dead = false;
		const render = async () => {
			if (!window.paypal || dead) return;
			const el = document.getElementById("paypal-container-T7AZ748Y27248");
			if (!el || el.childElementCount > 0) {
				if (!dead) setNote("");
				return;
			}
			try {
				await window.paypal.HostedButtons({ hostedButtonId: "T7AZ748Y27248" }).render("#paypal-container-T7AZ748Y27248");
				if (!dead) setNote("");
			} catch {
				if (!dead) setNote("Nút PayPal chưa hiện. Bạn vẫn ủng hộ được qua MoMo.");
			}
		};
		const existing = document.getElementById(SCRIPT_ID);
		if (window.paypal) render();
		else if (existing) {
			existing.addEventListener("load", () => void render(), { once: true });
			existing.addEventListener("error", () => setNote("PayPal không tải được trên mạng này."), { once: true });
		} else {
			const script = document.createElement("script");
			script.id = SCRIPT_ID;
			script.src = SCRIPT_SRC;
			script.async = true;
			script.onload = () => void render();
			script.onerror = () => {
				if (!dead) setNote("PayPal không tải được trên mạng này.");
			};
			document.body.appendChild(script);
		}
		return () => {
			dead = true;
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overlay",
		role: "dialog",
		"aria-label": "Ủng hộ",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "support frame",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "ỦNG HỘ VXOAI" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Tự nguyện. Không khóa tính năng nào." }),
				note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: note }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { id: "paypal-container-T7AZ748Y27248" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "momo",
					href: "https://me.momo.vn/vuquocviet",
					target: "_blank",
					rel: "noreferrer",
					children: "MOMO · 0988 960 419"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "row",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ghost",
						onClick: onClose,
						children: "ĐÓNG"
					})
				})
			]
		})
	});
}
var MODULE_LABEL = {
	tv: "Truyền hình",
	radio: "Đài phát thanh",
	rec: "Ghi âm",
	read: "Đọc EPUB",
	map: "Bản đồ",
	morse: "Morse",
	wx: "Thời tiết",
	fx: "Tỉ giá",
	lunar: "Âm lịch",
	dsp: "Master âm thanh",
	ngame: "NGAME"
};
var VOV = [
	{
		name: "VOV1",
		detail: "Thời sự",
		url: "https://stream.vovmedia.vn/vov-1"
	},
	{
		name: "VOV2",
		detail: "Văn hóa",
		url: "https://stream.vovmedia.vn/vov-2"
	},
	{
		name: "VOV3",
		detail: "Âm nhạc",
		url: "https://stream.vovmedia.vn/vov-3"
	},
	{
		name: "VOV GT Hà Nội",
		detail: "Giao thông",
		url: "https://stream.vovmedia.vn/vovgt-hn"
	},
	{
		name: "VOV GT TP.HCM",
		detail: "Giao thông",
		url: "https://stream.vovmedia.vn/vovgt-hcm"
	},
	{
		name: "VOV5",
		detail: "Thế giới",
		url: "https://stream.vovmedia.vn/vov5"
	},
	{
		name: "FM89",
		detail: "Sức khỏe",
		url: "https://stream.vovmedia.vn/fm89"
	}
];
var TV = [
	{
		name: "Hà Nội 1",
		url: "https://liveh34.vtvprime.vn/hls/HANOI1TV/index.m3u8"
	},
	{
		name: "Cần Thơ",
		url: "https://live.canthotv.vn/live/tv/chunklist.m3u8"
	},
	{
		name: "Hà Tĩnh",
		url: "https://cohauw9bgpvod.vcdn.cloud/httv1/index.m3u8"
	},
	{
		name: "Cao Bằng",
		url: "https://stream.thingnet.vn/live/smil:CRTV.smil/chunklist.m3u8"
	},
	{
		name: "Đồng Tháp",
		url: "https://liveh34.vtvprime.vn/hls/DONGTHAPTV/index.m3u8"
	},
	{
		name: "Hưng Yên",
		url: "https://ott3.nethubtv.vn/live/hungyentv/playlist.m3u8"
	}
];
var PRESETS = [
	{
		id: "speech",
		label: "Lời nói"
	},
	{
		id: "music",
		label: "Nhạc · LOA3"
	},
	{
		id: "tvpt",
		label: "Phóng thanh"
	},
	{
		id: "tvqc",
		label: "Quảng cáo"
	}
];
function ToolSheet({ id, place, onPlace, onClose, onStatus }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "sheet frame",
		role: "dialog",
		"aria-label": MODULE_LABEL[id],
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sheet-head",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: MODULE_LABEL[id].toUpperCase() }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "ghost",
				onClick: onClose,
				children: "ĐÓNG"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet-body",
			children: [
				id === "tv" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TvTool, { onStatus }),
				id === "radio" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioTool, { onStatus }),
				id === "rec" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecTool, { onStatus }),
				id === "read" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadTool, {}),
				id === "map" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapTool, {
					place,
					onPlace
				}),
				id === "morse" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MorseTool, {}),
				id === "wx" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WxTool, {
					place,
					onPlace
				}),
				id === "fx" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FxTool, {}),
				id === "lunar" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LunarTool, {}),
				id === "dsp" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DspTool, { onStatus })
			]
		})]
	});
}
function TvTool({ onStatus }) {
	const videoRef = (0, import_react.useRef)(null);
	const hlsRef = (0, import_react.useRef)(null);
	const [current, setCurrent] = (0, import_react.useState)(null);
	const [live, setLive] = (0, import_react.useState)(false);
	const [err, setErr] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => () => hlsRef.current?.destroy(), []);
	async function play(ch) {
		const video = videoRef.current;
		if (!video) return;
		setErr(null);
		setLive(false);
		setCurrent(ch.name);
		onStatus(`TV · ${ch.name} · đang nối`);
		hlsRef.current?.destroy();
		hlsRef.current = null;
		video.removeAttribute("src");
		video.load();
		if (video.canPlayType("application/vnd.apple.mpegurl")) {
			video.src = ch.url;
			try {
				await video.play();
				setLive(true);
				onStatus(`TV · ${ch.name} · trực tiếp`);
			} catch {
				setErr("Không phát được kênh này.");
				onStatus(`TV · ${ch.name} · mất tín hiệu`);
			}
			return;
		}
		try {
			const { default: Hls } = await import("../_libs/hls.js.mjs").then((n) => n.t);
			if (!Hls.isSupported()) {
				setErr("Trình duyệt này không phát HLS.");
				return;
			}
			const hls = new Hls({ maxBufferLength: 12 });
			hlsRef.current = hls;
			hls.loadSource(ch.url);
			hls.attachMedia(video);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				setLive(true);
				onStatus(`TV · ${ch.name} · trực tiếp`);
				video.play().catch(() => void 0);
			});
			hls.on(Hls.Events.ERROR, (_e, data) => {
				if (!data.fatal) return;
				setLive(false);
				setErr("Mất tín hiệu hoặc đài chặn phát ngoài vùng. Thử kênh khác.");
				onStatus(`TV · ${ch.name} · mất tín hiệu`);
				hls.destroy();
			});
		} catch {
			setErr("Không nạp được bộ phát.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
			ref: videoRef,
			className: "video",
			controls: true,
			playsInline: true
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "meta",
			children: ["Kênh công cộng. Mất tín hiệu thì bỏ qua.", live && current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "live",
				children: "TRỰC TIẾP"
			}) : null]
		}),
		err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: err }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "list",
			children: TV.map((ch) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: current === ch.name ? "choice on" : "choice",
				onClick: () => void play(ch),
				children: ch.name
			}, ch.name))
		})
	] });
}
function RadioTool({ onStatus }) {
	const [extra, setExtra] = (0, import_react.useState)([]);
	const [current, setCurrent] = (0, import_react.useState)(null);
	const [err, setErr] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const ctrl = new AbortController();
		fetch("https://de1.api.radio-browser.info/json/stations/search?countrycode=VN&hidebroken=true&order=clickcount&reverse=true&limit=18", { signal: ctrl.signal }).then((r) => r.ok ? r.json() : []).then((rows) => {
			const seen = new Set(VOV.map((s) => s.name.toLowerCase()));
			const more = rows.map((row) => ({
				name: (row.name || "Đài").slice(0, 42),
				detail: row.state || "Radio Browser",
				url: row.url_resolved || row.url || ""
			})).filter((row) => row.url && !seen.has(row.name.toLowerCase()));
			setExtra(more.slice(0, 12));
		}).catch(() => void 0);
		return () => ctrl.abort();
	}, []);
	async function play(station) {
		setErr(null);
		const audio = radioElement();
		audio.src = station.url;
		try {
			await audio.play();
			setCurrent(station.name);
			onStatus(`Đài · ${station.name} · đang phát`);
			if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({
				title: station.name,
				artist: "VXOAI"
			});
			localStorage.setItem("vxoai.radio", station.name);
		} catch {
			setErr("Không phát được đài này. Thử đài khác.");
			onStatus(`Đài · ${station.name} · lỗi`);
		}
	}
	function stop() {
		radioElement().pause();
		setCurrent(null);
		onStatus("Đài · đã dừng");
	}
	const stations = [...VOV, ...extra];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "meta",
			children: current ? `Đang phát ${current}` : "Bấm một đài. VOV phát trực tiếp, đài khác lấy từ Radio Browser."
		}),
		err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: err }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "row",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "ghost",
				onClick: stop,
				children: "DỪNG"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "list",
			children: stations.map((st) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: current === st.name ? "choice on" : "choice",
				onClick: () => void play(st),
				children: [st.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: st.detail })]
			}, st.name + st.url))
		})
	] });
}
function RecTool({ onStatus }) {
	const recRef = (0, import_react.useRef)(null);
	const chunks = (0, import_react.useRef)([]);
	const streamRef = (0, import_react.useRef)(null);
	const raf = (0, import_react.useRef)(0);
	const [on, setOn] = (0, import_react.useState)(false);
	const [level, setLevel] = (0, import_react.useState)(0);
	const [clip, setClip] = (0, import_react.useState)(null);
	const [err, setErr] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => () => stopTracks(), []);
	function stopTracks() {
		cancelAnimationFrame(raf.current);
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
	}
	async function start() {
		setErr(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;
			const audio = getCtx();
			const src = audio.createMediaStreamSource(stream);
			const analyser = audio.createAnalyser();
			analyser.fftSize = 256;
			src.connect(analyser);
			const data = new Uint8Array(analyser.fftSize);
			const loop = () => {
				analyser.getByteTimeDomainData(data);
				let sum = 0;
				for (const n of data) {
					const v = (n - 128) / 128;
					sum += v * v;
				}
				setLevel(Math.min(100, Math.sqrt(sum / data.length) * 260));
				raf.current = requestAnimationFrame(loop);
			};
			loop();
			chunks.current = [];
			const rec = new MediaRecorder(stream);
			rec.ondataavailable = (e) => {
				if (e.data.size) chunks.current.push(e.data);
			};
			rec.onstop = () => {
				const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
				setClip(URL.createObjectURL(blob));
				stopTracks();
				onStatus("Ghi âm · đã lưu trên máy");
			};
			rec.start(1e3);
			recRef.current = rec;
			setOn(true);
			onStatus("Ghi âm · đang ghi");
		} catch {
			setErr("Chưa có quyền micro. Bấm lại và cho phép, hoặc kiểm tra micro.");
		}
	}
	function stop() {
		recRef.current?.stop();
		setOn(false);
		setLevel(0);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "meta",
			children: "Chỉ ghi khi bạn bấm. File nằm trên máy, không tải lên."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "meter",
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: `${level}%` } })
		}),
		err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: err }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "row",
			children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "primary",
				onClick: stop,
				children: "DỪNG"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "primary",
				onClick: () => void start(),
				children: "GHI"
			})
		}),
		clip ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
			controls: true,
			src: clip
		}) : null
	] });
}
function ReadTool() {
	const [chapters, setChapters] = (0, import_react.useState)([]);
	const [idx, setIdx] = (0, import_react.useState)(0);
	const [msg, setMsg] = (0, import_react.useState)("Mở EPUB, TXT, hoặc một ảnh để nhận dạng chữ Việt.");
	async function onText(file) {
		const text = await file.text();
		setChapters([{
			title: file.name,
			text: text.slice(0, 8e4)
		}]);
		setIdx(0);
		setMsg(file.name);
	}
	async function onEpub(file) {
		setMsg("Đang mở EPUB…");
		const { default: JSZip } = await import("../_libs/jszip+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
		const zip = await JSZip.loadAsync(await file.arrayBuffer());
		const container = await zip.file("META-INF/container.xml")?.async("string");
		if (!container) throw new Error("Không phải EPUB.");
		const cdoc = new DOMParser().parseFromString(container, "text/xml");
		const full = Array.from(cdoc.getElementsByTagName("*")).find((el) => el.localName === "rootfile")?.getAttribute("full-path");
		if (!full) throw new Error("EPUB thiếu mục lục.");
		const opfXml = await zip.file(full)?.async("string");
		if (!opfXml) throw new Error("Không đọc được gói sách.");
		const opf = new DOMParser().parseFromString(opfXml, "text/xml");
		const nodes = Array.from(opf.getElementsByTagName("*"));
		const title = nodes.find((el) => el.localName === "title")?.textContent?.trim() || file.name;
		const hrefs = /* @__PURE__ */ new Map();
		for (const el of nodes) if (el.localName === "item" && el.getAttribute("id") && el.getAttribute("href")) hrefs.set(el.getAttribute("id"), el.getAttribute("href"));
		const base = full.includes("/") ? full.slice(0, full.lastIndexOf("/") + 1) : "";
		const built = [];
		for (const el of nodes) {
			if (el.localName !== "itemref" || built.length >= 30) continue;
			const href = hrefs.get(el.getAttribute("idref") || "");
			if (!href || !/\.(x?html|htm)$/i.test(href)) continue;
			const path = joinPath(base, href);
			const html = await zip.file(path)?.async("string");
			if (!html) continue;
			const text = htmlToText(html);
			if (text.length < 20) continue;
			built.push({
				title: `${title} · ${built.length + 1}`,
				text: text.slice(0, 2e4)
			});
		}
		if (!built.length) throw new Error("Sách không có chương chữ.");
		setChapters(built);
		setIdx(0);
		setMsg(title);
	}
	async function onImage(file) {
		setMsg("Đang tải bộ nhận dạng chữ Việt…");
		const { createWorker } = await import("../_libs/tesseract.js.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
		const worker = await createWorker("vie");
		try {
			const { data } = await worker.recognize(file);
			const text = data.text.trim();
			if (!text) {
				setMsg("Không thấy chữ trong ảnh.");
				return;
			}
			setChapters([{
				title: file.name,
				text
			}]);
			setIdx(0);
			setMsg("Đã nhận dạng. Nguồn: Tesseract · vie");
		} finally {
			await worker.terminate();
		}
	}
	async function onFile(file) {
		if (!file) return;
		try {
			if (file.type.startsWith("image/")) await onImage(file);
			else if (file.name.toLowerCase().endsWith(".epub") || file.type.includes("epub")) await onEpub(file);
			else await onText(file);
		} catch (error) {
			setMsg(error instanceof Error ? error.message : "Không mở được tệp.");
		}
	}
	const chapter = chapters[idx];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "meta",
			children: msg
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "primary filebtn",
			children: ["CHỌN TỆP", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "file",
				accept: ".epub,.txt,text/plain,application/epub+zip,image/*",
				onChange: (e) => void onFile(e.target.files?.[0])
			})]
		}),
		chapter ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "row",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ghost",
					disabled: idx === 0,
					onClick: () => setIdx((n) => n - 1),
					children: "TRƯỚC"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "meta",
					children: [
						idx + 1,
						"/",
						chapters.length
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ghost",
					disabled: idx >= chapters.length - 1,
					onClick: () => setIdx((n) => n + 1),
					children: "SAU"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
			className: "chapter",
			children: chapter.text
		})] }) : null
	] });
}
function htmlToText(html) {
	const doc = new DOMParser().parseFromString(html, "text/html");
	doc.querySelectorAll("script,style").forEach((node) => node.remove());
	return (doc.body?.textContent || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function joinPath(base, href) {
	const parts = `${base}${href}`.split("/");
	const out = [];
	for (const part of parts) if (part === "..") out.pop();
	else if (part && part !== ".") out.push(part);
	return decodeURIComponent(out.join("/"));
}
function MapTool({ place, onPlace }) {
	const [msg, setMsg] = (0, import_react.useState)("Bấm vị trí chỉ khi bạn muốn. Không theo dõi nền.");
	const d = .12;
	const src = `https://www.openstreetmap.org/export/embed.html?bbox=${[
		place.lon - d,
		place.lat - d,
		place.lon + d,
		place.lat + d
	].map((n) => n.toFixed(4)).join("%2C")}&layer=mapnik&marker=${place.lat}%2C${place.lon}`;
	function locate() {
		if (!navigator.geolocation) {
			setMsg("Máy không có định vị. Vẫn hiện Nam Định.");
			return;
		}
		navigator.geolocation.getCurrentPosition((pos) => {
			onPlace({
				lat: pos.coords.latitude,
				lon: pos.coords.longitude,
				label: "Vị trí của bạn"
			});
			setMsg("Đã lấy vị trí một lần.");
		}, () => setMsg("Chưa được cấp vị trí. Vẫn hiện Nam Định."), {
			enableHighAccuracy: false,
			timeout: 8e3,
			maximumAge: 6e4
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "meta",
			children: [
				place.label,
				" · ",
				place.lat.toFixed(3),
				", ",
				place.lon.toFixed(3)
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
			className: "mapframe",
			title: "Bản đồ OpenStreetMap",
			src
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "meta",
			children: "© OpenStreetMap"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "meta",
			children: msg
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "primary",
			onClick: locate,
			children: "VỊ TRÍ CỦA TÔI"
		})
	] });
}
function MorseTool() {
	const [text, setText] = (0, import_react.useState)("VXOAI");
	const [wpm, setWpm] = (0, import_react.useState)(16);
	const [msg, setMsg] = (0, import_react.useState)("Gõ tin, rồi phát. Nhịp bám đồng hồ âm thanh.");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			value: text,
			onChange: (e) => setText(e.target.value),
			rows: 3,
			maxLength: 180
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "meta",
			children: [
				"Tốc độ ",
				wpm,
				" WPM",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 8,
					max: 28,
					value: wpm,
					onChange: (e) => setWpm(Number(e.target.value))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "primary",
			onClick: () => {
				const seconds = scheduleMorse(text, wpm);
				setMsg(seconds > 0 ? `Đang phát khoảng ${Math.ceil(seconds)} giây.` : "Không có ký tự Morse.");
			},
			children: "PHÁT"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "meta",
			children: msg
		})
	] });
}
function WxTool({ place, onPlace }) {
	const [body, setBody] = (0, import_react.useState)("Đang lấy số liệu Open-Meteo…");
	const [err, setErr] = (0, import_react.useState)(null);
	async function load(target) {
		setErr(null);
		try {
			const wx = await fetchWeather(target.lat, target.lon);
			setBody(`${target.label}\n${wx.temp.toFixed(1)}°C · ${weatherText(wx.code)}\nGió ${Math.round(wx.wind)} km/h` + (wx.humidity != null ? ` · ẩm ${wx.humidity}%` : "") + `\nLúc ${wx.at}`);
		} catch {
			setErr("Không lấy được thời tiết. Thử lại.");
		}
	}
	(0, import_react.useEffect)(() => {
		load(place);
	}, [place.lat, place.lon]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "chapter",
			children: body
		}),
		err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: err }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "meta",
			children: "Nguồn: Open-Meteo. Không phải cảnh báo thiên tai chính thức."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "row",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ghost",
					onClick: () => void load(place),
					children: "LÀM MỚI"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ghost",
					onClick: () => {
						onPlace(NAM_DINH);
					},
					children: "NAM ĐỊNH"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "primary",
					onClick: () => {
						navigator.geolocation?.getCurrentPosition((pos) => onPlace({
							lat: pos.coords.latitude,
							lon: pos.coords.longitude,
							label: "Vị trí của bạn"
						}), () => setErr("Chưa được cấp vị trí."), {
							enableHighAccuracy: false,
							timeout: 8e3
						});
					},
					children: "VỊ TRÍ"
				})
			]
		})
	] });
}
function FxTool() {
	const [rows, setRows] = (0, import_react.useState)([]);
	const [at, setAt] = (0, import_react.useState)("");
	const [err, setErr] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		fetchRates().then((fx) => {
			setRows(fx.rows);
			setAt(fx.at);
		}).catch(() => setErr("Không lấy được tỉ giá Frankfurter."));
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: err }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "list",
			children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "choice",
				children: [row.label, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [vnd(row.vnd), " VND"] })]
			}, row.label))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "meta",
			children: [
				"Nguồn: Frankfurter",
				at ? ` · ${at}` : "",
				". Tỉ giá tham khảo, không phải giá ngân hàng."
			]
		})
	] });
}
function LunarTool() {
	const [now, setNow] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const tick = () => setNow(vnToday());
		tick();
		const id = window.setInterval(tick, 1e3);
		return () => window.clearInterval(id);
	}, []);
	const dayKey = now ? `${now.y}-${now.m}-${now.d}` : "";
	const events = (0, import_react.useMemo)(() => {
		if (!dayKey) return [];
		const [y, m, d] = dayKey.split("-").map(Number);
		return upcomingEvents({
			y,
			m,
			d
		}).slice(0, 6);
	}, [dayKey]);
	if (!now) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "meta",
		children: "Đang lấy lịch…"
	});
	const lunar = solarToLunar(now.d, now.m, now.y);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
			now.weekday,
			", ",
			formatYmd(now),
			" · ",
			now.hh,
			":",
			now.mm,
			":",
			now.ss
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
			"Âm ",
			lunar.d,
			" tháng ",
			lunar.m,
			lunar.leap ? " nhuận" : "",
			" · ",
			lunar.yearName,
			" · ngày ",
			lunar.dayName
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "list",
			children: events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "choice",
				children: [event.name, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
					event.days === 0 ? "Hôm nay" : `Còn ${event.days} ngày`,
					" · ",
					formatYmd(event.when)
				] })]
			}, event.name))
		})
	] });
}
function DspTool({ onStatus }) {
	const [preset, setPreset] = (0, import_react.useState)("music");
	const [name, setName] = (0, import_react.useState)(null);
	const urlRef = (0, import_react.useRef)(null);
	function choose(id) {
		setPreset(id);
		applyPreset(id);
		onStatus(id === "music" ? "Nhạc · LOA3" : `Master · ${id}`);
	}
	function onFile(file) {
		if (!file) return;
		const audio = musicElement();
		if (urlRef.current) URL.revokeObjectURL(urlRef.current);
		const url = URL.createObjectURL(file);
		urlRef.current = url;
		audio.src = url;
		armMusicGraph();
		applyPreset(preset);
		audio.play();
		setName(file.name);
		onStatus(`Nhạc · ${file.name} · LOA3`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "meta",
			children: "EQ và nén áp cho file trên máy. LOA3 là độ bù sau nén, không phải đo cự ly loa."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "presets",
			children: PRESETS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: preset === item.id ? "chip choice on" : "chip",
				onClick: () => choose(item.id),
				children: item.label
			}, item.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "primary filebtn",
			children: ["CHỌN NHẠC", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "file",
				accept: "audio/*",
				onChange: (e) => onFile(e.target.files?.[0])
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "meta",
			children: name ?? "Chưa chọn file."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "row",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ghost",
					onClick: () => {
						armMusicGraph();
						musicElement().play();
					},
					children: "PHÁT"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ghost",
					onClick: () => musicElement().pause(),
					children: "TẠM DỪNG"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ghost",
					onClick: () => chime(),
					children: "THỬ TIẾNG"
				})
			]
		})
	] });
}
var DOCK = [
	{
		id: "tv",
		label: "TV",
		icon: Tv
	},
	{
		id: "radio",
		label: "ĐÀI",
		icon: Radio
	},
	{
		id: "rec",
		label: "GHI",
		icon: Mic
	},
	{
		id: "read",
		label: "ĐỌC",
		icon: BookOpen
	},
	{
		id: "map",
		label: "ĐỒ",
		icon: Map$1
	},
	{
		id: "morse",
		label: "MORSE",
		icon: AudioLines
	},
	{
		id: "wx",
		label: "TRỜI",
		icon: CloudSun
	},
	{
		id: "fx",
		label: "GIÁ",
		icon: BadgeDollarSign
	},
	{
		id: "lunar",
		label: "ÂM",
		icon: CalendarRange
	},
	{
		id: "dsp",
		label: "NHẠC",
		icon: SlidersHorizontal
	}
];
var CHIPS = [
	"Thời tiết hôm nay",
	"Tỉ giá USD",
	"Âm lịch hôm nay",
	"Học 25 phút",
	"Mở đài VOV"
];
function nid() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
function speakVi(text) {
	if (typeof window === "undefined" || !window.speechSynthesis) return false;
	const utter = new SpeechSynthesisUtterance(text.slice(0, 420));
	utter.lang = "vi-VN";
	const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("vi"));
	if (voice) utter.voice = voice;
	utter.rate = 1;
	window.speechSynthesis.cancel();
	window.speechSynthesis.speak(utter);
	return true;
}
function VxoApp() {
	const [clock, setClock] = (0, import_react.useState)(null);
	const [lunar, setLunar] = (0, import_react.useState)(null);
	const [events, setEvents] = (0, import_react.useState)([]);
	const [query, setQuery] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [feed, setFeed] = (0, import_react.useState)([]);
	const [place, setPlace] = (0, import_react.useState)(NAM_DINH);
	const [tool, setTool] = (0, import_react.useState)(null);
	const [ngame, setNgame] = (0, import_react.useState)(false);
	const [support, setSupport] = (0, import_react.useState)(false);
	const [idle, setIdle] = (0, import_react.useState)(false);
	const [focusLeft, setFocusLeft] = (0, import_react.useState)(null);
	const [pulse, setPulse] = (0, import_react.useState)("LOA3 ưu tiên · CU 2/13");
	const [brief, setBrief] = (0, import_react.useState)({});
	const [sticker, setSticker] = (0, import_react.useState)(null);
	const [voiceNote, setVoiceNote] = (0, import_react.useState)(null);
	const zoneRef = (0, import_react.useRef)(null);
	const layered = (0, import_react.useRef)(false);
	const dayKey = (0, import_react.useRef)("");
	const spoken = (0, import_react.useRef)("VXOAI sẵn sàng.");
	const drag = (0, import_react.useRef)(null);
	const focusDone = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		const tick = () => {
			const now = vnToday();
			setClock(now);
			setLunar(solarToLunar(now.d, now.m, now.y));
			const key = `${now.y}-${now.m}-${now.d}`;
			if (dayKey.current !== key) {
				dayKey.current = key;
				setEvents(upcomingEvents(now));
			}
		};
		tick();
		const id = window.setInterval(tick, 1e3);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		const unlock = () => unlockAudio();
		window.addEventListener("pointerdown", unlock, { once: true });
		window.speechSynthesis?.getVoices();
		return () => window.removeEventListener("pointerdown", unlock);
	}, []);
	(0, import_react.useEffect)(() => {
		let dead = false;
		fetchWeather(place.lat, place.lon).then((wx) => {
			if (!dead) setBrief((b) => ({
				...b,
				wx: `${place.label} ${wx.temp.toFixed(0)}°C · ${weatherText(wx.code)} · Open-Meteo ${wx.at}`
			}));
		}).catch(() => void 0);
		fetchRates().then((fx) => {
			const usd = fx.rows.find((row) => row.code === "USD");
			if (!dead && usd) setBrief((b) => ({
				...b,
				fx: `1 USD ≈ ${vnd(usd.vnd)} VND · Frankfurter ${fx.at}`
			}));
		}).catch(() => void 0);
		return () => {
			dead = true;
		};
	}, [place]);
	(0, import_react.useEffect)(() => {
		const zone = zoneRef.current;
		if (!zone) return;
		let timer = window.setTimeout(() => setIdle(true), 1e4);
		const reset = () => {
			setIdle(false);
			window.clearTimeout(timer);
			timer = window.setTimeout(() => setIdle(true), 1e4);
		};
		zone.addEventListener("pointerdown", reset);
		return () => {
			window.clearTimeout(timer);
			zone.removeEventListener("pointerdown", reset);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const onPop = () => {
			layered.current = false;
			setTool(null);
			setNgame(false);
			setSupport(false);
		};
		window.addEventListener("popstate", onPop);
		return () => window.removeEventListener("popstate", onPop);
	}, []);
	(0, import_react.useEffect)(() => {
		if (focusLeft == null) return;
		if (focusLeft <= 0) {
			if (!focusDone.current) {
				focusDone.current = true;
				chime();
				push({
					id: nid(),
					kind: "text",
					title: "Hết phiên học",
					body: "25 phút đã xong. Nghỉ mắt một lát rồi học tiếp nếu muốn.",
					source: "Đồng hồ trên máy"
				});
			}
			setFocusLeft(null);
			return;
		}
		const timer = window.setTimeout(() => setFocusLeft((n) => n == null ? n : n - 1), 1e3);
		return () => window.clearTimeout(timer);
	}, [focusLeft]);
	function push(item) {
		if (item.kind === "text") spoken.current = `${item.title}. ${item.body}`;
		else if (item.kind === "wx") spoken.current = `${item.place} ${item.temp.toFixed(0)} độ, ${weatherText(item.code)}.`;
		else if (item.kind === "fx") spoken.current = item.rows.map((row) => `${row.label} ${vnd(row.vnd)} đồng`).join(". ");
		setFeed((list) => [item, ...list].slice(0, 12));
	}
	function openLayer() {
		if (!layered.current) {
			history.pushState({ vxoLayer: 1 }, "");
			layered.current = true;
		}
	}
	function closeLayer() {
		if (layered.current) history.back();
		else {
			setTool(null);
			setNgame(false);
			setSupport(false);
		}
	}
	function openTool(id) {
		setNgame(false);
		setSupport(false);
		setTool(id);
		setPulse(`${DOCK.find((item) => item.id === id)?.label ?? id} · sẵn sàng`);
		openLayer();
	}
	async function submit(raw) {
		const q = raw.trim();
		if (!q || busy) return;
		setBusy(true);
		setIdle(false);
		const intent = parseIntent(q);
		try {
			if (intent.type === "weather") {
				const wx = await fetchWeather(place.lat, place.lon);
				push({
					id: nid(),
					kind: "wx",
					place: place.label,
					...wx
				});
			} else if (intent.type === "rates") {
				const fx = await fetchRates();
				push({
					id: nid(),
					kind: "fx",
					rows: fx.rows,
					at: fx.at
				});
			} else if (intent.type === "lunar" && clock && lunar) {
				const next = events[0];
				push({
					id: nid(),
					kind: "text",
					title: "Âm lịch",
					body: `${clock.weekday} ${clock.d}/${clock.m}/${clock.y}. Âm ${lunar.d} tháng ${lunar.m}${lunar.leap ? " nhuận" : ""}, năm ${lunar.yearName}, ngày ${lunar.dayName}.${next ? ` Gần nhất: ${next.name}, còn ${next.days} ngày.` : ""}`,
					source: "Lịch trên máy · múi giờ Việt Nam"
				});
			} else if (intent.type === "note-add") {
				const notes = [{
					id: nid(),
					text: intent.text,
					at: (/* @__PURE__ */ new Date()).toISOString()
				}, ...readNotes()];
				writeNotes(notes);
				push({
					id: nid(),
					kind: "notes",
					items: notes.slice(0, 6)
				});
			} else if (intent.type === "note-list") push({
				id: nid(),
				kind: "notes",
				items: readNotes()
			});
			else if (intent.type === "focus") {
				focusDone.current = false;
				setFocusLeft(1500);
				push({
					id: nid(),
					kind: "text",
					title: "Đồng hồ học",
					body: "25 phút bắt đầu. Máy sẽ kêu một tiếng khi hết.",
					source: "Trên máy"
				});
			} else if (intent.type === "health") push({
				id: nid(),
				kind: "text",
				title: "Không chẩn đoán",
				body: "VXOAI không khám bệnh và không kê đơn. Nghỉ, uống nước, theo dõi. Sốt cao, đau ngực, khó thở hoặc triệu chứng nặng thì đến cơ sở y tế.",
				source: "Luật cố định của ứng dụng"
			});
			else if (intent.type === "open") {
				if (intent.module === "ngame") {
					setTool(null);
					setSupport(false);
					setNgame(true);
					openLayer();
				} else openTool(intent.module);
				push({
					id: nid(),
					kind: "text",
					title: "Đã mở công cụ",
					body: q,
					source: "VXOAI"
				});
			} else {
				const res = await askGrok({ data: { prompt: q } });
				if (res.ok) push({
					id: nid(),
					kind: "text",
					title: "Grok",
					body: res.text,
					source: "Grok · grok-4.5 · không bịa số liệu"
				});
				else if (res.error === "rate") push({
					id: nid(),
					kind: "text",
					title: "Tạm dừng hỏi Grok",
					body: "Đã hỏi nhiều trong giờ này. Thời tiết, tỉ giá, âm lịch và ghi chú vẫn chạy.",
					source: "Giới hạn trên máy chủ"
				});
				else push({
					id: nid(),
					kind: "text",
					title: "Trên máy",
					body: res.error === "no-key" ? "Bộ máy Grok chưa mở trong môi trường này. Mình vẫn làm được thời tiết, tỉ giá, âm lịch, ghi chú, đài, Morse và đồng hồ học." : "Grok chưa trả lời lúc này. Thử lại sau, hoặc dùng công cụ bên dưới.",
					source: res.error === "no-key" ? "Không có khóa AI" : res.error
				});
			}
			setQuery("");
		} catch {
			push({
				id: nid(),
				kind: "text",
				title: "Chưa xong",
				body: "Không lấy được dữ liệu. Kiểm tra mạng rồi thử lại.",
				source: "VXOAI"
			});
		} finally {
			setBusy(false);
		}
	}
	const next = events[0];
	const line = clock && lunar ? `VXOAI · KỶ NGUYÊN AI · ${clock.weekday.toUpperCase()} ${clock.d}.${clock.m}.${clock.y} · ${clock.hh}:${clock.mm} · ÂM ${lunar.d}/${lunar.m}${lunar.leap ? " NHUẬN" : ""} ${lunar.yearName.toUpperCase()} · ${next ? `${next.name.toUpperCase()} CÒN ${next.days} NGÀY` : ""} · LOA3 ƯU TIÊN · NGUỒN CÔNG KHAI` : "VXOAI · SIÊU ỨNG DỤNG KỶ NGUYÊN AI";
	const focusLabel = focusLeft == null ? "" : `${String(Math.floor(focusLeft / 60)).padStart(2, "0")}:${String(focusLeft % 60).padStart(2, "0")}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "deck",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "topbar",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "brandrow",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mark",
							children: "VX"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "brand-copy",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "VXOAI" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Siêu ứng dụng kỷ nguyên AI" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "top-actions",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "loa",
									title: "LOA3 ưu tiên",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "ghost",
									onClick: () => {
										setTool(null);
										setSupport(false);
										setNgame(true);
										openLayer();
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gamepad2, { size: 16 }), " NGAME"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ghost",
									onClick: () => {
										setTool(null);
										setNgame(false);
										setSupport(true);
										openLayer();
									},
									children: "ỦNG HỘ"
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ticker",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ticker-track",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: line }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: line })]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "zone frame stage",
				ref: zoneRef,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "new-zone",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "new-grid",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "cal",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "kicker",
												children: "DƯƠNG LỊCH"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "num",
												children: clock ? clock.d : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "meta",
												children: [
													clock ? `${clock.weekday} · tháng ${clock.m} · ${clock.y}` : "Giờ Việt Nam",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													clock ? `${clock.hh}:${clock.mm}:${clock.ss}` : ""
												]
											})
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "kicker",
												children: "ÂM LỊCH"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "num",
												children: lunar ? lunar.d : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "meta",
												children: [
													lunar ? `tháng ${lunar.m}${lunar.leap ? " nhuận" : ""} · ${lunar.yearName}` : "Đang tính",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													lunar ? `ngày ${lunar.dayName}` : ""
												]
											})
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "countdown",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: next ? next.name : "Sự kiện trong năm" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: next ? next.days === 0 ? "HÔM NAY" : `${next.days} NGÀY` : "" })]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									className: "composer",
									onSubmit: (e) => {
										e.preventDefault();
										submit(query);
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "kicker",
											htmlFor: "need",
											children: "NHU CẦU"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											id: "need",
											value: query,
											placeholder: "Thời tiết, tỉ giá, việc cần nhớ, hoặc một câu hỏi…",
											rows: 3,
											onChange: (e) => setQuery(e.target.value),
											onKeyDown: (e) => {
												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault();
													submit(query);
												}
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "row",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "primary",
												type: "submit",
												disabled: busy,
												children: busy ? "ĐANG LÀM" : "LÀM NGAY"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "hint",
												children: pulse
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "chips",
									children: CHIPS.map((chip) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "chip",
										onClick: () => void submit(chip),
										children: chip
									}, chip))
								}),
								focusLeft != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "focus",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "kicker",
										children: "ĐỒNG HỒ HỌC"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: focusLabel })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "ghost",
										onClick: () => setFocusLeft(null),
										children: "DỪNG"
									})]
								}) : null
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "feed",
								"aria-live": "polite",
								children: [feed.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "card empty",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "SẴN SÀNG" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Hỏi một việc cụ thể. Số liệu thời tiết và tỉ giá chỉ hiện khi nguồn công khai trả về, kèm giờ và tên nguồn. Ghi chú ở lại trên máy này." })]
								}) : feed.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedCard, { item }, item.id)), idle && !tool ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
									className: "idle",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: brief.wx ?? "Chưa có thời tiết mới." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: brief.fx ?? "Chưa có tỉ giá mới." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: next ? `${next.name} còn ${next.days} ngày.` : "Chưa có mốc lịch." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setIdle(false),
											children: "Đóng bảng"
										})
									]
								}) : null]
							})]
						})
					}),
					!tool ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "sticker",
						style: sticker ? {
							left: sticker.left,
							top: sticker.top,
							right: "auto",
							bottom: "auto"
						} : void 0,
						"aria-label": "Đọc câu trả lời bằng giọng tiếng Việt trên máy",
						onPointerDown: (e) => {
							const zone = zoneRef.current;
							if (!zone) return;
							const zr = zone.getBoundingClientRect();
							const er = e.currentTarget.getBoundingClientRect();
							drag.current = {
								x: e.clientX,
								y: e.clientY,
								left: er.left - zr.left,
								top: er.top - zr.top,
								moved: false
							};
							e.currentTarget.setPointerCapture(e.pointerId);
						},
						onPointerMove: (e) => {
							if (!drag.current || !zoneRef.current) return;
							const dx = e.clientX - drag.current.x;
							const dy = e.clientY - drag.current.y;
							if (Math.hypot(dx, dy) > 5) drag.current.moved = true;
							const zr = zoneRef.current.getBoundingClientRect();
							const left = Math.min(Math.max(8, drag.current.left + dx), zr.width - 72);
							const top = Math.min(Math.max(8, drag.current.top + dy), zr.height - 72);
							setSticker({
								left,
								top
							});
						},
						onPointerUp: () => {
							const moved = drag.current?.moved;
							drag.current = null;
							if (moved) return;
							const ok = speakVi(spoken.current);
							setVoiceNote(ok ? "Đang đọc bằng giọng tiếng Việt trên máy." : "Máy này chưa đọc được tiếng Việt.");
						},
						children: ["TTS", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "vi-VN" })]
					}) : null,
					voiceNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "voice-note",
						children: voiceNote
					}) : null,
					tool ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolSheet, {
						id: tool,
						place,
						onPlace: setPlace,
						onStatus: setPulse,
						onClose: closeLayer
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "zone frame cu",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "dock-status",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: pulse }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "DSPSS" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "dock-row",
					children: DOCK.map((item) => {
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: tool === item.id ? "dock-btn on" : "dock-btn",
							onClick: () => openTool(item.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {}), item.label]
						}, item.id);
					})
				})]
			}),
			ngame ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ngame, { onClose: closeLayer }) : null,
			support ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Support, { onClose: closeLayer }) : null
		]
	});
}
function FeedCard({ item }) {
	if (item.kind === "wx") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "kicker",
				children: item.place
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "wx-temp",
				children: [item.temp.toFixed(1), "°"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				weatherText(item.code),
				" · gió ",
				Math.round(item.wind),
				" km/h",
				item.humidity != null ? ` · ẩm ${item.humidity}%` : ""
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "src",
				children: ["Open-Meteo · ", item.at]
			})
		]
	});
	if (item.kind === "fx") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Tỉ giá sang VND" }),
			item.rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				row.label,
				" · ",
				vnd(row.vnd)
			] }, row.label)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "src",
				children: ["Frankfurter · ", item.at]
			})
		]
	});
	if (item.kind === "notes") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Ghi chú trên máy" }),
			item.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Chưa có ghi chú. Viết “nhớ …” để lưu." }) : item.items.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: note.text }, note.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "src",
				children: "Chỉ lưu trên trình duyệt này"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: item.title }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: item.body }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "src",
				children: item.source
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VxoApp, {});
}
//#endregion
export { Home as component };
