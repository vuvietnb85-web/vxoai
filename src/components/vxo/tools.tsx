import { useEffect, useMemo, useRef, useState } from "react";
import { applyPreset, armMusicGraph, chime, getCtx, musicElement, radioElement, scheduleMorse, type PresetId } from "@/lib/vxo/audio";
import { fetchRates, fetchWeather, NAM_DINH, vnd, weatherText, type Place } from "@/lib/vxo/intel";
import { formatYmd, solarToLunar, upcomingEvents, vnToday } from "@/lib/vxo/lunar";
import { MODULE_LABEL, type ModuleId } from "@/components/vxo/types";

const VOV = [
  { name: "VOV1", detail: "Thời sự", url: "https://stream.vovmedia.vn/vov-1" },
  { name: "VOV2", detail: "Văn hóa", url: "https://stream.vovmedia.vn/vov-2" },
  { name: "VOV3", detail: "Âm nhạc", url: "https://stream.vovmedia.vn/vov-3" },
  { name: "VOV GT Hà Nội", detail: "Giao thông", url: "https://stream.vovmedia.vn/vovgt-hn" },
  { name: "VOV GT TP.HCM", detail: "Giao thông", url: "https://stream.vovmedia.vn/vovgt-hcm" },
  { name: "VOV5", detail: "Thế giới", url: "https://stream.vovmedia.vn/vov5" },
  { name: "FM89", detail: "Sức khỏe", url: "https://stream.vovmedia.vn/fm89" },
];

const TV = [
  { name: "Hà Nội 1", url: "https://liveh34.vtvprime.vn/hls/HANOI1TV/index.m3u8" },
  { name: "Cần Thơ", url: "https://live.canthotv.vn/live/tv/chunklist.m3u8" },
  { name: "Hà Tĩnh", url: "https://cohauw9bgpvod.vcdn.cloud/httv1/index.m3u8" },
  { name: "Cao Bằng", url: "https://stream.thingnet.vn/live/smil:CRTV.smil/chunklist.m3u8" },
  { name: "Đồng Tháp", url: "https://liveh34.vtvprime.vn/hls/DONGTHAPTV/index.m3u8" },
  { name: "Hưng Yên", url: "https://ott3.nethubtv.vn/live/hungyentv/playlist.m3u8" },
];

const PRESETS: { id: PresetId; label: string }[] = [
  { id: "speech", label: "Lời nói" },
  { id: "music", label: "Nhạc · LOA3" },
  { id: "tvpt", label: "Phóng thanh" },
  { id: "tvqc", label: "Quảng cáo" },
];

export function ToolSheet({
  id,
  place,
  onPlace,
  onClose,
  onStatus,
}: {
  id: Exclude<ModuleId, "ngame">;
  place: Place;
  onPlace: (place: Place) => void;
  onClose: () => void;
  onStatus: (status: string) => void;
}) {
  return (
    <section className="sheet frame" role="dialog" aria-label={MODULE_LABEL[id]}>
      <header className="sheet-head">
        <h2>{MODULE_LABEL[id].toUpperCase()}</h2>
        <button type="button" className="ghost" onClick={onClose}>
          ĐÓNG
        </button>
      </header>
      <div className="sheet-body">
        {id === "tv" && <TvTool onStatus={onStatus} />}
        {id === "radio" && <RadioTool onStatus={onStatus} />}
        {id === "rec" && <RecTool onStatus={onStatus} />}
        {id === "read" && <ReadTool />}
        {id === "map" && <MapTool place={place} onPlace={onPlace} />}
        {id === "morse" && <MorseTool />}
        {id === "wx" && <WxTool place={place} onPlace={onPlace} />}
        {id === "fx" && <FxTool />}
        {id === "lunar" && <LunarTool />}
        {id === "dsp" && <DspTool onStatus={onStatus} />}
      </div>
    </section>
  );
}

function TvTool({ onStatus }: { onStatus: (s: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => () => hlsRef.current?.destroy(), []);

  async function play(ch: (typeof TV)[number]) {
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
      const { default: Hls } = await import("hls.js");
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
        void video.play().catch(() => undefined);
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

  return (
    <>
      <video ref={videoRef} className="video" controls playsInline />
      <p className="meta">
        Kênh công cộng. Mất tín hiệu thì bỏ qua.
        {live && current ? <span className="live">TRỰC TIẾP</span> : null}
      </p>
      {err ? <p>{err}</p> : null}
      <div className="list">
        {TV.map((ch) => (
          <button key={ch.name} type="button" className={current === ch.name ? "choice on" : "choice"} onClick={() => void play(ch)}>
            {ch.name}
          </button>
        ))}
      </div>
    </>
  );
}

function RadioTool({ onStatus }: { onStatus: (s: string) => void }) {
  const [extra, setExtra] = useState<{ name: string; detail: string; url: string }[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    void fetch(
      "https://de1.api.radio-browser.info/json/stations/search?countrycode=VN&hidebroken=true&order=clickcount&reverse=true&limit=18",
      { signal: ctrl.signal },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { name?: string; url_resolved?: string; url?: string; state?: string }[]) => {
        const seen = new Set(VOV.map((s) => s.name.toLowerCase()));
        const more = rows
          .map((row) => ({
            name: (row.name || "Đài").slice(0, 42),
            detail: row.state || "Radio Browser",
            url: row.url_resolved || row.url || "",
          }))
          .filter((row) => row.url && !seen.has(row.name.toLowerCase()));
        setExtra(more.slice(0, 12));
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, []);

  async function play(station: { name: string; url: string }) {
    setErr(null);
    const audio = radioElement();
    audio.src = station.url;
    try {
      await audio.play();
      setCurrent(station.name);
      onStatus(`Đài · ${station.name} · đang phát`);
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: station.name, artist: "VXOAI" });
      }
      localStorage.setItem("vxoai.radio", station.name);
    } catch {
      setErr("Không phát được đài này. Thử đài khác.");
      onStatus(`Đài · ${station.name} · lỗi`);
    }
  }

  function stop() {
    const audio = radioElement();
    audio.pause();
    setCurrent(null);
    onStatus("Đài · đã dừng");
  }

  const stations = [...VOV, ...extra];
  return (
    <>
      <p className="meta">{current ? `Đang phát ${current}` : "Bấm một đài. VOV phát trực tiếp, đài khác lấy từ Radio Browser."}</p>
      {err ? <p>{err}</p> : null}
      <div className="row">
        <button type="button" className="ghost" onClick={stop}>
          DỪNG
        </button>
      </div>
      <div className="list">
        {stations.map((st) => (
          <button key={st.name + st.url} type="button" className={current === st.name ? "choice on" : "choice"} onClick={() => void play(st)}>
            {st.name}
            <small>{st.detail}</small>
          </button>
        ))}
      </div>
    </>
  );
}

function RecTool({ onStatus }: { onStatus: (s: string) => void }) {
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const [on, setOn] = useState(false);
  const [level, setLevel] = useState(0);
  const [clip, setClip] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => () => stopTracks(), []);

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
      rec.start(1000);
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

  return (
    <>
      <p className="meta">Chỉ ghi khi bạn bấm. File nằm trên máy, không tải lên.</p>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${level}%` }} />
      </div>
      {err ? <p>{err}</p> : null}
      <div className="row">
        {on ? (
          <button type="button" className="primary" onClick={stop}>
            DỪNG
          </button>
        ) : (
          <button type="button" className="primary" onClick={() => void start()}>
            GHI
          </button>
        )}
      </div>
      {clip ? <audio controls src={clip} /> : null}
    </>
  );
}

type Chapter = { title: string; text: string };

function ReadTool() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [idx, setIdx] = useState(0);
  const [msg, setMsg] = useState("Mở EPUB, TXT, hoặc một ảnh để nhận dạng chữ Việt.");

  async function onText(file: File) {
    const text = await file.text();
    setChapters([{ title: file.name, text: text.slice(0, 80_000) }]);
    setIdx(0);
    setMsg(file.name);
  }

  async function onEpub(file: File) {
    setMsg("Đang mở EPUB…");
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const container = await zip.file("META-INF/container.xml")?.async("string");
    if (!container) throw new Error("Không phải EPUB.");
    const cdoc = new DOMParser().parseFromString(container, "text/xml");
    const root = Array.from(cdoc.getElementsByTagName("*")).find((el) => el.localName === "rootfile");
    const full = root?.getAttribute("full-path");
    if (!full) throw new Error("EPUB thiếu mục lục.");
    const opfXml = await zip.file(full)?.async("string");
    if (!opfXml) throw new Error("Không đọc được gói sách.");
    const opf = new DOMParser().parseFromString(opfXml, "text/xml");
    const nodes = Array.from(opf.getElementsByTagName("*"));
    const title = nodes.find((el) => el.localName === "title")?.textContent?.trim() || file.name;
    const hrefs = new Map<string, string>();
    for (const el of nodes) {
      if (el.localName === "item" && el.getAttribute("id") && el.getAttribute("href")) {
        hrefs.set(el.getAttribute("id") as string, el.getAttribute("href") as string);
      }
    }
    const base = full.includes("/") ? full.slice(0, full.lastIndexOf("/") + 1) : "";
    const built: Chapter[] = [];
    for (const el of nodes) {
      if (el.localName !== "itemref" || built.length >= 30) continue;
      const href = hrefs.get(el.getAttribute("idref") || "");
      if (!href || !/\.(x?html|htm)$/i.test(href)) continue;
      const path = joinPath(base, href);
      const html = await zip.file(path)?.async("string");
      if (!html) continue;
      const text = htmlToText(html);
      if (text.length < 20) continue;
      built.push({ title: `${title} · ${built.length + 1}`, text: text.slice(0, 20_000) });
    }
    if (!built.length) throw new Error("Sách không có chương chữ.");
    setChapters(built);
    setIdx(0);
    setMsg(title);
  }

  async function onImage(file: File) {
    setMsg("Đang tải bộ nhận dạng chữ Việt…");
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("vie");
    try {
      const { data } = await worker.recognize(file);
      const text = data.text.trim();
      if (!text) {
        setMsg("Không thấy chữ trong ảnh.");
        return;
      }
      setChapters([{ title: file.name, text }]);
      setIdx(0);
      setMsg("Đã nhận dạng. Nguồn: Tesseract · vie");
    } finally {
      await worker.terminate();
    }
  }

  async function onFile(file: File | undefined) {
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
  return (
    <>
      <p className="meta">{msg}</p>
      <label className="primary filebtn">
        CHỌN TỆP
        <input
          type="file"
          accept=".epub,.txt,text/plain,application/epub+zip,image/*"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </label>
      {chapter ? (
        <>
          <div className="row">
            <button type="button" className="ghost" disabled={idx === 0} onClick={() => setIdx((n) => n - 1)}>
              TRƯỚC
            </button>
            <span className="meta">
              {idx + 1}/{chapters.length}
            </span>
            <button type="button" className="ghost" disabled={idx >= chapters.length - 1} onClick={() => setIdx((n) => n + 1)}>
              SAU
            </button>
          </div>
          <article className="chapter">{chapter.text}</article>
        </>
      ) : null}
    </>
  );
}

function htmlToText(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style").forEach((node) => node.remove());
  return (doc.body?.textContent || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function joinPath(base: string, href: string) {
  const parts = `${base}${href}`.split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "..") out.pop();
    else if (part && part !== ".") out.push(part);
  }
  return decodeURIComponent(out.join("/"));
}

function MapTool({ place, onPlace }: { place: Place; onPlace: (p: Place) => void }) {
  const [msg, setMsg] = useState("Bấm vị trí chỉ khi bạn muốn. Không theo dõi nền.");
  const d = 0.12;
  const bbox = [place.lon - d, place.lat - d, place.lon + d, place.lat + d].map((n) => n.toFixed(4)).join("%2C");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${place.lat}%2C${place.lon}`;

  function locate() {
    if (!navigator.geolocation) {
      setMsg("Máy không có định vị. Vẫn hiện Nam Định.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPlace({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Vị trí của bạn" });
        setMsg("Đã lấy vị trí một lần.");
      },
      () => setMsg("Chưa được cấp vị trí. Vẫn hiện Nam Định."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  return (
    <>
      <p className="meta">
        {place.label} · {place.lat.toFixed(3)}, {place.lon.toFixed(3)}
      </p>
      <iframe className="mapframe" title="Bản đồ OpenStreetMap" src={src} />
      <p className="meta">© OpenStreetMap</p>
      <p className="meta">{msg}</p>
      <button type="button" className="primary" onClick={locate}>
        VỊ TRÍ CỦA TÔI
      </button>
    </>
  );
}

function MorseTool() {
  const [text, setText] = useState("VXOAI");
  const [wpm, setWpm] = useState(16);
  const [msg, setMsg] = useState("Gõ tin, rồi phát. Nhịp bám đồng hồ âm thanh.");

  return (
    <>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={180} />
      <label className="meta">
        Tốc độ {wpm} WPM
        <input type="range" min={8} max={28} value={wpm} onChange={(e) => setWpm(Number(e.target.value))} />
      </label>
      <button
        type="button"
        className="primary"
        onClick={() => {
          const seconds = scheduleMorse(text, wpm);
          setMsg(seconds > 0 ? `Đang phát khoảng ${Math.ceil(seconds)} giây.` : "Không có ký tự Morse.");
        }}
      >
        PHÁT
      </button>
      <p className="meta">{msg}</p>
    </>
  );
}

function WxTool({ place, onPlace }: { place: Place; onPlace: (p: Place) => void }) {
  const [body, setBody] = useState("Đang lấy số liệu Open-Meteo…");
  const [err, setErr] = useState<string | null>(null);

  async function load(target: Place) {
    setErr(null);
    try {
      const wx = await fetchWeather(target.lat, target.lon);
      setBody(
        `${target.label}\n${wx.temp.toFixed(1)}°C · ${weatherText(wx.code)}\nGió ${Math.round(wx.wind)} km/h` +
          (wx.humidity != null ? ` · ẩm ${wx.humidity}%` : "") +
          `\nLúc ${wx.at}`,
      );
    } catch {
      setErr("Không lấy được thời tiết. Thử lại.");
    }
  }

  useEffect(() => {
    void load(place);
    // only when coordinates change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.lat, place.lon]);

  return (
    <>
      <p className="chapter">{body}</p>
      {err ? <p>{err}</p> : null}
      <p className="meta">Nguồn: Open-Meteo. Không phải cảnh báo thiên tai chính thức.</p>
      <div className="row">
        <button type="button" className="ghost" onClick={() => void load(place)}>
          LÀM MỚI
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            onPlace(NAM_DINH);
          }}
        >
          NAM ĐỊNH
        </button>
        <button
          type="button"
          className="primary"
          onClick={() => {
            navigator.geolocation?.getCurrentPosition(
              (pos) => onPlace({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Vị trí của bạn" }),
              () => setErr("Chưa được cấp vị trí."),
              { enableHighAccuracy: false, timeout: 8000 },
            );
          }}
        >
          VỊ TRÍ
        </button>
      </div>
    </>
  );
}

function FxTool() {
  const [rows, setRows] = useState<{ label: string; vnd: number }[]>([]);
  const [at, setAt] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetchRates()
      .then((fx) => {
        setRows(fx.rows);
        setAt(fx.at);
      })
      .catch(() => setErr("Không lấy được tỉ giá Frankfurter."));
  }, []);

  return (
    <>
      {err ? <p>{err}</p> : null}
      <div className="list">
        {rows.map((row) => (
          <div key={row.label} className="choice">
            {row.label}
            <small>{vnd(row.vnd)} VND</small>
          </div>
        ))}
      </div>
      <p className="meta">Nguồn: Frankfurter{at ? ` · ${at}` : ""}. Tỉ giá tham khảo, không phải giá ngân hàng.</p>
    </>
  );
}

function LunarTool() {
  const [now, setNow] = useState<ReturnType<typeof vnToday> | null>(null);
  useEffect(() => {
    const tick = () => setNow(vnToday());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  const dayKey = now ? `${now.y}-${now.m}-${now.d}` : "";
  const events = useMemo(() => {
    if (!dayKey) return [];
    const [y, m, d] = dayKey.split("-").map(Number);
    return upcomingEvents({ y, m, d }).slice(0, 6);
  }, [dayKey]);
  if (!now) return <p className="meta">Đang lấy lịch…</p>;
  const lunar = solarToLunar(now.d, now.m, now.y);
  return (
    <>
      <p>
        {now.weekday}, {formatYmd(now)} · {now.hh}:{now.mm}:{now.ss}
      </p>
      <p>
        Âm {lunar.d} tháng {lunar.m}
        {lunar.leap ? " nhuận" : ""} · {lunar.yearName} · ngày {lunar.dayName}
      </p>
      <div className="list">
        {events.map((event) => (
          <div key={event.name} className="choice">
            {event.name}
            <small>
              {event.days === 0 ? "Hôm nay" : `Còn ${event.days} ngày`} · {formatYmd(event.when)}
            </small>
          </div>
        ))}
      </div>
    </>
  );
}

function DspTool({ onStatus }: { onStatus: (s: string) => void }) {
  const [preset, setPreset] = useState<PresetId>("music");
  const [name, setName] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  function choose(id: PresetId) {
    setPreset(id);
    applyPreset(id);
    onStatus(id === "music" ? "Nhạc · LOA3" : `Master · ${id}`);
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const audio = musicElement();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    audio.src = url;
    armMusicGraph();
    applyPreset(preset);
    void audio.play();
    setName(file.name);
    onStatus(`Nhạc · ${file.name} · LOA3`);
  }

  return (
    <>
      <p className="meta">EQ và nén áp cho file trên máy. LOA3 là độ bù sau nén, không phải đo cự ly loa.</p>
      <div className="presets">
        {PRESETS.map((item) => (
          <button key={item.id} type="button" className={preset === item.id ? "chip choice on" : "chip"} onClick={() => choose(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <label className="primary filebtn">
        CHỌN NHẠC
        <input type="file" accept="audio/*" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      <p className="meta">{name ?? "Chưa chọn file."}</p>
      <div className="row">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            armMusicGraph();
            void musicElement().play();
          }}
        >
          PHÁT
        </button>
        <button type="button" className="ghost" onClick={() => musicElement().pause()}>
          TẠM DỪNG
        </button>
        <button type="button" className="ghost" onClick={() => chime()}>
          THỬ TIẾNG
        </button>
      </div>
    </>
  );
}
