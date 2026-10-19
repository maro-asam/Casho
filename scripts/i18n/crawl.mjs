// DEV ONLY — visits every merchant-dashboard page and reports text that is
// still Arabic, Arabic-Indic digits, page direction and console errors.
//   node scripts/i18n/crawl.mjs <sessionToken> <out.json> [screenshotDir] [baseUrl]
import { chromium } from "playwright";
import fs from "node:fs";

const [token, outFile, shotDir, base = "http://app.localhost:3000"] = process.argv.slice(2);
const ids = JSON.parse(process.env.CRAWL_IDS ?? "{}");
const routes = [
  "/", "/abandoned-carts", "/api-keys", "/balance", "/balance/history", "/banners", "/blog", "/categories", "/categories/new",
  "/change-plan", "/coupons", "/crm", "/crm/analytics", "/crm/customers", "/crm/segments", "/crm/tags", "/customization",
  "/customization?tab=popups", "/customization?tab=whatsapp", "/customization?tab=social-proof", "/domain", "/fraud",
  "/integrations/instagram", "/integrations/shopify", "/inventory", "/inventory/movements", "/inventory/purchase-orders",
  "/inventory/suppliers", "/inventory/transfers", "/inventory/adjustments", "/loyalty", "/offers", "/orders", "/payment-methods",
  "/pixels", "/products", "/products/new", "/products/import", "/qr-code", "/referral", "/reports", "/reviews", "/seo",
  "/services", "/settings", "/shipping", "/shipping/integrations", "/shipping/shipments", "/suggested-orders", "/support",
  "/telegram", "/notifications", "/pos", "/pos/shifts", "/pos/returns", "/builder",
  ...(ids.order ? [`/orders/${ids.order}`, `/print/orders/${ids.order}/invoice`] : []),
  ...(ids.product ? [`/products/${ids.product}/edit`] : []),
  ...(ids.category ? [`/categories/${ids.category}/edit`] : []),
];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: "sessionToken", value: token, domain: new URL(base).hostname, path: "/" }]);
const p = await ctx.newPage();
let errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 160)));
p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 160)));

const out = {};
for (const r of routes) {
  errs = [];
  let status = 0;
  try {
    status = (await p.goto(base + r, { waitUntil: "load", timeout: 120000 }))?.status() ?? 0;
    await p.waitForTimeout(1500);
  } catch (e) {
    out[r] = { error: e.message.slice(0, 120) };
    continue;
  }
  let info = null;
  for (let i = 0; i < 3 && !info; i++) {
    try {
      await p.waitForLoadState("load");
      info = await p.evaluate(() => {
        const AR = /[؀-ۿ]/;
        const lines = new Set();
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = walk.nextNode())) {
          const t = n.textContent.trim();
          const el = n.parentElement;
          if (!t || !AR.test(t) || !el || el.closest("script,style")) continue;
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          lines.add(t.slice(0, 90));
        }
        for (const el of document.querySelectorAll("[placeholder],[aria-label],[title]"))
          for (const a of ["placeholder", "aria-label", "title"]) {
            const v = el.getAttribute(a);
            if (v && AR.test(v)) lines.add(`@${a}: ${v.slice(0, 70)}`);
          }
        return { url: location.pathname, dir: document.documentElement.dir, title: document.title, arabic: [...lines], digitsAr: /[٠-٩]/.test(document.body.innerText) };
      });
    } catch {
      await p.waitForTimeout(1500);
    }
  }
  out[r] = info ? { status, ...info, errors: [...new Set(errs)].slice(0, 6) } : { error: "evaluate failed" };
  if (shotDir && info) await p.screenshot({ path: `${shotDir}/${r.replace(/[^a-z0-9]+/gi, "_") || "home"}.png` });
  process.stdout.write(`${r} ${info ? info.arabic.length : "ERR"}\n`);
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
await b.close();
