"use server";

import { createHash } from "crypto";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

export type CloudinaryUploadAuth = {
  cloudName: string;
  uploadPreset: string | null;
  /** Present when the server holds API credentials — the upload is then signed. */
  signed: { apiKey: string; timestamp: number; signature: string } | null;
};

const FOLDER_PATTERN = /^casho\/uploads\/[a-z0-9_-]+$/;

/**
 * Signs one upload for a signed-in user. With the upload preset switched to
 * "Signed" in Cloudinary, nobody can upload to our account without this
 * signature (the cloud name + preset are public in the browser bundle).
 * Signatures are valid for one hour (Cloudinary rejects older timestamps).
 */
export async function GetCloudinaryUploadAuthAction(folder: string): Promise<CloudinaryUploadAuth> {
  await requireUserId();

  if (!FOLDER_PATTERN.test(folder)) throw new Error("Invalid upload folder");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error("رفع الصور مش متظبط حاليًا، استخدم رابط.");
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || null;

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiKey || !apiSecret) {
    // Legacy unsigned mode — keeps uploads working until the keys are set.
    console.warn("[cloudinary] CLOUDINARY_API_KEY/SECRET missing — uploads are unsigned");
    return { cloudName, uploadPreset, signed: null };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary signature: every signed param sorted by name, "k=v" joined by "&", + secret, SHA-1.
  const params: Record<string, string> = { folder, timestamp: String(timestamp) };
  if (uploadPreset) params.upload_preset = uploadPreset;
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  return { cloudName, uploadPreset, signed: { apiKey, timestamp, signature } };
}
