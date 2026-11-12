/** Âm lịch Việt Nam — thuật toán Hồ Ngọc Đức, múi giờ +7. */

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"] as const;
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;
const WEEKDAY = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"] as const;

export type Ymd = { y: number; m: number; d: number };
export type LunarDate = Ymd & { leap: boolean; yearName: string; dayName: string };

const TZ = 7;

function jdFromDate(dd: number, mm: number, yy: number) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function getNewMoonDay(k: number, timeZone: number) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let c1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  c1 = c1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  c1 = c1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  c1 = c1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  c1 = c1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  c1 = c1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  c1 = c1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltaT =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Math.floor(jd1 + c1 - deltaT + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn: number, timeZone: number) {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let dl = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  dl += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + dl) * dr;
  L -= Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor((L / Math.PI) * 6);
}

function getLunarMonth11(yy: number, timeZone: number) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  if (getSunLongitude(nm, timeZone) >= 9) nm = getNewMoonDay(k - 1, timeZone);
  return nm;
}

function getLeapMonthOffset(a11: number, timeZone: number) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
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

export function canChiYear(year: number) {
  return `${CAN[(year + 6) % 10]} ${CHI[(year + 8) % 12]}`;
}

export function solarToLunar(dd: number, mm: number, yy: number, timeZone = TZ): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
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
    dayName: `${CAN[(dayNumber + 9) % 10]} ${CHI[(dayNumber + 1) % 12]}`,
  };
}

export function vnToday(now = new Date()): Ymd & { hh: string; mm: string; ss: string; weekday: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const bag = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const y = Number(bag.year);
  const m = Number(bag.month);
  const d = Number(bag.day);
  const weekday = WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { y, m, d, hh: bag.hour, mm: bag.minute, ss: bag.second, weekday };
}

export function addDays(base: Ymd, n: number): Ymd {
  const t = new Date(Date.UTC(base.y, base.m - 1, base.d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

function dayNumber(a: Ymd) {
  return Math.round(Date.UTC(a.y, a.m - 1, a.d) / 86400000);
}

export type EventHit = { name: string; when: Ymd; days: number };

const SOLAR: { m: number; d: number; name: string }[] = [
  { m: 1, d: 1, name: "Tết dương lịch" },
  { m: 3, d: 8, name: "Quốc tế phụ nữ" },
  { m: 4, d: 30, name: "Ngày thống nhất" },
  { m: 5, d: 1, name: "Quốc tế lao động" },
  { m: 7, d: 27, name: "Thương binh liệt sĩ" },
  { m: 9, d: 2, name: "Quốc khánh" },
  { m: 11, d: 20, name: "Nhà giáo Việt Nam" },
  { m: 12, d: 22, name: "Thành lập Quân đội" },
  { m: 12, d: 25, name: "Giáng sinh" },
];

const LUNAR_EVENTS: { m: number; d: number; name: string }[] = [
  { m: 1, d: 1, name: "Tết Nguyên Đán" },
  { m: 1, d: 15, name: "Rằm tháng Giêng" },
  { m: 3, d: 10, name: "Giỗ Tổ Hùng Vương" },
  { m: 7, d: 15, name: "Vu Lan" },
  { m: 8, d: 15, name: "Tết Trung thu" },
];

export function upcomingEvents(today: Ymd, horizon = 400): EventHit[] {
  const hits: EventHit[] = [];
  const start = dayNumber(today);
  for (const item of SOLAR) {
    let when = { y: today.y, m: item.m, d: item.d };
    if (dayNumber(when) < start) when = { y: today.y + 1, m: item.m, d: item.d };
    hits.push({ name: item.name, when, days: dayNumber(when) - start });
  }
  for (let i = 0; i <= horizon; i += 1) {
    const when = addDays(today, i);
    const lunar = solarToLunar(when.d, when.m, when.y);
    if (lunar.leap) continue;
    const found = LUNAR_EVENTS.find((e) => e.m === lunar.m && e.d === lunar.d);
    if (found && !hits.some((h) => h.name === found.name)) {
      hits.push({ name: found.name, when, days: i });
    }
  }
  return hits.sort((a, b) => a.days - b.days);
}

export function formatYmd(d: Ymd) {
  return `${String(d.d).padStart(2, "0")}.${String(d.m).padStart(2, "0")}.${d.y}`;
}
