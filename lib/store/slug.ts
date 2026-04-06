import { transliterate } from "@/lib/utils";

export function normalizeStoreSlug(value: string) {
  return transliterate(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
