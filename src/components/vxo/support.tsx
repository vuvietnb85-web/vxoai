import { useEffect, useState } from "react";

const SCRIPT_ID = "vxoai-paypal-sdk";
const SCRIPT_SRC =
  "https://www.paypal.com/sdk/js?client-id=BAAIfuQli_a3Qud-8CIRqCRCeohqtiW29_i2Txx2rQM35pqMc-pbCIZX6L8tx1zbyOj_vp8AUE_dpSqOhc&components=hosted-buttons&disable-funding=venmo&currency=USD";

declare global {
  interface Window {
    paypal?: {
      HostedButtons: (opts: { hostedButtonId: string }) => { render: (selector: string) => Promise<void> };
    };
  }
}

export function Support({ onClose }: { onClose: () => void }) {
  const [note, setNote] = useState("Đang mở nút PayPal…");

  useEffect(() => {
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
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (window.paypal) {
      void render();
    } else if (existing) {
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

  return (
    <div className="overlay" role="dialog" aria-label="Ủng hộ">
      <section className="support frame">
        <h2>ỦNG HỘ VXOAI</h2>
        <p>Tự nguyện. Không khóa tính năng nào.</p>
        {note ? <p>{note}</p> : null}
        <div id="paypal-container-T7AZ748Y27248" />
        <a className="momo" href="https://me.momo.vn/vuquocviet" target="_blank" rel="noreferrer">
          MOMO · 0988 960 419
        </a>
        <div className="row">
          <button type="button" className="ghost" onClick={onClose}>
            ĐÓNG
          </button>
        </div>
      </section>
    </div>
  );
}
