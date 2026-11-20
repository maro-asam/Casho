import { createHash } from "crypto";

/** Cloudinary upload signature: every signed param sorted by name, "k=v" joined by "&", + secret, SHA-1. */
export function cloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}
