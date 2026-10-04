// QA-TEMP screenshot helper (deleted after QA)
import { chromium } from "playwright";
const OUT = "/tmp/claude-1000/-home-maro-matjar/c1468ea7-f719-49d2-ab95-a964261341d8/scratchpad/shots";
const [,, base, list, vpArg = "390x844", opts = ""] = process.argv;
const [w, h] = vpArg.split("x").map(Number);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: opts.includes("dark") ? "dark" : "light", reducedMotion: "reduce", hasTouch: w < 1024, isMobile: w < 1024 });
if (opts.includes("dark")) await ctx.addInitScript(() => localStorage.setItem("theme", "dark"));
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|facebook/.test(m.text())) errors.push("console: " + m.text().slice(0, 240)); });
for (const item of list.split(",")) {
  const i0 = item.indexOf("="); const name = item.slice(0, i0), path = item.slice(i0 + 1);
  errors.length = 0;
  const res = await page.goto(base + path, { waitUntil: "networkidle", timeout: 120000 }).catch((e) => ({ status: () => "ERR " + e.message.slice(0, 80) }));
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(1200);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  const tag = `${name}-${w}${opts.includes("dark") ? "-dark" : ""}`;
  if (opts.includes("seg")) {
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = w < 1024 ? 1700 : 1800;
    for (let y = 0, i = 0; y < H && i < 8; y += step, i++)
      await page.screenshot({ path: `${OUT}/${tag}-${i}.png`, fullPage: true, clip: { x: 0, y, width: w, height: Math.min(step, H - y) } });
  } else {
    await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: !opts.includes("fold") });
  }
  console.log(`${name} ${w}: status=${res?.status?.()} scrollWidth=${sw}`);
  for (const e of [...new Set(errors)].slice(0, 4)) console.log("  ", e);
}
await browser.close();
