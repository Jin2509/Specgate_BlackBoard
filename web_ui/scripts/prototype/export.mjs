// Chụp các màn hình từ app đang chạy và xuất thành docs/prototype.pdf.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SCREENS } from "./screens.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = resolve(process.env.OUT ?? resolve(here, "../../../docs/prototype.pdf"));
const VIEWPORT = { width: 1440, height: 900 };
const DATE = "12/11/2026";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, locale: "vi-VN" });
const page = await ctx.newPage();

const shots = [];
for (const s of SCREENS) {
  process.stdout.write(`  ${s.no} ${s.path} … `);
  await ctx.clearCookies();
  if (s.as) {
    await ctx.addCookies(["sg_uid", "sg_onboarded"].map((name) => ({ name, value: s.as, url: BASE_URL })));
  }
  const res = await page.goto(BASE_URL + s.path, { waitUntil: "networkidle" });
  if (!res || !res.ok()) throw new Error(`${s.path} trả về ${res?.status()}`);
  await page.evaluate(() => document.fonts.ready);
  const styled = await page.evaluate(
    () => getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() !== "",
  );
  if (!styled) throw new Error(`${s.path}: CSS của app chưa tải. Khởi động lại server sau khi build.`);
  await page.waitForTimeout(450);
  const buf = await page.screenshot({ type: "jpeg", quality: 90 });
  if (process.env.SHOTS_DIR) {
    mkdirSync(process.env.SHOTS_DIR, { recursive: true });
    writeFileSync(resolve(process.env.SHOTS_DIR, `${s.no}.jpg`), buf);
  }
  shots.push(`data:image/jpeg;base64,${buf.toString("base64")}`);
  console.log("ok");
}

await ctx.clearCookies();
await page.goto(BASE_URL + "/login", { waitUntil: "networkidle" });
const { fontFaces, uiFamily, codeFamily } = await page.evaluate(() => {
  const faces = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const r of Array.from(rules)) {
      if (r instanceof CSSFontFaceRule) {
        faces.push(r.cssText.replace(/url\("?([^")]+)"?\)/g, (_, u) => `url("${new URL(u, sheet.href ?? location.href).href}")`));
      }
    }
  }
  const css = getComputedStyle(document.documentElement);
  return {
    fontFaces: faces.join("\n"),
    uiFamily: css.getPropertyValue("--font-ui").trim(),
    codeFamily: css.getPropertyValue("--font-code").trim(),
  };
});

const swatches = [
  ["Nền", "#313338", "ba tầng xám: thanh workspace, cột kênh, vùng nội dung"],
  ["Tím xanh", "#5865f2", "màu nhấn duy nhất: hành động chính, agent LLM"],
  ["Vàng", "#f0b232", "ý mới đề xuất (chỉ ở chấm và nhãn)"],
  ["Xanh trời", "#00a8fc", "đang bàn"],
  ["Xanh lục", "#23a55a", "đã chốt · PASS"],
  ["Đỏ", "#f23f43", "đã loại · cảnh báo · invalidated"],
  ["Cam", "#f0883e", "dữ kiện của bài báo ADOM"],
  ["Tím", "#a48bf5", "thiếu dữ liệu, không phải đạt"],
];

const changes = [
  "Chủ đề sáng: nền trắng, khối xanh dương ở thanh workspace và nút chính; màu trạng thái giữ nguyên nghĩa của bản v1.",
  "Font Be Vietnam Pro (web font, đủ dấu tiếng Việt) thay Optima/Avenir vốn chỉ có trên macOS.",
  "Mỗi trang là ảnh chụp từ route thật trong web_ui/, không còn vẽ tay: prototype và mã không thể lệch nhau.",
  "/pin ghim tin nhắn đang trả lời, /idea ghi ý do người gõ (v1 dùng /pin như /idea).",
  'Bỏ lựa chọn "chỉ người được mời" vì liên kết mời nằm ở danh sách chờ; thay bằng "Ẩn".',
  "Màn 10 đến 15 nhất quán xem dưới tài khoản chủ workspace (Lan); v1 hiện avatar Trang ở màn chỉ chủ mới thấy.",
  "Bảng tác vụ có lọc, sắp xếp, cột a3_state (PDF 6.2); thẻ agent có cảnh báo trần chi phí.",
];

const cover = `
<section class="page cover">
  <div class="brand"><span class="mark"></span>SpecGate Workspace <span class="muted">· Prototype giao diện v2 · ${DATE}</span></div>
  <h1>Bảng đen chung cho người và LLM</h1>
  <p class="lead">Mười lăm màn hình cho toàn bộ luồng sử dụng: lên ý tưởng trong workspace riêng và chung, gọi nhiều LLM trong một kênh,
  xin tham gia, và xem đầu ra của bài báo ADOM. Số liệu ở màn hình 12 đến 15 là số thật của lượt chạy MAIN.</p>
  <div class="cols">
    <div>
      <h2>Màn hình và ý của spec</h2>
      <ol class="index">
        ${SCREENS.map((s) => `<li><span class="no">${s.no}</span><span>${esc(s.title)}</span><span class="tag">${esc(s.sprint)}</span></li>`).join("")}
      </ol>
      <h2>Luồng chính (PDF đề xuất 5.1)</h2>
      <p class="flow">Đặt đề bài <b>03</b> → Phát ý <b>02 · 04 · 05</b> → Phản biện <b>04</b> → Tổng hợp <b>06</b> → Chốt <b>07</b> → Xuất <b>08</b>
      <br/>Riêng sang chung: <b>02 → 09 → 10</b> · Mô-đun ADOM: <b>12 → 13 · 14 → 15</b></p>
    </div>
    <div>
      <h2>Ngôn ngữ màu</h2>
      <ul class="swatches">
        ${swatches.map(([n, c, d]) => `<li><span class="sw" style="background:${c}"></span><span>${n}</span><span class="muted">${d}</span></li>`).join("")}
      </ul>
      <h2>Thay đổi so với bản v1 (chủ đề tối)</h2>
      <ul class="changes">${changes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      <h2>Kỹ thuật</h2>
      <p class="muted small">Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · shadcn/ui (Radix) · icon Lucide.
      Màu khai báo bằng token CSS ở <code>web_ui/src/app/globals.css</code>; mã hex bị cấm trong <code>.tsx</code>.
      Xuất lại tệp này: <code>pnpm prototype:pdf</code>.</p>
    </div>
  </div>
</section>`;

const pages = SCREENS.map(
  (s, i) => `
<section class="page screen">
  <header>
    <span class="big">${s.no}</span>
    <div class="titles"><h1>${esc(s.title)}</h1><p>${esc(s.subtitle)}</p></div>
    <div class="chips">${s.spec.map((c) => `<span>${esc(c)}</span>`).join("")}<span class="sprint">Sprint · ${esc(s.sprint)}</span></div>
  </header>
  <figure><img src="${shots[i]}" alt=""/><figcaption>${esc(s.path)}</figcaption></figure>
  <footer>${s.notes.map(([b, t]) => `<p><b>${esc(b)}</b> ${esc(t)}</p>`).join("")}</footer>
</section>`,
).join("");

const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"/>
<style>
${fontFaces}
@page { size: 1600px 1130px; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font-family: ${uiFamily}, system-ui, sans-serif; color: #0f1b33; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
code { font-family: ${codeFamily}, monospace; font-size: .92em; background: #eaf1fe; color: #1d4ed8; padding: 1px 5px; border-radius: 4px; }
.page { width: 1600px; height: 1130px; padding: 32px 80px; page-break-after: always; overflow: hidden; background: #f4f7fc; }
.muted { color: #5a6a85; }
.small { font-size: 13px; line-height: 1.6; }
.cover { background: #ffffff; position: relative; padding: 40px 72px; }
.cover::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 10px; background: #5865f2; }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 16px; margin-top: 14px; }
.mark { width: 28px; height: 28px; border-radius: 8px; background: #5865f2; display: inline-block; }
.cover h1 { font-size: 64px; letter-spacing: -0.02em; margin: 40px 0 16px; font-weight: 600; color: #1d4ed8; }
.lead { font-size: 19px; line-height: 1.6; max-width: 1080px; color: #23324d; margin: 0 0 30px; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }
.cover h2 { font-size: 17px; margin: 22px 0 10px; color: #1d4ed8; font-weight: 600; }
.index { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; column-gap: 28px; }
.index li { display: flex; gap: 10px; align-items: baseline; border-bottom: 1px solid #e1e7f1; padding: 8px 0; font-size: 14px; }
.index .no { color: #5865f2; font-weight: 600; width: 22px; }
.index .tag { margin-left: auto; font-size: 11px; color: #8796ad; }
.flow { font-size: 14px; line-height: 1.9; color: #23324d; margin: 0; }
.flow b { color: #5865f2; }
.swatches { list-style: none; padding: 0; margin: 0; }
.swatches li { display: grid; grid-template-columns: 42px 130px 1fr; align-items: center; gap: 10px; padding: 5px 0; font-size: 14px; }
.sw { width: 36px; height: 14px; border-radius: 7px; }
.changes { margin: 0; padding-left: 18px; font-size: 13.5px; line-height: 1.6; color: #23324d; }
.changes li { margin: 3px 0; }
.screen header { display: flex; align-items: flex-end; gap: 18px; height: 70px; }
.big { font-size: 46px; font-weight: 300; color: #5865f2; line-height: 1; }
.titles h1 { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.01em; }
.titles p { margin: 4px 0 0; font-size: 14px; color: #5a6a85; }
.chips { margin-left: auto; display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; max-width: 560px; }
.chips span { font-size: 12px; border: 1px solid #c9d7f6; color: #1d4ed8; background: #ffffff; border-radius: 999px; padding: 3px 10px; white-space: nowrap; }
.chips .sprint { background: #5865f2; color: #ffffff; border-color: #5865f2; }
figure { margin: 16px 0 0; position: relative; }
figure img { display: block; width: 1440px; height: 900px; border-radius: 14px; border: 1px solid #d3dcea; box-shadow: 0 18px 40px -16px rgb(15 35 80 / .28); }
figcaption { position: absolute; right: 12px; bottom: 10px; font-size: 11px; color: #8796ad; background: #ffffffd9; padding: 2px 8px; border-radius: 6px; font-family: ${codeFamily}, monospace; }
.screen footer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 16px; }
.screen footer p { margin: 0; font-size: 13px; line-height: 1.55; color: #3d4c66; border-left: 3px solid #5865f2; padding-left: 12px; }
.screen footer b { color: #0f1b33; }
</style></head><body>${cover}${pages}</body></html>`;

await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
if (process.env.SHOTS_DIR) {
  await page.setViewportSize({ width: 1600, height: 1130 });
  await page.screenshot({ path: resolve(process.env.SHOTS_DIR, "00-cover.jpg"), type: "jpeg", quality: 85 });
}
mkdirSync(dirname(OUT), { recursive: true });
await page.pdf({ path: OUT, width: "1600px", height: "1130px", printBackground: true });
await browser.close();
console.log(`\nĐã ghi ${OUT}`);
