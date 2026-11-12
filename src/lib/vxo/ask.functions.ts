import { createServerFn } from "@tanstack/react-start";

const hits: number[] = [];

export const askGrok = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const prompt = String((input as { prompt?: unknown } | null)?.prompt ?? "").trim();
    if (!prompt) throw new Error("Hãy nhập nhu cầu");
    return { prompt: prompt.slice(0, 800) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "no-key" as const };

    const now = Date.now();
    while (hits.length && now - hits[0] > 3_600_000) hits.shift();
    if (hits.length >= 20) return { ok: false as const, error: "rate" as const };
    hits.push(now);

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 350,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content:
                "Bạn là VXOAI, trợ lý cá nhân tiếng Việt. Trả lời ngắn, rõ, tối đa 120 từ, không markdown, không tiêu đề. Không chẩn đoán y khoa, không kê đơn. Không bịa số liệu thời tiết, tỉ giá hay tin tức. Nếu cần số, bảo người dùng mở Thời tiết hoặc Tỉ giá trong ứng dụng. Người dùng ở Việt Nam.",
            },
            { role: "user", content: data.prompt },
          ],
        }),
      });
      if (!res.ok) return { ok: false as const, error: `http-${res.status}` as const };
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = body.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) return { ok: false as const, error: "empty" as const };
      return { ok: true as const, text };
    } catch {
      return { ok: false as const, error: "network" as const };
    }
  });
