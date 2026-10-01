/** Browser-side unsigned upload to Cloudinary. Returns the secure URL. */
export async function uploadImageToCloudinary(file: File, folder: string, maxMb = 5) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("رفع الصور مش متظبط حاليًا، استخدم رابط.");
  if (!file.type.startsWith("image/")) throw new Error("الملف ده مش صورة.");
  if (file.size > maxMb * 1024 * 1024) throw new Error(`الصورة أكبر من ${maxMb} ميجا.`);

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
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
