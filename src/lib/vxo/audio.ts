const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
  5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
};

let ctx: AudioContext | null = null;
let musicEl: HTMLAudioElement | null = null;
let radioEl: HTMLAudioElement | null = null;
let graph: Graph | null = null;

type Graph = {
  hp: BiquadFilterNode;
  low: BiquadFilterNode;
  mid: BiquadFilterNode;
  presence: BiquadFilterNode;
  air: BiquadFilterNode;
  comp: DynamicsCompressorNode;
  gain: GainNode;
};

export type PresetId = "speech" | "music" | "tvpt" | "tvqc";

export function getCtx() {
  if (typeof window === "undefined") throw new Error("audio");
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  try {
    getCtx();
  } catch {
    /* ignore until a real gesture */
  }
}

function tone(at: number, dur: number, freq: number, level = 0.18) {
  const audio = getCtx();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + 0.012);
  gain.gain.setValueAtTime(level, at + Math.max(dur - 0.02, 0.012));
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function chime() {
  const t = getCtx().currentTime + 0.02;
  tone(t, 0.12, 880, 0.12);
  tone(t + 0.16, 0.22, 1318, 0.1);
}

export function clickTick() {
  tone(getCtx().currentTime + 0.01, 0.05, 980, 0.08);
}

export function foldMorse(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toUpperCase();
}

/** Lịch theo AudioContext, chuẩn PARIS: dit = 1.2 / WPM giây. */
export function scheduleMorse(text: string, wpm = 16) {
  const audio = getCtx();
  const dit = 1.2 / wpm;
  let t = audio.currentTime + 0.06;
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
      tone(t, dur * 0.92, 680, 0.16);
      t += dur + dit;
    }
    t += dit * 2;
  }
  return t - audio.currentTime;
}

export function radioElement() {
  if (!radioEl) {
    radioEl = new Audio();
    radioEl.preload = "none";
  }
  return radioEl;
}

export function musicElement() {
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
  graph = { hp, low, mid, presence, air, comp, gain };
  applyPreset("music");
  return graph;
}

export function applyPreset(id: PresetId) {
  const g = ensureGraph();
  const set = {
    speech: { hp: 90, low: 0, midF: 400, midG: -1, preF: 2800, preG: 4, air: -2, thr: -20, ratio: 3.2, gain: 1.15 },
    music: { hp: 35, low: 3, midF: 250, midG: 1.2, preF: 3200, preG: 1.4, air: 1.5, thr: -16, ratio: 2.2, gain: 1.2 },
    tvpt: { hp: 180, low: -1, midF: 800, midG: -2, preF: 2500, preG: 6, air: 0.5, thr: -24, ratio: 6, gain: 1.2 },
    tvqc: { hp: 80, low: -2, midF: 350, midG: -2.5, preF: 3000, preG: 1, air: -3.5, thr: -18, ratio: 2, gain: 1.05 },
  }[id];
  g.hp.frequency.value = set.hp;
  g.low.frequency.value = 120;
  g.low.gain.value = set.low;
  g.mid.frequency.value = set.midF;
  g.mid.Q.value = 0.8;
  g.mid.gain.value = set.midG;
  g.presence.frequency.value = set.preF;
  g.presence.Q.value = 0.9;
  g.presence.gain.value = set.preG;
  g.air.frequency.value = 7500;
  g.air.gain.value = set.air;
  g.comp.threshold.value = set.thr;
  g.comp.ratio.value = set.ratio;
  g.comp.knee.value = 8;
  g.comp.attack.value = 0.01;
  g.comp.release.value = 0.18;
  g.gain.gain.value = set.gain;
}

export function armMusicGraph() {
  ensureGraph();
}
