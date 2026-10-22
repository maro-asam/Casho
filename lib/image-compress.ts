/**
 * Browser-side image compression: re-encodes on a canvas, lowering quality
 * first and resolution only when quality alone can't reach the target.
 * Nothing leaves the device.
 */

export const ONE_MB = 1024 * 1024;

export type CompressFormat = "image/webp" | "image/jpeg";

export type CompressOptions = {
  /** Upper bound for the output, in bytes. */
  maxBytes?: number;
  /** Longest side in pixels; larger images are scaled down. */
  maxSide?: number;
  format?: CompressFormat;
};

// Animated GIFs and vector SVGs would be flattened, so they pass through as-is.
const PASSTHROUGH = new Set(["image/gif", "image/svg+xml"]);
const MIN_QUALITY = 0.45;
const GOOD_QUALITY = 0.85;

export function isCompressible(file: Blob) {
  return file.type.startsWith("image/") && !PASSTHROUGH.has(file.type);
}

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Older Safari: fall back to an <img> (it applies EXIF orientation itself).
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } catch {
      throw new Error("مقدرناش نقرأ الصورة دي — جرّب JPG أو PNG.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function renamed(name: string, type: CompressFormat) {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${type === "image/webp" ? "webp" : "jpg"}`;
}

/**
 * Returns a file of at most `maxBytes` (default 1 MB). Files already under the
 * limit — and GIF/SVG, which can't be re-encoded safely — come back unchanged.
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxBytes = ONE_MB, maxSide = 2560, format = "image/webp" } = options;
  if (!isCompressible(file) || file.size <= maxBytes) return file;

  const source = await decode(file);
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("المتصفح مش قادر يضغط الصور.");

  let type: CompressFormat = format;
  let scale = Math.min(1, maxSide / Math.max(width, height));

  try {
    for (let attempt = 0; attempt < 8; attempt++) {
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (type === "image/jpeg") {
        // JPEG has no alpha: transparent areas would turn black.
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      const encode = async (q: number) => {
        const blob = await toBlob(canvas, type, q);
        // Browsers without WebP encoding silently hand back a PNG.
        if (blob && blob.type !== type && type === "image/webp") type = "image/jpeg";
        return blob?.type === type ? blob : null;
      };

      const drawnAs = type;
      let best = await encode(GOOD_QUALITY);
      if (!best) {
        // WebP unsupported: redraw for JPEG at the same scale. Otherwise the
        // canvas was too large to encode, so shrink it.
        if (type !== drawnAs) attempt--;
        else scale *= 0.8;
        continue;
      }
      if (best.size > maxBytes) {
        // Highest quality that still fits.
        let lo = MIN_QUALITY;
        let hi = GOOD_QUALITY;
        best = null;
        for (let i = 0; i < 6; i++) {
          const q = (lo + hi) / 2;
          const blob = await encode(q);
          if (blob && blob.size <= maxBytes) {
            best = blob;
            lo = q;
          } else {
            hi = q;
          }
        }
        if (!best) {
          const floor = await encode(MIN_QUALITY);
          if (floor && floor.size <= maxBytes) best = floor;
        }
      }

      if (best) return new File([best], renamed(file.name, type), { type, lastModified: Date.now() });
      scale *= 0.8;
    }
  } finally {
    if ("close" in source) source.close();
  }
  throw new Error("مقدرناش نصغّر الصورة دي للحجم المطلوب.");
}
