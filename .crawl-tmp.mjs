import { chromium } from "playwright";
import fs from "node:fs";
const [tokenFile, outFile, shotDir] = process.argv.slice(2);
const token = fs.readFileSync(tokenFile, "utf8").split(" ")[1];
const O = "695abaaf-97e8-4af8-a5dc-e99531b9015e", P = "086e6cd9-3910-4e0e-a3a1-8c288fc59e17", C = "20dab9c8-d368-44aa-a1eb-5162c32247f1";
const routes = ["/", "/abandoned-carts", "/api-keys", "/balance", "/balance/history", "/banners", "/blog", "/categories", "/categories/new", `/categories/${C}/edit`, "/change-plan", "/coupons", "/crm", "/crm/analytics", "/crm/customers", "/crm/segments", "/crm/tags", "/customization", "/customization?tab=popups", "/customization?tab=whatsapp", "/customization?tab=social-proof", "/domain", "/fraud", "/integrations/instagram", "/integrations/shopify", "/inventory", "/inventory/movements", "/inventory/purchase-orders", "/inventory/suppliers", "/inventory/transfers", "/inventory/adjustments", "/loyalty", "/offers", "/orders", `/orders/${O}`, "/payment-methods", "/pixels", "/products", "/products/new", "/products/import", `/products/${P}/edit`, "/qr-code", "/referral", "/reports", "/reviews", "/seo", "/services", "/settings", "/shipping", "/shipping/integrations", "/shipping/shipments", "/suggested-orders", "/support", "/telegram", "/notifications", "/pos", "/pos/shifts", "/pos/returns", "/builder", `/print/orders/${O}/invoice`];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: "sessionToken", value: token, domain: "app.localhost", path: "/" }]);
const p = await ctx.newPage();
const out = {};
let errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 160)));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
for (const r of routes) {
  errs = [];
  let status = 0;
  try {
    const res = await p.goto("http://app.localhost:3000" + r, { waitUntil: "load", timeout: 90000 });
    status = res?.status() ?? 0;
    await p.waitForTimeout(1800);
  } catch (e) { out[r] = { error: e.message.slice(0, 120) }; continue; }
  let info;
  for (let attempt = 0; attempt < 3; attempt++) {
   try {
    await p.waitForLoadState("load");
    info = await p.evaluate(() => {
    const AR = /[؀-ۿ]/;
    const lines = new Set();
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const t = n.textContent.trim();
      if (!t || !AR.test(t)) continue;
      const el = n.parentElement;
      if (!el || el.closest("script,style,[aria-hidden=true],.sr-only") ) { if (!el || !el.closest(".sr-only")) continue; }
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      lines.add(t.slice(0, 80));
    }
    for (const el of document.querySelectorAll("[placeholder],[aria-label],[title]")) {
      for (const a of ["placeholder", "aria-label", "title"]) { const v = el.getAttribute(a); if (v && AR.test(v)) lines.add(`@${a}: ${v.slice(0, 70)}`); }
    }
    return { url: location.pathname, dir: document.documentElement.dir, title: document.title, arabic: [...lines].slice(0, 40), arabicCount: lines.size, digitsAr: /[٠-٩]/.test(document.body.innerText) };
    });
    break;
   } catch { await p.waitForTimeout(1500); }
  }
  if (!info) { out[r] = { error: "evaluate failed" }; continue; }
  out[r] = { status, ...info, errors: [...new Set(errs)].slice(0, 5) };
  if (shotDir) await p.screenshot({ path: `${shotDir}/${r.replace(/[^a-z0-9]+/gi, "_") || "home"}.png` });
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
await b.close();
