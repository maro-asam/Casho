// QA-TEMP interaction screenshots (deleted after QA)
import { chromium } from "playwright";
const OUT = "/tmp/claude-1000/-home-maro-matjar/c1468ea7-f719-49d2-ab95-a964261341d8/scratchpad/shots";
const B = "http://localhost:3000/store/shosho";
const b = await chromium.launch();
const errs = [];
async function page(w, h, touch) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce", hasTouch: touch, isMobile: touch })).newPage();
  p.on("pageerror", (e) => errs.push(`${w} ${e.message}`));
  p.setDefaultTimeout(90000);
  return p;
}
const shot = async (p, n) => { await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/i-${n}.png` }); };
// Desktop
let p = await page(1440, 900, false);
await p.goto(B + "/products", { waitUntil: "networkidle" });
const card = p.locator("article.md-card").first();
await card.getByRole("button", { name: /حفظ/ }).click();
await p.getByRole("button", { name: /^المفضلة/ }).click();
await p.waitForTimeout(4500);
await shot(p, "wishlist-1440");
// Mobile
p = await page(390, 844, true);
await p.goto(B, { waitUntil: "networkidle" });
await p.getByRole("button", { name: "فتح القائمة" }).click();
await shot(p, "drawer-390");
await p.keyboard.press("Escape");
await p.goto(B + "/products", { waitUntil: "networkidle" });
await shot(p, "list-390");
await p.getByRole("button", { name: /^فلترة/ }).click();
await shot(p, "filters-390");
await p.keyboard.press("Escape");
await p.getByRole("button", { name: /الأحدث/ }).click();
await shot(p, "sort-390");
await p.keyboard.press("Escape");
await p.goto(B + "/products/bmtkhm-jhmr-kajhak-861cc0-1", { waitUntil: "networkidle" });
await shot(p, "pdp-390");
await p.mouse.wheel(0, 1200);
await p.evaluate(() => window.scrollTo(0, 1300));
await shot(p, "pdp-sticky-390");
await p.getByRole("button", { name: /بحث/ }).first().click().catch(() => {});
console.log(errs.length ? errs.join("\n") : "no page errors");
await b.close();
