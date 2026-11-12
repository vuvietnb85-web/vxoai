import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { clickTick } from "@/lib/vxo/audio";

const KEYS = ["A", "B", "X", "Y"] as const;
type KeyId = (typeof KEYS)[number];

const BEST = "vxoai.ngame.best";

export function Ngame({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "done">("idle");
  const [seq, setSeq] = useState<KeyId[]>([]);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [flash, setFlash] = useState<KeyId | null>(null);
  const [tempo, setTempo] = useState(0);
  const knob = useRef<HTMLDivElement>(null);
  const run = useRef(0);

  useEffect(() => {
    const n = Number(localStorage.getItem(BEST) || "0");
    if (Number.isFinite(n)) setBest(n);
  }, []);

  function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function playRound(length: number, token: number) {
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
    void playRound(1, token);
  }

  function press(key: KeyId) {
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
      void playRound(seq.length + 1, token);
      return;
    }
    setStep(step + 1);
  }

  function onPad(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    const clamped = Math.max(-1, Math.min(1, dy));
    setTempo(Math.max(0, Math.min(1, -clamped)));
    if (knob.current) knob.current.style.top = `${50 + clamped * 32}%`;
  }

  return (
    <div className="overlay" role="dialog" aria-label="NGAME đèn hiệu">
      <div className="ngame">
        <div className="hemi">
          <div className="pad" onPointerDown={onPad} onPointerMove={(e) => e.buttons === 1 && onPad(e)}>
            <div className="knob" ref={knob} />
          </div>
          <span className="kicker">NHỊP</span>
        </div>
        <div className="ngame-mid">
          <p className="kicker">NGAME</p>
          <h2>ĐÈN HIỆU</h2>
          <div className="score">{score}</div>
          <p className="meta">
            {phase === "idle" && "Nhắc lại chuỗi đèn. Kỷ lục trên máy này."}
            {phase === "show" && "Nhìn chuỗi, rồi bấm đúng thứ tự."}
            {phase === "input" && `Lượt ${step + 1} / ${seq.length}`}
            {phase === "done" && "Sai đèn. Bắt đầu lại khi sẵn sàng."}
          </p>
          <p className="meta">Kỷ lục {best}</p>
          <div className="row">
            <button type="button" className="primary" onClick={start}>
              {phase === "idle" || phase === "done" ? "BẮT ĐẦU" : "LÀM LẠI"}
            </button>
            <button type="button" className="ghost" onClick={onClose}>
              ĐÓNG
            </button>
          </div>
        </div>
        <div className="hemi">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={flash === key ? "abxy lit" : "abxy"}
              onClick={() => press(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
