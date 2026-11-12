import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ask.functions-DsDT5mI2.js
var hits = [];
var askGrok_createServerFn_handler = createServerRpc({
	id: "b0b74e6b9d0aa7062eafb358512a54c6363db73c7889d5822b9a123fa4271489",
	name: "askGrok",
	filename: "src/lib/vxo/ask.functions.ts"
}, (opts) => askGrok.__executeServer(opts));
var askGrok = createServerFn({ method: "POST" }).validator((input) => {
	const prompt = String(input?.prompt ?? "").trim();
	if (!prompt) throw new Error("Hãy nhập nhu cầu");
	return { prompt: prompt.slice(0, 800) };
}).handler(askGrok_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "no-key"
	};
	const now = Date.now();
	while (hits.length && now - hits[0] > 36e5) hits.shift();
	if (hits.length >= 20) return {
		ok: false,
		error: "rate"
	};
	hits.push(now);
	try {
		const res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: "grok-4.5",
				max_tokens: 350,
				temperature: .4,
				messages: [{
					role: "system",
					content: "Bạn là VXOAI, trợ lý cá nhân tiếng Việt. Trả lời ngắn, rõ, tối đa 120 từ, không markdown, không tiêu đề. Không chẩn đoán y khoa, không kê đơn. Không bịa số liệu thời tiết, tỉ giá hay tin tức. Nếu cần số, bảo người dùng mở Thời tiết hoặc Tỉ giá trong ứng dụng. Người dùng ở Việt Nam."
				}, {
					role: "user",
					content: data.prompt
				}]
			})
		});
		if (!res.ok) return {
			ok: false,
			error: `http-${res.status}`
		};
		const text = (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
		if (!text) return {
			ok: false,
			error: "empty"
		};
		return {
			ok: true,
			text
		};
	} catch {
		return {
			ok: false,
			error: "network"
		};
	}
});
//#endregion
export { askGrok_createServerFn_handler };
