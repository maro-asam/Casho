import { cloudinarySignature } from "./sign";

/**
 * Uploads an image from the server — for files that come from people who
 * aren't signed in (a shopper's transfer screenshot), so the browser never
 * gets an upload signature. Signed when the API keys are set, else the
 * (legacy) unsigned preset, like GetCloudinaryUploadAuthAction. Returns the
 * secure URL; throws when uploads aren't set up or Cloudinary refuses the file.
 */
export async function uploadImageFromServer(file: Blob, folder: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || null;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || (!uploadPreset && !(apiKey && apiSecret))) throw new Error("Cloudinary uploads aren't configured");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  if (uploadPreset) fd.append("upload_preset", uploadPreset);
  if (apiKey && apiSecret) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const params: Record<string, string> = { folder, timestamp };
    if (uploadPreset) params.upload_preset = uploadPreset;
    fd.append("api_key", apiKey);
    fd.append("timestamp", timestamp);
    fd.append("signature", cloudinarySignature(params, apiSecret));
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: fd,
    signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.secure_url !== "string") {
    throw new Error(`Cloudinary upload failed: ${data?.error?.message ?? response.status}`);
  }
  return data.secure_url;
}
