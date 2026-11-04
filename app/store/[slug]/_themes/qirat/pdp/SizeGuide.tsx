"use client";

import { useId, useState } from "react";
import { Ruler, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { cn } from "@/lib/utils";
import { isNumericSizes, nearestSize, ringSizeFromCircumference, sizeScale, toLatinDigits } from "../lib/qirat";
import { Ornament, QR_PORTAL, num } from "../ui";

type Tab = "ring" | "bracelet" | "necklace";

// Typical necklace lengths and where they sit — the jeweler's standard names.
const NECKLACES = [
  { cm: 40, name: "على الرقبة", note: "قريبة من الرقبة، تحت الذقن بشوية" },
  { cm: 45, name: "عند الترقوة", note: "الطول الأشهر للسلاسل الرفيعة والدلّايات" },
  { cm: 50, name: "تحت الترقوة", note: "مناسبة مع الياقات المفتوحة" },
  { cm: 60, name: "على الصدر", note: "للدلّايات الكبيرة وطبقات السلاسل" },
];

function RingSizer({ sizes }: { sizes: string[] }) {
  const id = useId();
  const [value, setValue] = useState("");
  const mm = Number(toLatinDigits(value).replace(",", "."));
  const result = value ? ringSizeFromCircumference(mm) : null;
  const scale = sizeScale(sizes);
  const match = result && scale ? nearestSize(sizes, scale === "iso" ? result.iso : result.us) : null;

  return (
    <div className="space-y-6">
      <ol className="qr-steps">
        <li>لفّ خيط أو شريط ورق رفيع حوالين صباعك عند العُقلة الأخيرة، مش مشدود ومش واسع.</li>
        <li>علّم مكان ما الطرفين بيتقابلوا، وافرده على مسطرة.</li>
        <li>اكتب الطول بالمليمتر هنا، ونقولك مقاسك.</li>
      </ol>
      <div>
        <label htmlFor={id} className="mb-2 block text-sm font-semibold text-(--qr-ink)">
          محيط صباعك (مم)
        </label>
        <div className="flex items-center gap-3">
          <input id={id} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="مثلًا ٥٤" className="qr-field max-w-40 text-center text-lg" />
          <span className="text-sm text-(--qr-ink-2)">مم</span>
        </div>
        {value && !result && <p className="mt-2 text-sm text-(--qr-error)">اكتب رقم بين ٣٨ و٨٠ مم.</p>}
      </div>
      {result && (
        <div className="qr-sizer-result" aria-live="polite">
          <dl className="grid grid-cols-3 gap-px">
            <div>
              <dt>المقاس الأوروبي</dt>
              <dd>{num(result.iso)}</dd>
            </div>
            <div>
              <dt>المقاس الأمريكي</dt>
              <dd>{num(result.us)}</dd>
            </div>
            <div>
              <dt>القُطر</dt>
              <dd>
                {num(result.diameter)} <small>مم</small>
              </dd>
            </div>
          </dl>
          {match && (
            <p className="mt-4 text-center text-sm text-(--qr-ink)">
              الأقرب ليك من مقاسات القطعة دي: <strong className="qr-serif text-lg">{match}</strong>
            </p>
          )}
        </div>
      )}
      <p className="text-xs leading-6 text-(--qr-ink-2)">لو بين مقاسين خد الأكبر، ولو مش متأكد اسأل المتجر قبل ما تطلب.</p>
    </div>
  );
}

function BraceletGuide() {
  return (
    <div className="space-y-5">
      <ol className="qr-steps">
        <li>لفّ شريط قماش أو خيط حوالين رسغك فوق عضمة الإيد مباشرة.</li>
        <li>قيس الطول بالسنتيمتر.</li>
        <li>زوّد حوالي ١٫٥ لـ ٢ سم عشان الإسورة تتحرك براحة، أو ١ سم لو بتحبها قريبة.</li>
      </ol>
      <p className="text-xs leading-6 text-(--qr-ink-2)">مقاسات الأساور بتختلف من موديل للتاني، فقارن بالأطوال المكتوبة في المنتج.</p>
    </div>
  );
}

function NecklaceGuide() {
  return (
    <ul className="qr-lengths">
      {NECKLACES.map((n, i) => (
        <li key={n.cm} style={{ ["--w" as string]: `${55 + i * 15}%` }}>
          <span className="qr-lengths-arc" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-semibold text-(--qr-ink)">{n.name}</span>
            <span className="block text-xs text-(--qr-ink-2)">{n.note}</span>
          </span>
          <span className="qr-serif shrink-0 text-xl text-(--qr-ink)">
            {num(n.cm)} <small className="text-xs">سم</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The size guide: a ring sizer that turns a measured circumference into the
 *  standard sizes (and the nearest size this piece comes in), plus how to
 *  measure for bracelets and the usual necklace lengths. */
export default function SizeGuide({ sizes }: { sizes: string[] }) {
  // Only used by the (initially closed) sheet, so reading the DOM up front is safe.
  const [dir] = useState<"rtl" | "ltr">(() => (typeof document !== "undefined" && document.querySelector(".theme-qirat")?.getAttribute("dir") === "ltr" ? "ltr" : "rtl"));
  const rings = isNumericSizes(sizes);
  const [tab, setTab] = useState<Tab>(rings ? "ring" : "bracelet");
  const tabs: { id: Tab; label: string }[] = [
    { id: "ring", label: "الخواتم" },
    { id: "bracelet", label: "الأساور" },
    { id: "necklace", label: "السلاسل" },
  ];

  return (
    <Dialog.Root>
      <Dialog.Trigger className="qr-sizelink">
        <Ruler aria-hidden />
        <span className="qr-underline">دليل المقاسات</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(QR_PORTAL, "qr-scrim fixed inset-0 z-50")} />
        <Dialog.Content dir={dir} aria-describedby={undefined} className={cn(QR_PORTAL, "qr-drawer fixed inset-y-0 end-0 z-50 flex w-[min(100vw,28rem)] flex-col bg-(--qr-sheet) outline-none")}>
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--qr-line) px-6">
            <Dialog.Title className="qr-h3">دليل المقاسات</Dialog.Title>
            <Dialog.Close className="qr-icon -me-2" aria-label="إغلاق">
              <X />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
            <div role="tablist" aria-label="نوع القطعة" className="qr-tabs">
              {tabs.map((t) => (
                <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className="qr-tab">
                  {t.label}
                </button>
              ))}
            </div>
            <Ornament className="my-6" />
            <div role="tabpanel">{tab === "ring" ? <RingSizer sizes={sizes} /> : tab === "bracelet" ? <BraceletGuide /> : <NecklaceGuide />}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
