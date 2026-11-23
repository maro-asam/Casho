// Draws every image of the "levelup" showcase store in code (Playwright → PNG)
// and uploads them to Cloudinary, then writes images.json for seed.mjs.
// No game logos or official artwork: gems, coins and gift cards are drawn here.
//
//   node scripts/levelup-demo/art.mjs              render + upload, write images.json
//   node scripts/levelup-demo/art.mjs --no-upload  render only (look at the PNGs in --out)
//   node scripts/levelup-demo/art.mjs --only ff-583,banner-ff   render a few
//   --out <dir>   where the PNGs go (default: $TMPDIR/levelup-art)

import "dotenv/config";
import os from "node:os";
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { CATEGORIES, PALETTES, PRODUCTS } from "./catalog.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const OUT = opt("--out") ?? path.join(os.tmpdir(), "levelup-art");
const ONLY = opt("--only")?.split(",");
const UPLOAD = !argv.includes("--no-upload");

// Store colors (same as seed.mjs THEME tokens).
const STORE = { bg: "#07060d", violet: "#7b3cff", violetHi: "#b79bff", lime: "#d4ff3a" };

// ─── Drawn objects ───────────────────────────────────────────────────────────

const GEMS = {
  cyan: { hi: "#f2fdff", light: "#9becff", mid: "#4f9dff", dark: "#3423b8" },
  pink: { hi: "#fff2fc", light: "#ffa6ec", mid: "#df4fd6", dark: "#561ab5" },
};
const COINS = {
  UC: { hi: "#fff6c2", rim: "#f5b400", dark: "#7a4700", faceHi: "#ffe57a", face: "#e19b00", ink: "#5e3300" },
  CP: { hi: "#f4f8dc", rim: "#bcc76c", dark: "#3d4512", faceHi: "#e6ecaa", face: "#97a53e", ink: "#262c08" },
  V: { hi: "#e1f0ff", rim: "#62a6ff", dark: "#24238f", faceHi: "#a8d6ff", face: "#3f6dff", ink: "#ffffff" },
};

let uid = 0;
const nextId = () => `g${++uid}`;

function gemSvg(c) {
  const id = nextId();
  const P = { A: [50, 12], C: [100, 12], B: [150, 12], L: [4, 62], R: [196, 62], p: [52, 62], q: [100, 62], s: [148, 62], V: [100, 176] };
  const poly = (keys, fill) => `<polygon points="${keys.map((k) => P[k].join(",")).join(" ")}" fill="${fill}"/>`;
  return `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.hi}"/><stop offset="1" stop-color="${c.light}"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.dark}"/></linearGradient></defs>
    ${poly(["L", "A", "p"], c.light)}${poly(["A", "C", "p"], `url(#${id}t)`)}${poly(["C", "q", "p"], c.hi)}
    ${poly(["C", "s", "q"], c.light)}${poly(["C", "B", "s"], `url(#${id}t)`)}${poly(["B", "R", "s"], c.mid)}
    ${poly(["L", "p", "V"], c.mid)}${poly(["p", "q", "V"], c.light)}${poly(["q", "s", "V"], `url(#${id}b)`)}${poly(["s", "R", "V"], c.dark)}
    <polygon points="50,12 150,12 196,62 100,176 4,62" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2.5" stroke-linejoin="round"/>
    <line x1="4" y1="62" x2="196" y2="62" stroke="${c.hi}" stroke-width="2" opacity=".8"/>
    <path d="M74 22l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#fff" opacity=".95"/></svg>`;
}

function coinSvg(c, label) {
  const id = nextId();
  const size = label.length > 1 ? 64 : 92;
  return `<svg viewBox="0 0 200 212" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.hi}"/><stop offset=".55" stop-color="${c.rim}"/><stop offset="1" stop-color="${c.dark}"/></linearGradient>
    <radialGradient id="${id}f" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${c.faceHi}"/><stop offset="1" stop-color="${c.face}"/></radialGradient></defs>
    <circle cx="100" cy="112" r="96" fill="${c.dark}"/>
    <circle cx="100" cy="100" r="96" fill="url(#${id}r)"/>
    <circle cx="100" cy="100" r="76" fill="url(#${id}f)" stroke="${c.dark}" stroke-opacity=".35" stroke-width="3"/>
    <circle cx="100" cy="100" r="66" fill="none" stroke="${c.hi}" stroke-opacity=".7" stroke-width="2.5" stroke-dasharray="3 8"/>
    <text x="100" y="103" text-anchor="middle" dominant-baseline="central" font-family="Alexandria" font-weight="900" font-size="${size}" fill="${c.ink}">${label}</text>
    <path d="M42 66A68 68 0 0 1 88 32" stroke="#fff" stroke-opacity=".75" stroke-width="8" fill="none" stroke-linecap="round"/></svg>`;
}

/** [x, y, width] as fractions of the art box (centers), rotation in degrees. Drawn back (small y) to front. */
const PILES = {
  1: [[0.5, 0.52, 0.56, -6]],
  2: [[0.33, 0.58, 0.42, -12], [0.64, 0.48, 0.48, 9]],
  3: [[0.25, 0.62, 0.36, -14], [0.75, 0.62, 0.36, 14], [0.5, 0.44, 0.46, 0]],
  4: [[0.24, 0.38, 0.3, -16], [0.76, 0.38, 0.3, 16], [0.5, 0.5, 0.42, 0], [0.29, 0.7, 0.34, -8], [0.71, 0.7, 0.34, 8]],
  5: [[0.2, 0.34, 0.26, -18], [0.5, 0.26, 0.3, 4], [0.8, 0.34, 0.26, 18], [0.5, 0.5, 0.4, 0], [0.26, 0.66, 0.32, -8], [0.74, 0.66, 0.32, 8], [0.5, 0.8, 0.3, 4]],
  6: [[0.14, 0.5, 0.24, -22], [0.86, 0.5, 0.24, 22], [0.22, 0.28, 0.24, -14], [0.5, 0.2, 0.28, 3], [0.78, 0.28, 0.24, 14], [0.5, 0.48, 0.4, 0], [0.27, 0.7, 0.32, -9], [0.73, 0.7, 0.32, 9], [0.5, 0.84, 0.3, -3]],
};

function pile(kind, tier, opts = {}) {
  const draw = () => (kind === "coin" ? coinSvg(COINS[opts.label], opts.label) : gemSvg(GEMS[opts.gem ?? "cyan"]));
  const items = [...PILES[tier]].sort((a, b) => a[1] - b[1]);
  const sparks = tier >= 3 ? [[0.08, 0.16, 34], [0.92, 0.2, 26], [0.86, 0.86, 30], [0.12, 0.9, 22]].slice(0, tier - 2) : [];
  return `<div class="pile">
    <div class="halo"></div>
    ${items.map(([x, y, w, r]) => `<div class="it" style="left:${x * 100}%;top:${y * 100}%;width:${w * 100}%;--r:${r}deg">${draw()}</div>`).join("")}
    ${sparks.map(([x, y, s]) => `<svg class="spark" style="left:${x * 100}%;top:${y * 100}%;width:${s}px" viewBox="0 0 20 20"><path d="M10 0l2.6 7.4L20 10l-7.4 2.6L10 20l-2.6-7.4L0 10l7.4-2.6z" fill="#fff"/></svg>`).join("")}
  </div>`;
}

// Gift cards ─────────────────────────────────────────────────────────────────

const CARD_STYLES = {
  "PlayStation Store": { bg: "linear-gradient(135deg,#2a86ff 0%,#0b3fb8 55%,#061d66 100%)" },
  "PS Plus Essential": { bg: "linear-gradient(135deg,#ffd84d 0%,#f0a800 55%,#a86a00 100%)", ink: "#1d1300" },
  "Steam Wallet": { bg: "linear-gradient(135deg,#2f6f9c 0%,#1b3550 55%,#0e1724 100%)", accent: "#66c0f4" },
  "Xbox Gift Card": { bg: "linear-gradient(135deg,#2fb12f 0%,#137a13 55%,#073d07 100%)" },
  "Game Pass Ultimate": { bg: "linear-gradient(135deg,#1a1a1a 0%,#0f3d12 60%,#1f9a1f 130%)", accent: "#7dff7d" },
  "Game Pass Premium": { bg: "linear-gradient(135deg,#1a1a1a 0%,#16314f 60%,#2f7fe0 130%)", accent: "#8cc6ff" },
  Roblox: { bg: "linear-gradient(135deg,#3a3d45 0%,#1d1f24 60%,#0c0d10 100%)", accent: "#ff4a3d" },
  Valorant: { bg: "linear-gradient(135deg,#ff5a68 0%,#c4283a 55%,#5c0e18 100%)" },
  "Apple Gift Card": { bg: "radial-gradient(70% 90% at 85% 15%,#ff7ab8 0%,transparent 60%),radial-gradient(70% 90% at 10% 100%,#3d7bff 0%,transparent 60%),linear-gradient(135deg,#ffb347,#8a3dff)" },
  "Google Play": { bg: "linear-gradient(135deg,#1d2433 0%,#10141e 100%)", stripes: true },
};

function giftCard(a, { cls = "", plain = false } = {}) {
  const s = CARD_STYLES[a.brand] ?? { bg: "linear-gradient(135deg,#444,#111)" };
  const ink = s.ink ?? "#fff";
  const long = a.value.replace(/[^0-9]/g, "").length > 3;
  return `<div class="gc ${cls}" style="background:${s.bg};color:${ink}">
    <div class="gc-rings" style="--ac:${s.accent ?? "rgba(255,255,255,.9)"}"></div>
    ${s.stripes ? `<div class="gc-stripes"><i style="background:#34a853"></i><i style="background:#fbbc04"></i><i style="background:#ea4335"></i><i style="background:#4285f4"></i></div>` : ""}
    <div class="gc-sheen"></div>
    ${plain ? "" : `<div class="gc-top"><span class="gc-brand">${a.brand}</span><span class="gc-region">${a.region}</span></div>
    <div class="gc-val"><b style="font-size:${long ? 128 : 156}px">${a.value}</b>${a.valueUnit ? `<span>${a.valueUnit}</span>` : ""}</div>
    <div class="gc-foot">DIGITAL CODE · كود رقمي</div>
    <div class="gc-holo"></div>`}
  </div>`;
}

/** Cards fanned out, for category / banner art. `w` = width of one card in px. */
function cardFan(cards, w) {
  const scale = w / 760;
  const spots = cards.length === 1 ? [[0, 0, -8]] : cards.length === 2 ? [[-0.2, -0.12, -12], [0.18, 0.1, 6]] : [[-0.34, -0.2, -14], [0.32, -0.12, 11], [0, 0.2, -4]];
  return `<div class="fan">${cards
    .map((c, i) => `<div class="fan-it" style="--tx:${Math.round(spots[i][0] * w)}px;--ty:${Math.round(spots[i][1] * w)}px;--r:${spots[i][2]}deg;--s:${scale}">${giftCard(c)}</div>`)
    .join("")}</div>`;
}

// ─── Pages ───────────────────────────────────────────────────────────────────

const FONT = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;600;700;800;900&display=block" rel="stylesheet">`;

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;font-family:Alexandria,"Noto Sans Arabic",sans-serif;-webkit-font-smoothing:antialiased}
.pile{position:absolute;inset:0}
.pile .it{position:absolute;transform:translate(-50%,-50%) rotate(var(--r));filter:drop-shadow(0 22px 20px rgba(0,0,0,.45))}
.pile .it svg{display:block;width:100%;height:auto}
.pile .halo{position:absolute;left:50%;top:54%;width:92%;aspect-ratio:1;transform:translate(-50%,-50%);background:radial-gradient(closest-side,color-mix(in srgb,var(--glow) 70%,transparent),transparent);filter:blur(6px)}
.spark{position:absolute;transform:translate(-50%,-50%);filter:drop-shadow(0 0 10px #fff)}

/* product tile */
.tile{position:absolute;inset:64px;border-radius:84px;overflow:hidden;background:var(--bg);box-shadow:0 46px 70px -36px rgba(12,6,24,.6)}
.tile-bg{position:absolute;inset:0;background:radial-gradient(62% 50% at 50% 40%,color-mix(in srgb,var(--glow) 62%,transparent) 0%,transparent 72%),radial-gradient(90% 55% at 50% 112%,var(--deep) 0%,transparent 72%),linear-gradient(160deg,color-mix(in srgb,var(--main) 60%,var(--bg)) 0%,var(--bg) 64%)}
.tile-lines{position:absolute;inset:0;background:repeating-linear-gradient(120deg,rgba(255,255,255,.05) 0 2px,transparent 2px 26px);-webkit-mask-image:linear-gradient(to bottom,#000,transparent 70%)}
.tile:after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 3px rgba(255,255,255,.12),inset 0 3px 0 rgba(255,255,255,.22)}
.tile header{position:absolute;top:56px;inset-inline:62px;display:flex;justify-content:space-between;align-items:center;color:#fff}
.tile .game{font-weight:800;font-size:34px;letter-spacing:.14em}
.tile .chip{font-weight:700;font-size:21px;letter-spacing:.16em;padding:12px 18px;border-radius:999px;border:2px solid rgba(255,255,255,.38)}
.tile .art{position:absolute;left:96px;right:96px;top:140px;height:470px}
.tile .bonus{position:absolute;top:150px;left:56px;z-index:3;font-weight:900;font-size:36px;background:${STORE.lime};color:#0b0b10;padding:14px 22px;border-radius:18px;transform:rotate(-6deg);box-shadow:0 12px 26px -8px rgba(0,0,0,.55)}
.tile footer{position:absolute;bottom:60px;inset-inline:62px;display:flex;align-items:baseline;gap:18px;color:#fff}
.tile footer b{font-weight:900;line-height:.9;letter-spacing:-.02em;text-shadow:0 6px 30px rgba(0,0,0,.35)}
.tile footer span{font-weight:800;font-size:52px;color:color-mix(in srgb,var(--glow) 65%,#fff)}

/* gift card */
.gc{position:relative;width:760px;height:480px;border-radius:40px;overflow:hidden;box-shadow:0 60px 70px -40px rgba(0,0,0,.6),inset 0 0 0 2px rgba(255,255,255,.16)}
.gc-rings{position:absolute;right:-120px;top:-150px;width:520px;height:520px;border-radius:50%;border:44px solid color-mix(in srgb,var(--ac) 16%,transparent);box-shadow:0 0 0 70px color-mix(in srgb,var(--ac) 7%,transparent)}
.gc-stripes{position:absolute;right:-60px;bottom:-40px;display:flex;gap:16px;transform:rotate(-30deg)}
.gc-stripes i{display:block;width:40px;height:360px;border-radius:20px;opacity:.95}
.gc-sheen{position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.2) 48%,transparent 60%)}
.gc-top{position:absolute;top:44px;left:50px;right:46px;display:flex;justify-content:space-between;align-items:center}
.gc-brand{font-weight:800;font-size:40px;letter-spacing:-.01em}
.gc-region{font-weight:800;font-size:21px;letter-spacing:.16em;background:rgba(255,255,255,.16);border:2px solid rgba(255,255,255,.34);padding:10px 16px;border-radius:12px}
.gc-val{position:absolute;left:50px;bottom:96px;display:flex;align-items:baseline;gap:18px;direction:ltr}
.gc-val b{font-weight:900;line-height:.9;letter-spacing:-.03em}
.gc-val span{font-weight:800;font-size:46px;opacity:.92}
.gc-foot{position:absolute;left:50px;bottom:44px;font-weight:600;font-size:23px;letter-spacing:.1em;opacity:.78}
.gc-holo{position:absolute;right:46px;bottom:40px;width:112px;height:78px;border-radius:14px;background:conic-gradient(from 200deg,#ff9be8,#9fd3ff,${STORE.lime},#ffb547,#ff9be8);box-shadow:inset 0 0 0 2px rgba(255,255,255,.55)}
.product-card{position:absolute;inset:0;background:#fff}
.product-card .back{position:absolute;left:50%;top:50%;transform:translate(-50%,-64%) rotate(5deg) scale(.92);filter:brightness(.6) saturate(.9)}
.product-card .front{position:absolute;left:50%;top:50%;transform:translate(-52%,-42%) rotate(-7deg)}
.fan{position:absolute;inset:0}
.fan-it{position:absolute;left:50%;top:50%;width:760px;height:480px;margin:-240px 0 0 -380px;transform:translate(var(--tx),var(--ty)) rotate(var(--r)) scale(var(--s));transform-origin:center}

/* scenes */
.scene{position:absolute;inset:0;overflow:hidden;background:var(--bg)}
.scene .sky{position:absolute;inset:0;background:radial-gradient(48% 60% at var(--gx,30%) 45%,color-mix(in srgb,var(--glow) 55%,transparent) 0%,transparent 70%),radial-gradient(70% 70% at 90% 0%,color-mix(in srgb,${STORE.violet} 45%,transparent) 0%,transparent 70%),linear-gradient(180deg,var(--bg) 0%,color-mix(in srgb,var(--deep) 35%,var(--bg)) 100%)}
.scene .floor{position:absolute;left:-50%;right:-50%;bottom:-8%;height:62%;transform:perspective(700px) rotateX(68deg);transform-origin:bottom;background-image:linear-gradient(color-mix(in srgb,var(--glow) 50%,transparent) 2px,transparent 2px),linear-gradient(90deg,color-mix(in srgb,var(--glow) 50%,transparent) 2px,transparent 2px);background-size:90px 90px;-webkit-mask-image:linear-gradient(to top,#000 10%,transparent 85%);opacity:.55}
.scene .ghost{position:absolute;left:0;right:0;text-align:center;font-weight:900;color:transparent;-webkit-text-stroke:2px rgba(255,255,255,.13);letter-spacing:.02em;white-space:nowrap;line-height:1}
.scene .noise{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 4px)}
.scene .box{position:absolute}
.scene .vignette{position:absolute;inset:0;box-shadow:inset 0 0 220px 40px rgba(0,0,0,.55)}
`;

const page = (body, w, h) => `<!doctype html><html dir="rtl"><head><meta charset="utf-8">${FONT}<style>${CSS}</style></head><body style="width:${w}px;height:${h}px">${body}</body></html>`;
const pal = (p) => `--glow:${p.glow};--main:${p.main};--deep:${p.deep};--bg:${p.bg}`;

function productHtml(p) {
  const palette = PALETTES[p.cat];
  const a = p.art;
  if (a.kind === "card") {
    return page(`<div class="product-card"><div class="back">${giftCard(a, { plain: true })}</div><div class="front">${giftCard(a)}</div></div>`, 1000, 1000);
  }
  const cat = CATEGORIES.find((c) => c.key === p.cat);
  const label = a.kind === "coin" ? a.label : null;
  const art = pile(a.kind === "coin" ? "coin" : "gem", a.tier, { label, gem: p.cat === "yalla-ludo" ? "pink" : "cyan" });
  const len = a.amount.length;
  const size = len <= 2 ? 190 : len <= 3 ? 170 : len <= 5 ? 142 : 118;
  const chip = a.kind === "pass" ? a.top : a.kind === "coin" && a.label === "V" ? "CODE" : "BY ID";
  return page(
    `<div class="tile" style="${pal(palette)}"><div class="tile-bg"></div><div class="tile-lines"></div>
      <header><span class="game">${cat.label}</span><span class="chip">${chip}</span></header>
      ${a.bonus ? `<span class="bonus"><bdi dir="ltr">${a.bonus}</bdi> بونص</span>` : ""}
      <div class="art">${art}</div>
      <footer><b style="font-size:${size}px">${a.amount}</b><span>${a.unit}</span></footer></div>`,
    1000,
    1000,
  );
}

/** A dark scene with a glowing floor; `art` sits in `box` (left/top/width/height in %). */
function sceneHtml({ w, h, palette, ghost, ghostSize, ghostTop = "10%", glowX, box, art }) {
  return page(
    `<div class="scene" style="${pal(palette)};--gx:${glowX ?? "50%"}"><div class="sky"></div>
      ${ghost ? `<div class="ghost" style="font-size:${ghostSize}px;top:${ghostTop}" dir="ltr">${ghost}</div>` : ""}
      <div class="floor"></div><div class="noise"></div>
      <div class="box" style="left:${box[0]}%;top:${box[1]}%;width:${box[2]}%;height:${box[3]}%">${art}</div>
      <div class="vignette"></div></div>`,
    w,
    h,
  );
}

const CARD_SETS = {
  playstation: [{ brand: "PS Plus Essential", value: "12", valueUnit: "شهر", region: "USA" }, { brand: "PlayStation Store", value: "$20", region: "USA" }, { brand: "PlayStation Store", value: "$50", region: "USA" }],
  steam: [{ brand: "Steam Wallet", value: "$10", region: "USA" }, { brand: "Steam Wallet", value: "$50", region: "USA" }, { brand: "Steam Wallet", value: "$20", region: "USA" }],
  xbox: [{ brand: "Xbox Gift Card", value: "$25", region: "USA" }, { brand: "Game Pass Premium", value: "1", valueUnit: "شهر", region: "USA" }, { brand: "Game Pass Ultimate", value: "1", valueUnit: "شهر", region: "USA" }],
  roblox: [{ brand: "Roblox", value: "4,500", valueUnit: "Robux", region: "GLOBAL" }, { brand: "Roblox", value: "2,000", valueUnit: "Robux", region: "GLOBAL" }, { brand: "Roblox", value: "800", valueUnit: "Robux", region: "GLOBAL" }],
  valorant: [{ brand: "Valorant", value: "2,050", valueUnit: "VP", region: "MENA" }, { brand: "Valorant", value: "1,000", valueUnit: "VP", region: "MENA" }, { brand: "Valorant", value: "475", valueUnit: "VP", region: "MENA" }],
  "apple-google": [{ brand: "Google Play", value: "$25", region: "USA" }, { brand: "Apple Gift Card", value: "$25", region: "USA" }, { brand: "Apple Gift Card", value: "$10", region: "USA" }],
  mixed: [{ brand: "Steam Wallet", value: "$20", region: "USA" }, { brand: "Game Pass Ultimate", value: "1", valueUnit: "شهر", region: "USA" }, { brand: "PlayStation Store", value: "$50", region: "USA" }],
};

/** What a shelf shows: a pile for top-ups, fanned cards for gift cards. */
function shelfArt(key, cardWidth) {
  const cat = CATEGORIES.find((c) => c.key === key);
  if (cat.unit === "gem") return pile("gem", 6, { gem: key === "yalla-ludo" ? "pink" : "cyan" });
  if (cat.unit === "card") return cardFan(CARD_SETS[key], cardWidth);
  return pile("coin", 6, { label: cat.unit });
}

function categoryHtml(c) {
  return sceneHtml({ w: 1200, h: 900, palette: PALETTES[c.key], ghost: c.label, ghostSize: c.label.length > 10 ? 150 : 200, ghostTop: "8%", box: [14, 16, 72, 72], art: shelfArt(c.key, 470) });
}

function mixedArt(cardWidth) {
  return `<div style="position:absolute;inset:0">
    <div style="position:absolute;left:30%;top:2%;width:70%;height:62%">${cardFan(CARD_SETS.mixed.slice(1), cardWidth)}</div>
    <div style="position:absolute;left:-2%;top:30%;width:54%;height:70%;--glow:#ffe27a">${pile("coin", 4, { label: "UC" })}</div>
    <div style="position:absolute;left:44%;top:48%;width:46%;height:56%;--glow:#9becff">${pile("gem", 3)}</div>
  </div>`;
}

const STORE_PALETTE = { glow: STORE.violetHi, main: STORE.violet, deep: "#2b1170", bg: STORE.bg };

/** Hero slides: art on the left on desktop (the copy sits at the start side), at the top on phones. */
const BANNER_ART = {
  "banner-all": { palette: STORE_PALETTE, art: (wide) => mixedArt(wide ? 430 : 430) },
  "banner-ff": { palette: PALETTES["free-fire"], art: () => pile("gem", 6) },
  "banner-pubg": { palette: PALETTES.pubg, art: () => pile("coin", 6, { label: "UC" }) },
  "banner-cards": { palette: PALETTES.playstation, art: (wide) => cardFan(CARD_SETS.mixed, wide ? 420 : 470) },
  "hero-gamepass": { palette: PALETTES.xbox, art: (wide) => cardFan(CARD_SETS.xbox, wide ? 420 : 470) },
};

function bannerHtml(key, wide) {
  const b = BANNER_ART[key];
  return wide
    ? sceneHtml({ w: 2000, h: 1100, palette: b.palette, glowX: "22%", box: [3, 9, 35, 84], art: b.art(true) })
    : sceneHtml({ w: 900, h: 1300, palette: b.palette, glowX: "50%", box: [8, 6, 84, 50], art: b.art(false) });
}

const COLLECTIONS = [
  { key: "col-mobile", palette: PALETTES["free-fire"], art: () => mixedMobile() },
  { key: "col-console", palette: PALETTES.playstation, art: () => cardFan(CARD_SETS.playstation, 520) },
  { key: "col-pc", palette: PALETTES.steam, art: () => cardFan(CARD_SETS.steam, 520) },
  { key: "col-gift", palette: PALETTES["apple-google"], art: () => cardFan(CARD_SETS["apple-google"], 520) },
];
function mixedMobile() {
  return `<div style="position:absolute;inset:0"><div style="position:absolute;left:0;top:0;width:100%;height:58%">${pile("gem", 5)}</div>
    <div style="position:absolute;left:10%;top:46%;width:80%;height:54%;--glow:#ffe27a">${pile("coin", 4, { label: "UC" })}</div></div>`;
}
const collectionHtml = (c) => sceneHtml({ w: 900, h: 1300, palette: c.palette, glowX: "50%", box: [6, 8, 88, 56], art: c.art() });

function aboutHtml() {
  const phone = `<div style="position:absolute;left:50%;top:50%;width:420px;height:860px;transform:translate(-50%,-50%) rotate(-6deg);border-radius:70px;background:#0d0c14;box-shadow:0 0 0 12px #1c1a28,0 0 0 14px #3a3550,0 80px 120px -40px rgba(0,0,0,.8)">
    <div style="position:absolute;inset:22px;border-radius:52px;overflow:hidden;background:linear-gradient(180deg,#14112a,#07060d)">
      <div style="position:absolute;top:18px;left:50%;width:120px;height:34px;transform:translateX(-50%);border-radius:20px;background:#000"></div>
      <div style="position:absolute;top:110px;left:0;right:0;display:grid;place-items:center">
        <div style="width:132px;height:132px;border-radius:50%;background:${STORE.lime};display:grid;place-items:center;box-shadow:0 0 60px ${STORE.lime}88">
          <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#0b0b10" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <div style="margin-top:34px;color:#fff;font-weight:900;font-size:44px">تم الشحن</div>
        <div style="margin-top:10px;color:#b79bff;font-weight:600;font-size:22px">اتشحن في 4 دقايق</div>
      </div>
      <div style="position:absolute;left:28px;right:28px;top:440px;border-radius:30px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:26px 26px;color:#fff">
        <div style="display:flex;justify-content:space-between;font-size:20px;color:#a9a3c4"><span>الباقة</span><span dir="ltr">FREE FIRE</span></div>
        <div style="margin-top:8px;font-weight:900;font-size:36px">583 جوهرة</div>
        <div style="height:1px;background:rgba(255,255,255,.1);margin:20px 0"></div>
        <div style="display:flex;justify-content:space-between;font-size:20px;color:#a9a3c4"><span>Player ID</span><span dir="ltr" style="color:#fff">51•••••28</span></div>
        <div style="display:flex;justify-content:space-between;font-size:20px;color:#a9a3c4;margin-top:14px"><span>الدفع</span><span style="color:#fff">فودافون كاش</span></div>
      </div>
      <div style="position:absolute;left:28px;right:28px;bottom:40px;height:76px;border-radius:24px;background:${STORE.violet};display:grid;place-items:center;color:#fff;font-weight:800;font-size:24px">اشحن تاني</div>
    </div></div>`;
  const gems = `<div style="position:absolute;left:4%;top:8%;width:30%;height:50%;--glow:#9becff">${pile("gem", 3)}</div>
    <div style="position:absolute;right:3%;bottom:6%;width:30%;height:46%;--glow:#ffe27a">${pile("coin", 3, { label: "UC" })}</div>`;
  return sceneHtml({ w: 1400, h: 1000, palette: STORE_PALETTE, glowX: "50%", box: [0, 0, 100, 100], art: gems + phone });
}

function logoHtml() {
  return page(
    `<div style="position:absolute;inset:0;background:radial-gradient(80% 80% at 30% 20%,#a57bff 0%,${STORE.violet} 45%,#3a12a8 100%);display:grid;place-items:center">
      <svg width="300" height="300" viewBox="0 0 100 100" fill="none" stroke="${STORE.lime}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 6px 14px rgba(0,0,0,.35))">
        <path d="M22 58 50 30 78 58"/><path d="M22 84 50 56 78 84" stroke="#fff" opacity=".4"/></svg>
      <svg style="position:absolute;right:70px;top:62px" width="54" height="54" viewBox="0 0 20 20"><path d="M10 0l2.6 7.4L20 10l-7.4 2.6L10 20l-2.6-7.4L0 10l7.4-2.6z" fill="#fff"/></svg>
    </div>`,
    512,
    512,
  );
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const jobs = [
  ...PRODUCTS.map((p) => ({ key: p.slug, group: "products", html: () => productHtml(p), w: 1000, h: 1000 })),
  ...CATEGORIES.map((c) => ({ key: `cat-${c.key}`, id: c.key, group: "categories", html: () => categoryHtml(c), w: 1200, h: 900 })),
  ...Object.keys(BANNER_ART).flatMap((k) => [
    { key: `${k}-wide`, id: k, group: "banners", variant: "wide", html: () => bannerHtml(k, true), w: 2000, h: 1100 },
    { key: `${k}-tall`, id: k, group: "banners", variant: "tall", html: () => bannerHtml(k, false), w: 900, h: 1300 },
  ]),
  ...COLLECTIONS.map((c) => ({ key: c.key, group: "collections", html: () => collectionHtml(c), w: 900, h: 1300 })),
  { key: "about", group: "misc", html: aboutHtml, w: 1400, h: 1000 },
  { key: "logo", group: "misc", html: logoHtml, w: 512, h: 512 },
].filter((j) => !ONLY || ONLY.includes(j.key));

const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const run = Date.now().toString(36);

async function upload(file, key) {
  const fd = new FormData();
  fd.append("file", new Blob([await readFile(file)], { type: "image/png" }), `${key}.png`);
  fd.append("upload_preset", preset);
  fd.append("folder", "casho/uploads/showcase-levelup");
  fd.append("public_id", `${key}-${run}`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd, signal: AbortSignal.timeout(60_000) });
  const data = await res.json().catch(() => null);
  if (!res.ok || typeof data?.secure_url !== "string") throw new Error(`${key}: ${data?.error?.message ?? res.status}`);
  return data.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}

await mkdir(OUT, { recursive: true });
if (UPLOAD && (!cloud || !preset)) throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / _UPLOAD_PRESET missing");

const manifestPath = path.join(here, "images.json");
const manifest = UPLOAD ? JSON.parse(await readFile(manifestPath, "utf8").catch(() => "{}")) : {};
const browser = await chromium.launch();
try {
  const tab = await browser.newPage({ deviceScaleFactor: 1 });
  for (const job of jobs) {
    await tab.setViewportSize({ width: job.w, height: job.h });
    await tab.setContent(job.html(), { waitUntil: "networkidle" });
    await tab.evaluate(() => document.fonts.ready);
    const file = path.join(OUT, `${job.key}.png`);
    await tab.screenshot({ path: file, type: "png" });
    if (UPLOAD) {
      const url = await upload(file, job.key);
      manifest[job.group] ??= {};
      if (job.variant) (manifest[job.group][job.id] ??= {})[job.variant] = url;
      else manifest[job.group][job.id ?? job.key] = url;
    }
    process.stdout.write(`${job.key} `);
  }
} finally {
  await browser.close();
}
if (UPLOAD) await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${jobs.length} images → ${OUT}${UPLOAD ? ` (uploaded, ${path.relative(process.cwd(), manifestPath)})` : ""}`);
