import { GetCloudinaryUploadAuthAction } from "@/actions/uploads/cloudinary.actions";

/**
 * Browser-side upload to Cloudinary, signed by the server for the signed-in
 * user (see GetCloudinaryUploadAuthAction). Returns the secure URL.
 * `folder` must look like "casho/uploads/<name>".
 */
export async function uploadImageToCloudinary(file: Blob, folder: string, maxMb = 5) {
  if (!file.type.startsWith("image/")) throw new Error("الملف ده مش صورة.");
  if (file.size > maxMb * 1024 * 1024) throw new Error(`الصورة أكبر من ${maxMb} ميجا.`);

  const auth = await GetCloudinaryUploadAuthAction(folder);
  if (!auth.signed && !auth.uploadPreset) throw new Error("رفع الصور مش متظبط حاليًا، استخدم رابط.");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  if (auth.uploadPreset) fd.append("upload_preset", auth.uploadPreset);
  if (auth.signed) {
    fd.append("api_key", auth.signed.apiKey);
    fd.append("timestamp", String(auth.signed.timestamp));
    fd.append("signature", auth.signed.signature);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${auth.cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });
  const data = await response.json();
  if (!response.ok || !data.secure_url) throw new Error(data?.error?.message || "فشل رفع الصورة");
  return data.secure_url as string;
}

/** Short label for an image URL — the host, never the whole link. */
export function imageSource(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Any file (PDF, ZIP…) for digital products, kept byte-for-byte as a Cloudinary
 * "raw" asset. Returns the secure URL.
 */
export async function uploadFileToCloudinary(file: File, folder: string, maxMb = 10) {
  if (file.size > maxMb * 1024 * 1024) throw new Error(`الملف أكبر من ${maxMb} ميجا — ارفعه على Drive وحط اللينك.`);

  const auth = await GetCloudinaryUploadAuthAction(folder);
  if (!auth.signed && !auth.uploadPreset) throw new Error("رفع الملفات مش متظبط حاليًا، استخدم لينك.");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  if (auth.uploadPreset) fd.append("upload_preset", auth.uploadPreset);
  if (auth.signed) {
    fd.append("api_key", auth.signed.apiKey);
    fd.append("timestamp", String(auth.signed.timestamp));
    fd.append("signature", auth.signed.signature);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${auth.cloudName}/raw/upload`, { method: "POST", body: fd });
  const data = await response.json();
  if (!response.ok || !data.secure_url) throw new Error(data?.error?.message || "فشل رفع الملف");
  return data.secure_url as string;
}
