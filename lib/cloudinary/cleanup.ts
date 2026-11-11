// Removes a deleted store's files from Cloudinary.
//
// Uploads sit in folders by kind (casho/uploads/products, /logos…), not by
// store, so the only link from a file to its store is the URL saved in the
// DB. The admin delete actions therefore:
//   1. list the store's files from its rows before deleting (collectStoreMedia),
//   2. after the delete commits and the response is sent (queueMediaPurge),
//      re-check every source below for a URL still pointing at each file —
//      another store, a blog post, a showcase card — and keep those,
//   3. delete the rest through the Admin API, with the CDN cache invalidated.
// Cloudinary deletes are permanent, so anything uncertain keeps the file: a
// failed re-check deletes nothing, and only casho/… files are ever touched.
// Best effort throughout — store deletion never waits on or fails for it.

import { Prisma } from "@prisma/client";
import { after } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  assetKey,
  deletionBatches,
  extractCloudinaryAssets,
  likeContains,
  referencePattern,
  type CloudinaryAsset,
} from "@/lib/cloudinary/assets";

type Source = {
  table: string;
  text?: string[];
  arrays?: string[];
  json?: string[];
  /** The rows a store owns. Absent = Casho's own content: never collected, only re-checked. */
  owner?: (storeIds: string[]) => Prisma.Sql;
};

const byStore = (storeIds: string[]) => Prisma.sql`"storeId" = ANY(${storeIds}::text[])`;

/** Every column an uploaded (or pasted) Cloudinary URL can be saved in. Keep in sync with the upload call sites. */
const SOURCES: Source[] = [
  { table: "StoreSettings", text: ["logo", "coverImage", "ogImage"], json: ["themeConfig", "draftThemeConfig", "conversionConfig"], owner: byStore },
  { table: "Category", text: ["image"], owner: byStore },
  { table: "Product", text: ["image", "digitalUrl", "description"], arrays: ["images"], json: ["attributes"], owner: byStore },
  { table: "ProductVariant", text: ["imageUrl"], owner: byStore },
  { table: "Banner", text: ["image", "mobileImage"], owner: byStore },
  { table: "StorePopup", json: ["config"], owner: byStore },
  { table: "TopupRequest", text: ["receiptImage"], owner: byStore },
  { table: "ProductReview", text: ["customerAvatar"], owner: byStore },
  {
    table: "SharksStory", // goes with the store: story → application → store all cascade
    text: ["coverImageUrl", "logoUrl", "videoUrl", "videoPosterUrl"],
    owner: (storeIds) => Prisma.sql`"applicationId" IN (SELECT "id" FROM "SharksApplication" WHERE "storeId" = ANY(${storeIds}::text[]))`,
  },
  { table: "BlogPost", text: ["coverImage", "content"], arrays: ["gallery"] },
  { table: "ShowcaseSite", text: ["imageUrl"] }, // outlives the store (storeId → null)
];

/** Patterns per re-check query. */
const PATTERN_CHUNK = 500;

function adminConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}
type AdminConfig = NonNullable<ReturnType<typeof adminConfig>>;

/** All of a row's URL-bearing columns as one space-separated string (arrays joined, JSON as text). */
function rowText(source: Source) {
  const columns = [
    ...(source.text ?? []).map((c) => `"${c}"`),
    ...(source.arrays ?? []).map((c) => `array_to_string("${c}", ' ')`),
    ...(source.json ?? []).map((c) => `"${c}"::text`),
  ];
  return Prisma.raw(`concat_ws(' ', ${columns.join(", ")})`);
}

/** The texts of `source`'s rows that mention our cloud and match `filter`. */
async function scan(source: Source, cloudName: string, filter: Prisma.Sql) {
  const text = rowText(source);
  const ours = likeContains(`res.cloudinary.com/${cloudName}/`);
  const rows = await prisma.$queryRaw<{ text: string | null }[]>(
    Prisma.sql`SELECT ${text} AS "text" FROM ${Prisma.raw(`"${source.table}"`)} WHERE ${text} LIKE ${ours} AND ${filter}`,
  );
  return rows.flatMap((row) => extractCloudinaryAssets(row.text ?? "", cloudName));
}

/** The Cloudinary files these stores' rows point at. Call before deleting them. Never throws. */
export async function collectStoreMedia(storeIds: string[]): Promise<CloudinaryAsset[]> {
  if (!storeIds.length) return [];
  const config = adminConfig();
  if (!config) {
    console.warn("[cloudinary] CLOUDINARY_API_KEY/SECRET or cloud name missing — deleted stores keep their files");
    return [];
  }

  try {
    const owned = SOURCES.flatMap((s) => (s.owner ? [scan(s, config.cloudName, s.owner(storeIds))] : []));
    const found = new Map<string, CloudinaryAsset>();
    for (const asset of (await Promise.all(owned)).flat()) found.set(assetKey(asset), asset);
    return [...found.values()];
  } catch (error) {
    console.error("[cloudinary] listing store files failed — they stay", error);
    return [];
  }
}

/** Keys of the files some row (anywhere, any store) still points at. Throws on a DB error. */
async function stillReferenced(assets: CloudinaryAsset[], cloudName: string) {
  const wanted = new Set(assets.map(assetKey));
  const used = new Set<string>();
  const patterns = [...new Set(assets.map(referencePattern))];

  for (let i = 0; i < patterns.length; i += PATTERN_CHUNK) {
    const chunk = patterns.slice(i, i + PATTERN_CHUNK);
    const results = await Promise.all(SOURCES.map((s) => scan(s, cloudName, Prisma.sql`${rowText(s)} LIKE ANY(${chunk}::text[])`)));
    for (const asset of results.flat()) {
      if (wanted.has(assetKey(asset))) used.add(assetKey(asset));
    }
  }
  return used;
}

/** One Admin API "delete resources" call (≤ 100 ids of one type). Returns how many were deleted. */
async function destroy(config: AdminConfig, batch: ReturnType<typeof deletionBatches>[number]) {
  const params = new URLSearchParams({ invalidate: "true" });
  for (const id of batch.publicIds) params.append("public_ids[]", id);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/resources/${batch.resourceType}/upload?${params}`, {
    method: "DELETE",
    headers: { Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}` },
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await response.json().catch(() => null)) as { deleted?: Record<string, string>; error?: { message?: string } } | null;
  if (!response.ok) throw new Error(data?.error?.message ?? `HTTP ${response.status}`);
  return Object.values(data?.deleted ?? {}).filter((status) => status === "deleted").length;
}

/** Deletes the files no row points at any more. Call only after the rows are gone. */
export async function purgeUnusedMedia(assets: CloudinaryAsset[]) {
  const result = { found: assets.length, kept: 0, deleted: 0, failed: 0 };
  const config = adminConfig();
  if (!config || !assets.length) return result;

  const used = await stillReferenced(assets, config.cloudName);
  const unused = assets.filter((asset) => !used.has(assetKey(asset)));
  result.kept = assets.length - unused.length;

  for (const batch of deletionBatches(unused)) {
    try {
      result.deleted += await destroy(config, batch);
    } catch (error) {
      result.failed += batch.publicIds.length;
      console.error(`[cloudinary] deleting ${batch.publicIds.length} ${batch.resourceType} file(s) failed`, error);
    }
  }
  return result;
}

/** Runs purgeUnusedMedia after the response (right away outside a request). Never throws. */
export function queueMediaPurge(assets: CloudinaryAsset[]) {
  if (!assets.length) return;
  const run = () =>
    purgeUnusedMedia(assets)
      .then((result) => console.info("[cloudinary] deleted store files", result))
      .catch((error) => console.error("[cloudinary] re-check failed — no files deleted", error));
  try {
    after(run);
  } catch {
    void run();
  }
}
