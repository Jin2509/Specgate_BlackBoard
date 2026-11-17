// Captures the screens of the running app and exports them, with their captions, as docs/prototype.pdf.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUTPUT_PATH = resolve(process.env.OUT ?? resolve(SCRIPT_DIRECTORY, "../../../docs/prototype.pdf"));
const CONTENT_PATH = resolve(SCRIPT_DIRECTORY, process.env.PROTOTYPE_CONTENT ?? "prototype-content.vi.json");
const VIEWPORT = { width: 1440, height: 900 };
const PAGE_SIZE = { width: 1600, height: 1130 };
const SETTLE_DELAY_MS = 450;
const SCREENSHOT_QUALITY = 90;
const COVER_QUALITY = 85;
const SESSION_COOKIE = "sg_session";
/** Demo accounts seeded by the backend (python -m app.ws.seed), keyed by profile id. */
const DEMO_LOGINS = {
  lan: { provider: "github", login: "lan-pham" },
  long: { provider: "github", login: "long-tran" },
  trang: { provider: "google", login: "trang@example.edu" },
};

const content = JSON.parse(readFileSync(CONTENT_PATH, "utf8"));
const styles = readFileSync(resolve(SCRIPT_DIRECTORY, "prototype.css"), "utf8");

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function signInAs(context, profileId) {
  // Sign in through the backend (via the Next /api rewrite) and set the returned token as the session cookie.
  const response = await fetch(`${BASE_URL}/api/v1/auth/dev-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(DEMO_LOGINS[profileId]),
  });
  if (!response.ok) throw new Error(`dev-sessions for ${profileId} returned ${response.status}; is the seeded backend running?`);
  const { token } = await response.json();
  await context.addCookies([{ name: SESSION_COOKIE, value: token, url: BASE_URL }]);
}

async function captureScreen(context, page, screen) {
  await context.clearCookies();
  if (screen.as) await signInAs(context, screen.as);
  const response = await page.goto(BASE_URL + screen.path, { waitUntil: "networkidle" });
  if (!response || !response.ok()) throw new Error(`${screen.path} returned ${response?.status()}`);
  await page.evaluate(() => document.fonts.ready);
  const isStyled = await page.evaluate(
    () => getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() !== "",
  );
  if (!isStyled) throw new Error(`${screen.path}: the app CSS did not load; restart the server after building.`);
  await page.waitForTimeout(SETTLE_DELAY_MS);
  const image = await page.screenshot({ type: "jpeg", quality: SCREENSHOT_QUALITY });
  if (process.env.SHOTS_DIR) {
    mkdirSync(process.env.SHOTS_DIR, { recursive: true });
    writeFileSync(resolve(process.env.SHOTS_DIR, `${screen.no}.jpg`), image);
  }
  return `data:image/jpeg;base64,${image.toString("base64")}`;
}

async function readAppFonts(page) {
  return page.evaluate(() => {
    const faces = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        // Cross-origin stylesheets cannot be read; their fonts are simply not embedded.
        continue;
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSFontFaceRule) {
          faces.push(
            rule.cssText.replace(
              /url\("?([^")]+)"?\)/g,
              (_match, url) => `url("${new URL(url, sheet.href ?? location.href).href}")`,
            ),
          );
        }
      }
    }
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      fontFaces: faces.join("\n"),
      uiFamily: rootStyle.getPropertyValue("--font-ui").trim(),
      codeFamily: rootStyle.getPropertyValue("--font-code").trim(),
    };
  });
}

function toCoverHtml() {
  const { cover } = content;
  const screenIndex = content.screens
    .map(
      (screen) =>
        `<li><span class="no">${screen.no}</span><span>${escapeHtml(screen.title)}</span><span class="tag">${escapeHtml(screen.sprint)}</span></li>`,
    )
    .join("");
  const swatches = content.swatches
    .map(
      (swatch) =>
        `<li><span class="sw" style="background:${swatch.color}"></span><span>${escapeHtml(swatch.name)}</span><span class="muted">${escapeHtml(swatch.description)}</span></li>`,
    )
    .join("");
  const changes = content.changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("");
  return `
<section class="page cover">
  <div class="brand"><svg class="mark" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4 8.5c7.5-1.6 16.5-1.6 24 0"/><path d="M9 9v17"/><path d="M23 9v17"/><path d="M9 15.5h14"/></svg>SpecGate Workspace <span class="muted">${escapeHtml(cover.version)}, ${escapeHtml(content.date)}</span></div>
  <h1>${escapeHtml(cover.title)}</h1>
  <p class="lead">${escapeHtml(cover.lead)}</p>
  <div class="cols">
    <div>
      <h2>${escapeHtml(cover.screensHeading)}</h2>
      <ol class="index">${screenIndex}</ol>
      <h2>${escapeHtml(cover.flowHeading)}</h2>
      <p class="flow">${cover.flowHtml}</p>
    </div>
    <div>
      <h2>${escapeHtml(cover.colorsHeading)}</h2>
      <ul class="swatches">${swatches}</ul>
      <h2>${escapeHtml(cover.changesHeading)}</h2>
      <ul class="changes">${changes}</ul>
      <h2>${escapeHtml(cover.techHeading)}</h2>
      <p class="muted small">${cover.techHtml}</p>
    </div>
  </div>
</section>`;
}

function toScreenHtml(screen, imageSource) {
  const chips = screen.spec.map((chip) => `<span>${escapeHtml(chip)}</span>`).join("");
  const notes = screen.notes.map(([lead, text]) => `<p><b>${escapeHtml(lead)}</b> ${escapeHtml(text)}</p>`).join("");
  return `
<section class="page screen">
  <header>
    <span class="big">${screen.no}</span>
    <div class="titles"><h1>${escapeHtml(screen.title)}</h1><p>${escapeHtml(screen.subtitle)}</p></div>
    <div class="chips">${chips}<span class="sprint">${escapeHtml(content.sprintLabel)} · ${escapeHtml(screen.sprint)}</span></div>
  </header>
  <figure><img src="${imageSource}" alt=""/><figcaption>${escapeHtml(screen.path)}</figcaption></figure>
  <footer>${notes}</footer>
</section>`;
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, locale: content.browserLocale });
const page = await context.newPage();

const imageSources = [];
for (const screen of content.screens) {
  process.stdout.write(`  ${screen.no} ${screen.path} … `);
  imageSources.push(await captureScreen(context, page, screen));
  console.log("ok");
}

await context.clearCookies();
await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
const { fontFaces, uiFamily, codeFamily } = await readAppFonts(page);

const screenPages = content.screens.map((screen, index) => toScreenHtml(screen, imageSources[index])).join("");
const html = `<!doctype html><html lang="${content.lang}"><head><meta charset="utf-8"/>
<style>
${fontFaces}
:root { --ui-family: ${uiFamily}; --code-family: ${codeFamily}; }
${styles}
</style></head><body>${toCoverHtml()}${screenPages}</body></html>`;

await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
if (process.env.SHOTS_DIR) {
  await page.setViewportSize(PAGE_SIZE);
  await page.screenshot({ path: resolve(process.env.SHOTS_DIR, "00-cover.jpg"), type: "jpeg", quality: COVER_QUALITY });
}
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
await page.pdf({ path: OUTPUT_PATH, width: `${PAGE_SIZE.width}px`, height: `${PAGE_SIZE.height}px`, printBackground: true });
await browser.close();
console.log(`\nWrote ${OUTPUT_PATH}`);
