/**
 * Spreadsheet output for leads (pure): the filtered-list export, the import
 * template and an import's error report. CSV is UTF-8 with a BOM so Excel
 * keeps Arabic; every cell is guarded against formula injection.
 */
import { IMPORT_ROW_META, PRIORITY_META, SOURCE_LABELS, STATUS_META } from "./constants";
import { IMPORT_FIELDS, TEMPLATE_HEADERS } from "./import";

export type Cell = string | number | null;

export function csvCell(v: Cell) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  const safe = /^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export const toCsv = (rows: Cell[][]) => `﻿${rows.map((r) => r.map(csvCell).join(",")).join("\r\n")}`;

/** Same guard for xlsx cells (Excel evaluates "=…" strings typed into cells by users of the file). */
export const xlsxSafe = (rows: Cell[][]) => rows.map((r) => r.map((v) => (typeof v === "string" && /^[=+\-@]/.test(v) && Number.isNaN(Number(v)) ? `'${v}` : v)));

export function attachment(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 16).replace("T", " ") : null);

export type ExportLead = {
  businessName: string;
  ownerName: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  category: string | null;
  city: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  source: keyof typeof SOURCE_LABELS | null;
  sourceDetails: string | null;
  status: keyof typeof STATUS_META;
  priority: keyof typeof PRIORITY_META;
  score: number;
  repName: string | null;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  createdAt: Date;
  convertedAt: Date | null;
  lostReason: string | null;
};

export const EXPORT_HEADERS = [
  "اسم النشاط",
  "صاحب النشاط",
  "الموبايل",
  "واتساب",
  "الإيميل",
  "المجال",
  "المدينة",
  "الموقع",
  "إنستجرام",
  "فيسبوك",
  "المصدر",
  "تفاصيل المصدر",
  "الحالة",
  "الأولوية",
  "التقييم",
  "المندوب",
  "آخر تواصل (UTC)",
  "المتابعة الجاية (UTC)",
  "اتضاف (UTC)",
  "اتحوّل (UTC)",
  "سبب الخسارة",
];

export function exportRows(leads: ExportLead[]): Cell[][] {
  return [
    EXPORT_HEADERS,
    ...leads.map((l) => [
      l.businessName,
      l.ownerName,
      l.phone,
      l.whatsapp,
      l.email,
      l.category,
      l.city,
      l.website,
      l.instagram,
      l.facebook,
      l.source ? SOURCE_LABELS[l.source] : null,
      l.sourceDetails,
      STATUS_META[l.status].label,
      PRIORITY_META[l.priority].label,
      l.score,
      l.repName,
      day(l.lastContactedAt),
      day(l.nextFollowUpAt),
      day(l.createdAt),
      day(l.convertedAt),
      l.lostReason,
    ]),
  ];
}

/** Template: the headers the importer maps on its own. */
export const templateRows = (): Cell[][] => [TEMPLATE_HEADERS];

export const TEMPLATE_NOTES: Cell[][] = [
  ["العمود", "مطلوب؟", "ملاحظات"],
  ...IMPORT_FIELDS.map((f) => [
    f.label,
    f.required ? "مطلوب" : "اختياري",
    f.key === "phone"
      ? "موبايل مصري 01xxxxxxxxx أو رقم دولي بـ +"
      : f.key === "source"
        ? "إنستجرام، فيسبوك، تيك توك، خرائط جوجل، الموقع، ترشيح، معرض، تواصل مباشر، زيارة ميدانية، أخرى"
        : f.key === "businessSize"
          ? "بادئ، صغير، متوسط، كبير"
          : f.key === "city"
            ? "اسم المحافظة بالعربي أو الإنجليزي"
            : "",
  ]),
  [],
  ["الصف الأول لازم يكون أسماء الأعمدة. أول شيت بس هو اللي بيتقري. الحد الأقصى 5000 صف و 5 ميجا."],
];

export function errorReportRows(rows: { rowNumber: number; status: keyof typeof IMPORT_ROW_META; errors: string[]; data: unknown }[]): Cell[][] {
  const fields = IMPORT_FIELDS.map((f) => f.key);
  return [
    ["الصف في الملف", "النتيجة", "السبب", ...IMPORT_FIELDS.map((f) => f.label)],
    ...rows.map((r) => {
      const d = (r.data ?? {}) as Record<string, unknown>;
      // Data row 1 is sheet row 2 (row 1 holds the headers).
      return [r.rowNumber + 1, IMPORT_ROW_META[r.status].label, r.errors.join(" · "), ...fields.map((k) => (d[k] == null ? null : String(d[k])))];
    }),
  ];
}
