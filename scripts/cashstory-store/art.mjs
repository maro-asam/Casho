// Images for "Cash Story": the merchant's six game posters and two designed
// banners, as they are. Uploads to Cloudinary casho/uploads/cashstory and
// writes images.json for seed.mjs.
//
//   node scripts/cashstory-store/art.mjs <posters dir> <banners dir>                 upload
//   node scripts/cashstory-store/art.mjs <posters dir> <banners dir> --no-upload --out <dir>
//        copy only; images.json then holds `/<prefix>/<file>` paths (--prefix, default "qa")

import "dotenv/config";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ART, BANNER_ART } from "./catalog.mjs";

const argv = process.argv.slice(2);
const [POSTERS, BANNERS] = argv;
if (!POSTERS || !BANNERS || BANNERS.startsWith("--")) throw new Error("usage: art.mjs <posters dir> <banners dir> [--no-upload --out <dir> --prefix qa]");
const UPLOAD = !argv.includes("--no-upload");
const flag = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback);
const here = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.resolve(flag("--out", path.join(here, ".out")));
const PREFIX = flag("--prefix", "qa");

const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const run = Date.now().toString(36);

async function upload(file, key) {
  const fd = new FormData();
  fd.append("file", new Blob([await readFile(file)], { type: "image/jpeg" }), `${key}.jpg`);
  fd.append("upload_preset", preset);
  fd.append("folder", "casho/uploads/cashstory");
  fd.append("public_id", `${key}-${run}`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd, signal: AbortSignal.timeout(60_000) });
  const data = await res.json().catch(() => null);
  if (!res.ok || typeof data?.secure_url !== "string") throw new Error(`${key}: ${data?.error?.message ?? res.status}`);
  return data.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}

if (UPLOAD && (!cloud || !preset)) throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / _UPLOAD_PRESET missing");
await mkdir(OUT, { recursive: true });

const sources = [
  ...Object.entries(ART).map(([key, name]) => [key, path.join(POSTERS, name)]),
  ...Object.entries(BANNER_ART).map(([key, name]) => [key, path.join(BANNERS, name)]),
];
const images = {};
for (const [key, src] of sources) {
  const file = path.join(OUT, `${key}.jpg`);
  await copyFile(src, file);
  images[key] = UPLOAD ? await upload(file, key) : `/${PREFIX}/${key}.jpg`;
  console.log(`${key} → ${images[key]}`);
}
await writeFile(path.join(here, "images.json"), JSON.stringify(images, null, 1) + "\n");
console.log(`\n${sources.length} images (${UPLOAD ? "uploaded" : "local paths"}) → scripts/cashstory-store/images.json`);
