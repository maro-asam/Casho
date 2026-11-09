"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateDomainSettingsAction } from "@/actions/admin/domains.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { sellPrice } from "@/lib/domains/pricing";
import type { Registrant } from "@/lib/domains/registrant";

type Initial = {
  enabled: boolean;
  /** Piasters per USD. */
  usdRate: number;
  markupBps: number;
  registrant: Registrant | null;
};

const CONTACT_FIELDS: { key: keyof Registrant; label: string; placeholder?: string; ltr?: boolean; optional?: boolean }[] = [
  { key: "firstName", label: "الاسم الأول", placeholder: "Mohamed", ltr: true },
  { key: "lastName", label: "اسم العائلة", placeholder: "Ali", ltr: true },
  { key: "companyName", label: "اسم الشركة", placeholder: "Casho", ltr: true, optional: true },
  { key: "email", label: "البريد", placeholder: "domains@casho.store", ltr: true },
  { key: "phone", label: "الموبايل (دولي)", placeholder: "+201001234567", ltr: true },
  { key: "address1", label: "العنوان", placeholder: "12 Street, District", ltr: true },
  { key: "city", label: "المدينة", placeholder: "Cairo", ltr: true },
  { key: "state", label: "المحافظة", placeholder: "Cairo", ltr: true },
  { key: "zip", label: "الرمز البريدي", placeholder: "11511", ltr: true },
  { key: "country", label: "الدولة (كود)", placeholder: "EG", ltr: true },
];

const egp = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 });

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function DomainSettingsForm({ initial, registrarReady }: { initial: Initial; registrarReady: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [rate, setRate] = useState(String(initial.usdRate / 100));
  const [markup, setMarkup] = useState(String(initial.markupBps / 100));
  const [contact, setContact] = useState<Record<string, string>>(() => {
    const c = initial.registrant ?? {};
    return Object.fromEntries(CONTACT_FIELDS.map((f) => [f.key, String((c as Record<string, unknown>)[f.key] ?? (f.key === "country" ? "EG" : ""))]));
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const rateNum = Number(rate);
  const markupNum = Number(markup);
  const sample =
    Number.isFinite(rateNum) && rateNum > 0 && Number.isFinite(markupNum) && markupNum >= 0
      ? sellPrice(12.03, { usdRate: Math.round(rateNum * 100), markupBps: Math.round(markupNum * 100) })
      : null;

  function save() {
    start(async () => {
      try {
        const res = await updateDomainSettingsAction({
          enabled,
          usdRate: Number(rate),
          markupPercent: Number(markup),
          registrant: { ...contact, companyName: contact.companyName || undefined },
        });
        setErrors(res.fieldErrors ?? {});
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error && error.message !== "Unauthorized" ? error.message : "حصل خطأ، جرّب تاني");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="apple-card apple-rows overflow-hidden [--row-inset:20px]">
        <label className="flex cursor-pointer items-start justify-between gap-6 px-5 py-4">
          <span>
            <span className="block text-[15px] font-medium">التجار يقدروا يشتروا دومينات</span>
            <span className="mt-1 block text-[13px] leading-[18px] text-muted-foreground">
              بيظهر «اشتري دومين» في صفحة الدومين. التجديد للدومينات اللي اتباعت بيكمّل حتى لو قفلته.
              {!registrarReady && " — VERCEL_API_TOKEN مش متظبط على السيرفر، فالبيع مش هيظهر لحد ما يتظبط."}
            </span>
          </span>
          <Switch aria-label="التجار يقدروا يشتروا دومينات" checked={enabled} onCheckedChange={setEnabled} />
        </label>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="usdRate">سعر الدولار (جنيه)</Label>
            <Input id="usdRate" inputMode="decimal" dir="ltr" value={rate} onChange={(e) => setRate(e.target.value)} />
            <FieldError message={errors.usdRate} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="markup">الهامش فوق سعر Vercel (%)</Label>
            <Input id="markup" inputMode="decimal" dir="ltr" value={markup} onChange={(e) => setMarkup(e.target.value)} />
            <FieldError message={errors.markupPercent} />
          </div>
          <p className="text-[13px] leading-[18px] text-muted-foreground sm:col-span-2">
            الهامش بيغطي عمولة البنك على الدفع بالدولار وأي حركة في السعر. السعر بيتقرّب لأقرب ٥ جنيه لفوق.
            {sample !== null && (
              <>
                {" "}
                مثال: <span dir="ltr">.com</span> بـ 12.03$ هيتباع بـ <span className="font-semibold text-foreground">{egp.format(sample / 100)}</span>.
              </>
            )}
          </p>
        </div>
      </section>

      <section className="apple-card space-y-4 p-5">
        <div className="space-y-0.5">
          <h2 className="text-[17px] font-semibold">بيانات المسجّل</h2>
          <p className="text-[13px] leading-[18px] text-muted-foreground">
            بتتبعت للـ registry مع كل دومين (بيانات كاشو، مش التاجر). بالإنجليزي، ولازم تكون حقيقية — الـ registry ممكن يبعت إيميل تأكيد.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CONTACT_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`registrant-${f.key}`}>
                {f.label}
                {f.optional && <span className="font-normal text-muted-foreground"> (اختياري)</span>}
              </Label>
              <Input
                id={`registrant-${f.key}`}
                dir={f.ltr ? "ltr" : undefined}
                placeholder={f.placeholder}
                value={contact[f.key] ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, [f.key]: e.target.value }))}
              />
              <FieldError message={errors[`registrant.${f.key}`]} />
            </div>
          ))}
        </div>
      </section>

      <Button onClick={save} disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        احفظ الإعدادات
      </Button>
    </div>
  );
}
