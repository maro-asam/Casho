/**
 * Import Center rules (pure, unit-tested; shared by the browser wizard and the
 * server). The browser parses the file and maps its columns; the server
 * re-validates every row with the same schema — nothing the browser says is
 * trusted.
 *
 * Duplicates: a row's key is its normalized phone (and its email when it has
 * one). A key already used earlier in the file → DUPLICATE_FILE; a key that
 * belongs to a live lead in Casho → DUPLICATE_EXISTING.
 */
import { leadFieldsSchema, type LeadFields } from "@/validations/leads.schema";
import { normalizePhone } from "./normalize";

export const IMPORT_LIMITS = {
  /** Bytes — checked in the browser before parsing. */
  maxFileSize: 5 * 1024 * 1024,
  maxRows: 5000,
  maxColumns: 60,
  /** Rows per upload request (well under the 1 MB server-action body limit). */
  chunkSize: 250,
  /** Rows written per import batch (one transaction each). */
  batchSize: 150,
  maxCellLength: 500,
} as const;

export const IMPORT_EXTENSIONS = ["csv", "xlsx", "xls"] as const;
export type ImportFileType = (typeof IMPORT_EXTENSIONS)[number];

export const IMPORT_FIELDS = [
  { key: "businessName", label: "اسم النشاط", required: true, aliases: ["business name", "business", "company", "store", "shop", "brand", "اسم النشاط", "النشاط", "اسم المحل", "المحل", "اسم المتجر", "المتجر", "اسم البراند", "البراند", "الشركة"] },
  { key: "ownerName", label: "اسم صاحب النشاط", required: false, aliases: ["owner", "owner name", "contact", "contact name", "name", "full name", "الاسم", "اسم صاحب النشاط", "صاحب النشاط", "المالك", "اسم العميل", "العميل"] },
  { key: "phone", label: "الموبايل", required: true, aliases: ["phone", "mobile", "phone number", "mobile number", "tel", "telephone", "الموبايل", "موبايل", "رقم الموبايل", "التليفون", "تليفون", "رقم التليفون", "الهاتف", "رقم الهاتف"] },
  { key: "whatsapp", label: "واتساب", required: false, aliases: ["whatsapp", "whats app", "wa", "whatsapp number", "واتساب", "واتس", "رقم الواتساب", "الواتساب"] },
  { key: "email", label: "الإيميل", required: false, aliases: ["email", "e-mail", "mail", "email address", "الإيميل", "ايميل", "البريد", "البريد الإلكتروني", "البريد الالكتروني"] },
  { key: "category", label: "مجال النشاط", required: false, aliases: ["category", "industry", "business type", "type", "niche", "المجال", "مجال النشاط", "نوع النشاط", "التصنيف", "القسم"] },
  { key: "city", label: "المدينة / المحافظة", required: false, aliases: ["city", "governorate", "area", "location", "region", "المدينة", "المحافظة", "المنطقة", "العنوان", "مكان"] },
  { key: "website", label: "الموقع", required: false, aliases: ["website", "site", "url", "web", "الموقع", "موقع", "الويب سايت", "رابط الموقع"] },
  { key: "instagram", label: "إنستجرام", required: false, aliases: ["instagram", "insta", "ig", "إنستجرام", "انستجرام", "انستا", "إنستا"] },
  { key: "facebook", label: "فيسبوك", required: false, aliases: ["facebook", "fb", "facebook page", "فيسبوك", "فيس بوك", "فيس", "صفحة الفيسبوك"] },
  { key: "businessSize", label: "حجم النشاط", required: false, aliases: ["size", "business size", "company size", "الحجم", "حجم النشاط"] },
  { key: "source", label: "المصدر", required: false, aliases: ["source", "lead source", "channel", "المصدر", "مصدر الليد", "القناة"] },
  { key: "sourceDetails", label: "تفاصيل المصدر", required: false, aliases: ["source details", "campaign", "details", "تفاصيل المصدر", "الحملة"] },
  { key: "notes", label: "ملاحظات", required: false, aliases: ["notes", "note", "comment", "comments", "remarks", "ملاحظات", "ملاحظة", "تعليق"] },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];
/** Column header → field ("" = ignore the column). */
export type ColumnMapping = Record<string, ImportFieldKey | "">;

const foldHeader = (h: string) =>
  h
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[_\-.:*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Best guess for each header; every field is used at most once (first matching column wins). */
export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();
  for (const header of headers) {
    const h = foldHeader(header);
    const field = IMPORT_FIELDS.find(
      (f) => !used.has(f.key) && (foldHeader(f.key) === h || foldHeader(f.label) === h || (f.aliases as readonly string[]).some((a) => foldHeader(a) === h)),
    );
    mapping[header] = field?.key ?? "";
    if (field) used.add(field.key);
  }
  return mapping;
}

export function mappingProblems(mapping: ColumnMapping): string[] {
  const problems: string[] = [];
  const counts = new Map<string, number>();
  for (const field of Object.values(mapping)) if (field) counts.set(field, (counts.get(field) ?? 0) + 1);
  for (const f of IMPORT_FIELDS) {
    if (f.required && !counts.get(f.key)) problems.push(`لازم عمود لـ«${f.label}»`);
    if ((counts.get(f.key) ?? 0) > 1) problems.push(`«${f.label}» متحدد لأكتر من عمود`);
  }
  return problems;
}

/** One sheet row → the field values the mapping picks (strings, trimmed, capped). */
export function applyMapping(row: Record<string, unknown>, mapping: ColumnMapping): Partial<Record<ImportFieldKey, string>> {
  const out: Partial<Record<ImportFieldKey, string>> = {};
  for (const [header, field] of Object.entries(mapping)) {
    if (!field) continue;
    const raw = row[header];
    if (raw == null) continue;
    const value = String(raw).trim().slice(0, IMPORT_LIMITS.maxCellLength);
    if (value) out[field] = value;
  }
  return out;
}

/** Labels people type for enum columns, Arabic or English. */
const SIZE_WORDS: Record<string, string> = {
  starting: "STARTING", startup: "STARTING", new: "STARTING", online: "STARTING", "بادئ": "STARTING", "جديد": "STARTING", "اونلاين": "STARTING", "أونلاين": "STARTING",
  small: "SMALL", "صغير": "SMALL", "محل": "SMALL",
  medium: "MEDIUM", "متوسط": "MEDIUM",
  large: "LARGE", big: "LARGE", "كبير": "LARGE", "سلسلة": "LARGE", "براند": "LARGE",
};
const SOURCE_WORDS: Record<string, string> = {
  instagram: "INSTAGRAM", insta: "INSTAGRAM", ig: "INSTAGRAM", "انستجرام": "INSTAGRAM", "إنستجرام": "INSTAGRAM", "انستا": "INSTAGRAM",
  facebook: "FACEBOOK", fb: "FACEBOOK", "فيسبوك": "FACEBOOK", "فيس": "FACEBOOK",
  tiktok: "TIKTOK", "تيك توك": "TIKTOK", "تيكتوك": "TIKTOK",
  "google maps": "GOOGLE_MAPS", google: "GOOGLE_MAPS", maps: "GOOGLE_MAPS", "جوجل": "GOOGLE_MAPS", "خرائط جوجل": "GOOGLE_MAPS",
  website: "WEBSITE", "الموقع": "WEBSITE", "موقع": "WEBSITE",
  referral: "REFERRAL", "ترشيح": "REFERRAL",
  event: "EVENT", "معرض": "EVENT", "ايفنت": "EVENT",
  "cold outreach": "COLD_OUTREACH", cold: "COLD_OUTREACH", "تواصل مباشر": "COLD_OUTREACH",
  "walk in": "WALK_IN", visit: "WALK_IN", "زيارة": "WALK_IN", "زيارة ميدانية": "WALK_IN",
  other: "OTHER", "اخرى": "OTHER", "أخرى": "OTHER",
};

function enumWord(value: string | undefined, words: Record<string, string>, allowed: readonly string[]): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (allowed.includes(v.toUpperCase())) return v.toUpperCase();
  return words[v.toLowerCase()] ?? v; // unknown → kept, so validation names it
}

export type ImportedLead = LeadFields & { notes: string | null };

export type RowCheck = { ok: true; lead: ImportedLead; normalizedPhone: string } | { ok: false; errors: string[] };

/** Validate one mapped row with the same schema as the add-lead form. */
export function checkImportRow(values: Partial<Record<ImportFieldKey, string>>): RowCheck {
  const input = {
    ...values,
    businessSize: enumWord(values.businessSize, SIZE_WORDS, ["STARTING", "SMALL", "MEDIUM", "LARGE"]),
    source: enumWord(values.source, SOURCE_WORDS, ["INSTAGRAM", "FACEBOOK", "TIKTOK", "GOOGLE_MAPS", "WEBSITE", "REFERRAL", "EVENT", "COLD_OUTREACH", "WALK_IN", "OTHER"]),
  };
  const parsed = leadFieldsSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => {
      const key = String(i.path[0] ?? "");
      if (key === "businessSize") return "حجم النشاط مش من القيم المعروفة";
      if (key === "source") return "المصدر مش من القيم المعروفة";
      return i.message;
    });
    return { ok: false, errors: [...new Set(errors)] };
  }
  const notes = values.notes?.trim().slice(0, 2000) || null;
  return { ok: true, lead: { ...parsed.data, notes }, normalizedPhone: normalizePhone(parsed.data.phone)! };
}

/** Keys a row is compared by. */
export const rowKeys = (r: { normalizedPhone: string | null; email: string | null }) =>
  [r.normalizedPhone ? `p:${r.normalizedPhone}` : null, r.email ? `e:${r.email}` : null].filter((k): k is string => !!k);

/** Indexes (in input order) of rows whose phone or email already appeared earlier in the file. */
export function inFileDuplicates(rows: { normalizedPhone: string | null; email: string | null }[]): Set<number> {
  const seen = new Set<string>();
  const dupes = new Set<number>();
  rows.forEach((r, i) => {
    const keys = rowKeys(r);
    if (keys.some((k) => seen.has(k))) dupes.add(i);
    else keys.forEach((k) => seen.add(k));
  });
  return dupes;
}

/** FILL_BLANKS: the fields the existing lead is missing that the row has. Never overwrites a value. */
export function fillBlanks<T extends Record<string, unknown>>(existing: T, incoming: Partial<T>, keys: (keyof T)[]): Partial<T> {
  const patch: Partial<T> = {};
  for (const k of keys) {
    const cur = existing[k];
    const next = incoming[k];
    if ((cur === null || cur === undefined || cur === "") && next !== null && next !== undefined && next !== "") patch[k] = next;
  }
  return patch;
}

export const FILLABLE_KEYS = [
  "ownerName",
  "whatsapp",
  "email",
  "category",
  "city",
  "website",
  "instagram",
  "facebook",
  "businessSize",
  "source",
  "sourceDetails",
] as const;

export function fileTypeOf(name: string): ImportFileType | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return (IMPORT_EXTENSIONS as readonly string[]).includes(ext) ? (ext as ImportFileType) : null;
}

/** Template headers, in the order the template lists them. */
export const TEMPLATE_HEADERS = IMPORT_FIELDS.map((f) => f.label);
