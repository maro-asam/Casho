import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })).newPage();
let out = "";
p.on("console", (m) => { if (/hydrated/.test(m.text())) out = m.text(); });
await p.goto(process.argv[2], { waitUntil: "networkidle", timeout: 120000 });
await p.waitForTimeout(2000);
console.log(out ? out.split("\n").filter((l) => /^\s*[+-]\s|^\s+</.test(l)).slice(0, 40).join("\n") || out.slice(-1500) : "clean");
await b.close();
