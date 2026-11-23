// Images for the "Casho Store" example: the user's six game posters as they
// are, plus a wide hero image made from three of them (characters only, the
// logos cropped off). Uploads to Cloudinary casho/uploads/showcase-casho-store
// and writes images.json for seed.mjs.
//
//   node scripts/casho-store-demo/art.mjs <posters dir>                  render + upload
//   node scripts/casho-store-demo/art.mjs <posters dir> --no-upload --out <dir>
//        render only; images.json then holds `/<prefix>/<file>` paths (--prefix, default "qa")

import "dotenv/config";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ART } from "./catalog.mjs";

const argv = process.argv.slice(2);
const SRC = argv[0];
if (!SRC || SRC.startsWith("--")) throw new Error("usage: art.mjs <posters dir> [--no-upload --out <dir> --prefix qa]");
const UPLOAD = !argv.includes("--no-upload");
const flag = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback);
const OUT = path.resolve(flag("--out", path.join(path.dirname(new URL(import.meta.url).pathname), ".out")));
const PREFIX = flag("--prefix", "qa");
const manifestPath = path.join(path.dirname(new URL(import.meta.url).pathname), "images.json");

/** Three characters side by side on the theme's violet, fading into each other. */
async function heroArt(file) {
  const W = 1600, H = 760, CROP = 0.72, tileW = 800, tileH = Math.round(800 * CROP);
  const fade = Buffer.from(`<svg width="${tileW}" height="${tileH}"><defs>
<linearGradient id="x" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff"/><stop offset=".78" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff"/><stop offset=".86" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="m"><rect width="${tileW}" height="${tileH}" fill="url(#y)"/></mask></defs>
<rect width="${tileW}" height="${tileH}" fill="url(#x)" mask="url(#m)"/></svg>`);
  const mask = await sharp(fade).png().toBuffer();
  const layers = [];
  for (const [i, key] of ["fcmobile", "freefire", "pubg"].entries()) {
    const tile = await sharp(path.join(SRC, ART[key])).resize(800, 800).extract({ left: 0, top: 0, width: 800, height: tileH }).ensureAlpha().toBuffer();
    const masked = await sharp(tile).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    layers.push({ input: masked, left: Math.round((i * (W - tileW)) / 2), top: H - tileH });
  }
  const bg = Buffer.from(`<svg width="${W}" height="${H}"><defs><radialGradient id="g" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#3a0ab8"/><stop offset="1" stop-color="#12052e"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
  await sharp(bg).composite(layers).jpeg({ quality: 86 }).toFile(file);
}

const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const run = Date.now().toString(36);

async function upload(file, key) {
  const fd = new FormData();
  fd.append("file", new Blob([await readFile(file)], { type: "image/jpeg" }), `${key}.jpg`);
  fd.append("upload_preset", preset);
  fd.append("folder", "casho/uploads/showcase-casho-store");
  fd.append("public_id", `${key}-${run}`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd, signal: AbortSignal.timeout(60_000) });
  const data = await res.json().catch(() => null);
  if (!res.ok || typeof data?.secure_url !== "string") throw new Error(`${key}: ${data?.error?.message ?? res.status}`);
  return data.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}

if (UPLOAD && (!cloud || !preset)) throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / _UPLOAD_PRESET missing");
await mkdir(OUT, { recursive: true });

const files = {};
for (const [key, name] of Object.entries(ART)) {
  files[key] = path.join(OUT, `${key}.jpg`);
  await copyFile(path.join(SRC, name), files[key]);
}
files.hero = path.join(OUT, "hero.jpg");
await heroArt(files.hero);

const images = {};
for (const [key, file] of Object.entries(files)) {
  images[key] = UPLOAD ? await upload(file, key) : `/${PREFIX}/${key}.jpg`;
  console.log(`${key} → ${images[key]}`);
}
await writeFile(manifestPath, JSON.stringify(images, null, 1) + "\n");
console.log(`\n${Object.keys(images).length} images → ${OUT} (${UPLOAD ? "uploaded" : "local paths"}, ${path.relative(process.cwd(), manifestPath)})`);
