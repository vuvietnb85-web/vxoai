import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  BookOpen,
  CalendarRange,
  CloudSun,
  BadgeDollarSign,
  Gamepad2,
  Map,
  Mic,
  Radio,
  SlidersHorizontal,
  Tv,
} from "lucide-react";
import { askGrok } from "@/lib/vxo/ask.functions";
import { chime, unlockAudio } from "@/lib/vxo/audio";
import {
  fetchRates,
  fetchWeather,
  NAM_DINH,
  parseIntent,
  readNotes,
  vnd,
  weatherText,
  writeNotes,
  type Note,
  type Place,
} from "@/lib/vxo/intel";
import { solarToLunar, upcomingEvents, vnToday, type EventHit, type LunarDate } from "@/lib/vxo/lunar";
import { Ngame } from "@/components/vxo/ngame";
import { Support } from "@/components/vxo/support";
import { ToolSheet } from "@/components/vxo/tools";
import { type ModuleId } from "@/components/vxo/types";

type ToolId = Exclude<ModuleId, "ngame">;

type Feed =
  | { id: string; kind: "text"; title: string; body: string; source: string }
  | { id: string; kind: "wx"; place: string; temp: number; wind: number; humidity: number | null; code: number; at: string }
  | { id: string; kind: "fx"; rows: { label: string; vnd: number }[]; at: string }
  | { id: string; kind: "notes"; items: Note[] };

const DOCK: { id: ToolId; label: string; icon: typeof Tv }[] = [
  { id: "tv", label: "TV", icon: Tv },
  { id: "radio", label: "ĐÀI", icon: Radio },
  { id: "rec", label: "GHI", icon: Mic },
  { id: "read", label: "ĐỌC", icon: BookOpen },
  { id: "map", label: "ĐỒ", icon: Map },
  { id: "morse", label: "MORSE", icon: AudioLines },
  { id: "wx", label: "TRỜI", icon: CloudSun },
  { id: "fx", label: "GIÁ", icon: BadgeDollarSign },
  { id: "lunar", label: "ÂM", icon: CalendarRange },
  { id: "dsp", label: "NHẠC", icon: SlidersHorizontal },
];

const CHIPS = ["Thời tiết hôm nay", "Tỉ giá USD", "Âm lịch hôm nay", "Học 25 phút", "Mở đài VOV"];

function nid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function speakVi(text: string) {
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

export function VxoApp() {
  const [clock, setClock] = useState<ReturnType<typeof vnToday> | null>(null);
  const [lunar, setLunar] = useState<LunarDate | null>(null);
  const [events, setEvents] = useState<EventHit[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [feed, setFeed] = useState<Feed[]>([]);
  const [place, setPlace] = useState<Place>(NAM_DINH);
  const [tool, setTool] = useState<ToolId | null>(null);
  const [ngame, setNgame] = useState(false);
  const [support, setSupport] = useState(false);
  const [idle, setIdle] = useState(false);
  const [focusLeft, setFocusLeft] = useState<number | null>(null);
  const [pulse, setPulse] = useState("LOA3 ưu tiên · CU 2/13");
  const [brief, setBrief] = useState<{ wx?: string; fx?: string }>({});
  const [sticker, setSticker] = useState<{ left: number; top: number } | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const zoneRef = useRef<HTMLElement>(null);
  const layered = useRef(false);
  const dayKey = useRef("");
  const spoken = useRef("VXOAI sẵn sàng.");
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const focusDone = useRef(false);

  useEffect(() => {
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
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.speechSynthesis?.getVoices();
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    let dead = false;
    void fetchWeather(place.lat, place.lon)
      .then((wx) => {
        if (!dead) setBrief((b) => ({ ...b, wx: `${place.label} ${wx.temp.toFixed(0)}°C · ${weatherText(wx.code)} · Open-Meteo ${wx.at}` }));
      })
      .catch(() => undefined);
    void fetchRates()
      .then((fx) => {
        const usd = fx.rows.find((row) => row.code === "USD");
        if (!dead && usd) setBrief((b) => ({ ...b, fx: `1 USD ≈ ${vnd(usd.vnd)} VND · Frankfurter ${fx.at}` }));
      })
      .catch(() => undefined);
    return () => {
      dead = true;
    };
  }, [place]);

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    let timer = window.setTimeout(() => setIdle(true), 10_000);
    const reset = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), 10_000);
    };
    zone.addEventListener("pointerdown", reset);
    return () => {
      window.clearTimeout(timer);
      zone.removeEventListener("pointerdown", reset);
    };
  }, []);

  useEffect(() => {
    const onPop = () => {
      layered.current = false;
      setTool(null);
      setNgame(false);
      setSupport(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
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
          source: "Đồng hồ trên máy",
        });
      }
      setFocusLeft(null);
      return;
    }
    const timer = window.setTimeout(() => setFocusLeft((n) => (n == null ? n : n - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [focusLeft]);

  function push(item: Feed) {
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

  function openTool(id: ToolId) {
    setNgame(false);
    setSupport(false);
    setTool(id);
    setPulse(`${DOCK.find((item) => item.id === id)?.label ?? id} · sẵn sàng`);
    openLayer();
  }

  async function submit(raw: string) {
    const q = raw.trim();
    if (!q || busy) return;
    setBusy(true);
    setIdle(false);
    const intent = parseIntent(q);
    try {
      if (intent.type === "weather") {
        const wx = await fetchWeather(place.lat, place.lon);
        push({ id: nid(), kind: "wx", place: place.label, ...wx });
      } else if (intent.type === "rates") {
        const fx = await fetchRates();
        push({ id: nid(), kind: "fx", rows: fx.rows, at: fx.at });
      } else if (intent.type === "lunar" && clock && lunar) {
        const next = events[0];
        push({
          id: nid(),
          kind: "text",
          title: "Âm lịch",
          body: `${clock.weekday} ${clock.d}/${clock.m}/${clock.y}. Âm ${lunar.d} tháng ${lunar.m}${lunar.leap ? " nhuận" : ""}, năm ${lunar.yearName}, ngày ${lunar.dayName}.${next ? ` Gần nhất: ${next.name}, còn ${next.days} ngày.` : ""}`,
          source: "Lịch trên máy · múi giờ Việt Nam",
        });
      } else if (intent.type === "note-add") {
        const notes = [{ id: nid(), text: intent.text, at: new Date().toISOString() }, ...readNotes()];
        writeNotes(notes);
        push({ id: nid(), kind: "notes", items: notes.slice(0, 6) });
      } else if (intent.type === "note-list") {
        push({ id: nid(), kind: "notes", items: readNotes() });
      } else if (intent.type === "focus") {
        focusDone.current = false;
        setFocusLeft(25 * 60);
        push({
          id: nid(),
          kind: "text",
          title: "Đồng hồ học",
          body: "25 phút bắt đầu. Máy sẽ kêu một tiếng khi hết.",
          source: "Trên máy",
        });
      } else if (intent.type === "health") {
        push({
          id: nid(),
          kind: "text",
          title: "Không chẩn đoán",
          body: "VXOAI không khám bệnh và không kê đơn. Nghỉ, uống nước, theo dõi. Sốt cao, đau ngực, khó thở hoặc triệu chứng nặng thì đến cơ sở y tế.",
          source: "Luật cố định của ứng dụng",
        });
      } else if (intent.type === "open") {
        if (intent.module === "ngame") {
          setTool(null);
          setSupport(false);
          setNgame(true);
          openLayer();
        } else {
          openTool(intent.module);
        }
        push({
          id: nid(),
          kind: "text",
          title: "Đã mở công cụ",
          body: q,
          source: "VXOAI",
        });
      } else {
        const res = await askGrok({ data: { prompt: q } });
        if (res.ok) {
          push({ id: nid(), kind: "text", title: "Grok", body: res.text, source: "Grok · grok-4.5 · không bịa số liệu" });
        } else if (res.error === "rate") {
          push({
            id: nid(),
            kind: "text",
            title: "Tạm dừng hỏi Grok",
            body: "Đã hỏi nhiều trong giờ này. Thời tiết, tỉ giá, âm lịch và ghi chú vẫn chạy.",
            source: "Giới hạn trên máy chủ",
          });
        } else {
          push({
            id: nid(),
            kind: "text",
            title: "Trên máy",
            body:
              res.error === "no-key"
                ? "Bộ máy Grok chưa mở trong môi trường này. Mình vẫn làm được thời tiết, tỉ giá, âm lịch, ghi chú, đài, Morse và đồng hồ học."
                : "Grok chưa trả lời lúc này. Thử lại sau, hoặc dùng công cụ bên dưới.",
            source: res.error === "no-key" ? "Không có khóa AI" : res.error,
          });
        }
      }
      setQuery("");
    } catch {
      push({
        id: nid(),
        kind: "text",
        title: "Chưa xong",
        body: "Không lấy được dữ liệu. Kiểm tra mạng rồi thử lại.",
        source: "VXOAI",
      });
    } finally {
      setBusy(false);
    }
  }

  const next = events[0];
  const line =
    clock && lunar
      ? `VXOAI · KỶ NGUYÊN AI · ${clock.weekday.toUpperCase()} ${clock.d}.${clock.m}.${clock.y} · ${clock.hh}:${clock.mm} · ÂM ${lunar.d}/${lunar.m}${lunar.leap ? " NHUẬN" : ""} ${lunar.yearName.toUpperCase()} · ${next ? `${next.name.toUpperCase()} CÒN ${next.days} NGÀY` : ""} · LOA3 ƯU TIÊN · NGUỒN CÔNG KHAI`
      : "VXOAI · SIÊU ỨNG DỤNG KỶ NGUYÊN AI";

  const focusLabel =
    focusLeft == null
      ? ""
      : `${String(Math.floor(focusLeft / 60)).padStart(2, "0")}:${String(focusLeft % 60).padStart(2, "0")}`;

  return (
    <div className="deck">
      <header className="topbar">
        <div className="brandrow">
          <div className="mark">VX</div>
          <div className="brand-copy">
            <strong>VXOAI</strong>
            <span>Siêu ứng dụng kỷ nguyên AI</span>
          </div>
          <div className="top-actions">
            <span className="loa" title="LOA3 ưu tiên">
              <i />
              <i />
              <i />
            </span>
            <button type="button" className="ghost" onClick={() => { setTool(null); setSupport(false); setNgame(true); openLayer(); }}>
              <Gamepad2 size={16} /> NGAME
            </button>
            <button type="button" className="ghost" onClick={() => { setTool(null); setNgame(false); setSupport(true); openLayer(); }}>
              ỦNG HỘ
            </button>
          </div>
        </div>
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            <span>{line}</span>
            <span>{line}</span>
          </div>
        </div>
      </header>

      <section className="zone frame stage" ref={zoneRef}>
        <div className="new-zone">
        <div className="new-grid">
          <div>
            <div className="cal">
              <article>
                <div className="kicker">DƯƠNG LỊCH</div>
                <div className="num">{clock ? clock.d : "—"}</div>
                <div className="meta">
                  {clock ? `${clock.weekday} · tháng ${clock.m} · ${clock.y}` : "Giờ Việt Nam"}
                  <br />
                  {clock ? `${clock.hh}:${clock.mm}:${clock.ss}` : ""}
                </div>
              </article>
              <article>
                <div className="kicker">ÂM LỊCH</div>
                <div className="num">{lunar ? lunar.d : "—"}</div>
                <div className="meta">
                  {lunar ? `tháng ${lunar.m}${lunar.leap ? " nhuận" : ""} · ${lunar.yearName}` : "Đang tính"}
                  <br />
                  {lunar ? `ngày ${lunar.dayName}` : ""}
                </div>
              </article>
              <div className="countdown">
                <span>{next ? next.name : "Sự kiện trong năm"}</span>
                <b>{next ? (next.days === 0 ? "HÔM NAY" : `${next.days} NGÀY`) : ""}</b>
              </div>
            </div>

            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault();
                void submit(query);
              }}
            >
              <label className="kicker" htmlFor="need">
                NHU CẦU
              </label>
              <textarea
                id="need"
                value={query}
                placeholder="Thời tiết, tỉ giá, việc cần nhớ, hoặc một câu hỏi…"
                rows={3}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit(query);
                  }
                }}
              />
              <div className="row">
                <button className="primary" type="submit" disabled={busy}>
                  {busy ? "ĐANG LÀM" : "LÀM NGAY"}
                </button>
                <span className="hint">{pulse}</span>
              </div>
            </form>

            <div className="chips">
              {CHIPS.map((chip) => (
                <button key={chip} type="button" className="chip" onClick={() => void submit(chip)}>
                  {chip}
                </button>
              ))}
            </div>

            {focusLeft != null ? (
              <div className="focus">
                <div>
                  <div className="kicker">ĐỒNG HỒ HỌC</div>
                  <b>{focusLabel}</b>
                </div>
                <button type="button" className="ghost" onClick={() => setFocusLeft(null)}>
                  DỪNG
                </button>
              </div>
            ) : null}
          </div>

          <div className="feed" aria-live="polite">
            {feed.length === 0 ? (
              <article className="card empty">
                <h2>SẴN SÀNG</h2>
                <p>
                  Hỏi một việc cụ thể. Số liệu thời tiết và tỉ giá chỉ hiện khi nguồn công khai trả về, kèm giờ và tên nguồn.
                  Ghi chú ở lại trên máy này.
                </p>
              </article>
            ) : (
              feed.map((item) => <FeedCard key={item.id} item={item} />)
            )}
            {idle && !tool ? (
              <aside className="idle">
                <div>{brief.wx ?? "Chưa có thời tiết mới."}</div>
                <div>{brief.fx ?? "Chưa có tỉ giá mới."}</div>
                <div>{next ? `${next.name} còn ${next.days} ngày.` : "Chưa có mốc lịch."}</div>
                <button type="button" onClick={() => setIdle(false)}>
                  Đóng bảng
                </button>
              </aside>
            ) : null}
          </div>
        </div>
        </div>
        {!tool ? (
          <button
            type="button"
            className="sticker"
            style={sticker ? { left: sticker.left, top: sticker.top, right: "auto", bottom: "auto" } : undefined}
            aria-label="Đọc câu trả lời bằng giọng tiếng Việt trên máy"
            onPointerDown={(e) => {
              const zone = zoneRef.current;
              if (!zone) return;
              const zr = zone.getBoundingClientRect();
              const er = e.currentTarget.getBoundingClientRect();
              drag.current = {
                x: e.clientX,
                y: e.clientY,
                left: er.left - zr.left,
                top: er.top - zr.top,
                moved: false,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current || !zoneRef.current) return;
              const dx = e.clientX - drag.current.x;
              const dy = e.clientY - drag.current.y;
              if (Math.hypot(dx, dy) > 5) drag.current.moved = true;
              const zr = zoneRef.current.getBoundingClientRect();
              const left = Math.min(Math.max(8, drag.current.left + dx), zr.width - 72);
              const top = Math.min(Math.max(8, drag.current.top + dy), zr.height - 72);
              setSticker({ left, top });
            }}
            onPointerUp={() => {
              const moved = drag.current?.moved;
              drag.current = null;
              if (moved) return;
              const ok = speakVi(spoken.current);
              setVoiceNote(ok ? "Đang đọc bằng giọng tiếng Việt trên máy." : "Máy này chưa đọc được tiếng Việt.");
            }}
          >
            TTS
            <small>vi-VN</small>
          </button>
        ) : null}
        {voiceNote ? <p className="voice-note">{voiceNote}</p> : null}

        {tool ? (
          <ToolSheet
            id={tool}
            place={place}
            onPlace={setPlace}
            onStatus={setPulse}
            onClose={closeLayer}
          />
        ) : null}
      </section>

      <section className="zone frame cu">
        <div className="dock-status">
          <span>{pulse}</span>
          <span>DSPSS</span>
        </div>
        <div className="dock-row">
          {DOCK.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={tool === item.id ? "dock-btn on" : "dock-btn"}
                onClick={() => openTool(item.id)}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {ngame ? <Ngame onClose={closeLayer} /> : null}
      {support ? <Support onClose={closeLayer} /> : null}
    </div>
  );
}

function FeedCard({ item }: { item: Feed }) {
  if (item.kind === "wx") {
    return (
      <article className="card">
        <div className="kicker">{item.place}</div>
        <div className="wx-temp">{item.temp.toFixed(1)}°</div>
        <p>
          {weatherText(item.code)} · gió {Math.round(item.wind)} km/h
          {item.humidity != null ? ` · ẩm ${item.humidity}%` : ""}
        </p>
        <p className="src">Open-Meteo · {item.at}</p>
      </article>
    );
  }
  if (item.kind === "fx") {
    return (
      <article className="card">
        <h3>Tỉ giá sang VND</h3>
        {item.rows.map((row) => (
          <p key={row.label}>
            {row.label} · {vnd(row.vnd)}
          </p>
        ))}
        <p className="src">Frankfurter · {item.at}</p>
      </article>
    );
  }
  if (item.kind === "notes") {
    return (
      <article className="card">
        <h3>Ghi chú trên máy</h3>
        {item.items.length === 0 ? <p>Chưa có ghi chú. Viết “nhớ …” để lưu.</p> : item.items.map((note) => <p key={note.id}>{note.text}</p>)}
        <p className="src">Chỉ lưu trên trình duyệt này</p>
      </article>
    );
  }
  return (
    <article className="card">
      <h3>{item.title}</h3>
      <p>{item.body}</p>
      <p className="src">{item.source}</p>
    </article>
  );
}
