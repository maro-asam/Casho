// Cloudinary files Casho uploaded, found inside stored text: URL columns,
// String[] columns joined by spaces, JSON as text, free text. Pure — the store
// deletion cleanup (./cleanup.ts) uses it on both sides: to list a store's
// files, and to re-check that nothing else still points at them.

export type CloudinaryResourceType = "image" | "video" | "raw";
export type CloudinaryAsset = { resourceType: CloudinaryResourceType; publicId: string };

/** Every upload lands under casho/… (GetCloudinaryUploadAuthAction only signs casho/uploads/<name>). */
const OWN_ROOT = "casho";

// …/<cloud>/<image|video|raw>/upload/[transformations/][v123/]casho/…/<name>[.ext]
// Commas stay inside (transformations use them); array columns must be joined by spaces, not ::text.
const URL_RE = /https?:\/\/res\.cloudinary\.com\/([^/\s"'<>\\]+)\/(image|video|raw)\/upload\/([^\s"'<>\\()?#]+)/g;

export const assetKey = (asset: CloudinaryAsset) => `${asset.resourceType}:${asset.publicId}`;

/**
 * The public id inside the part after `upload/`, or null when the file isn't
 * under casho/. Image and video ids carry no extension; raw ids keep theirs.
 */
export function publicIdFromPath(resourceType: CloudinaryResourceType, path: string): string | null {
  const segments = path.split("/");
  const start = segments.indexOf(OWN_ROOT); // a transformation or v123 segment is never exactly "casho"
  if (start === -1) return null;

  let publicId: string;
  try {
    publicId = decodeURIComponent(segments.slice(start).join("/"));
  } catch {
    return null;
  }
  if (resourceType !== "raw") publicId = publicId.replace(/\.[a-z0-9]+$/i, "");

  const parts = publicId.split("/");
  if (parts.length < 2 || parts.some((part) => !part)) return null; // "casho" alone, or "casho//x"
  return publicId;
}

/** Every distinct file of `cloudName` under casho/ mentioned in `text`. */
export function extractCloudinaryAssets(text: string, cloudName: string): CloudinaryAsset[] {
  const found = new Map<string, CloudinaryAsset>();
  for (const [, cloud, type, path] of text.matchAll(URL_RE)) {
    if (cloud !== cloudName) continue;
    const resourceType = type as CloudinaryResourceType;
    const publicId = publicIdFromPath(resourceType, path);
    if (!publicId) continue;
    const asset = { resourceType, publicId };
    found.set(assetKey(asset), asset);
  }
  return [...found.values()];
}

/** A LIKE pattern for "contains `fragment`" (Postgres' default escape is a backslash). */
export const likeContains = (fragment: string) => `%${fragment.replace(/[\\%_]/g, "\\$&")}%`;

/**
 * A LIKE pattern matching every stored URL of the file, however it was
 * encoded: only the leading run of characters URLs never escape is used, so
 * it can match more than the file — the caller re-parses what comes back.
 */
export function referencePattern(asset: CloudinaryAsset): string {
  return likeContains(asset.publicId.match(/^[A-Za-z0-9/_.-]+/)?.[0] ?? OWN_ROOT);
}

/** Groups public ids by resource type, in chunks the Admin API accepts (100 per call). */
export function deletionBatches(assets: CloudinaryAsset[], size = 100) {
  const byType = new Map<CloudinaryResourceType, string[]>();
  for (const asset of assets) byType.set(asset.resourceType, [...(byType.get(asset.resourceType) ?? []), asset.publicId]);

  const batches: { resourceType: CloudinaryResourceType; publicIds: string[] }[] = [];
  for (const [resourceType, ids] of byType) {
    for (let i = 0; i < ids.length; i += size) batches.push({ resourceType, publicIds: ids.slice(i, i + size) });
  }
  return batches;
}
