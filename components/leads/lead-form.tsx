"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { LeadBusinessSize, LeadPriority, LeadSource } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appleButton } from "@/components/saas-page";
import { createLeadAction, updateLeadAction } from "@/actions/leads/admin-leads.actions";
import { BUSINESS_CATEGORIES, BUSINESS_SIZES, CITIES, LEAD_SOURCES, PRIORITIES, PRIORITY_META, SIZE_LABELS, SOURCE_LABELS, STATUS_META } from "@/lib/leads/constants";
import { cn } from "@/lib/utils";
import { Field, formValues, useLeadAction } from "./form-kit";
import type { RepOption } from "./admin-lead-actions";

export type LeadFormValues = {
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
  businessSize: LeadBusinessSize | null;
  source: LeadSource | null;
  sourceDetails: string | null;
};

const NONE = "__none";

function EnumSelect<T extends string>({ name, value, onChange, options, placeholder }: { name: string; value: string; onChange: (v: string) => void; options: [T, string][]; placeholder: string }) {
  return (
    <>
      <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)} dir="rtl">
        <SelectTrigger id={name} className="h-11 w-full rounded-[10px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{placeholder}</SelectItem>
          {options.map(([v, label]) => (
            <SelectItem key={v} value={v}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name={name} value={value} />
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="apple-card space-y-4 p-5">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function LeadForm({ mode, leadId, initial, reps = [] }: { mode: "create" | "edit"; leadId?: string; initial?: LeadFormValues; reps?: RepOption[] }) {
  const router = useRouter();
  const [size, setSize] = useState<string>(initial?.businessSize ?? "");
  const [source, setSource] = useState<string>(initial?.source ?? "");
  const [priority, setPriority] = useState<string>("AUTO");
  const [rep, setRep] = useState<string>("");
  const action = mode === "create" ? createLeadAction : updateLeadAction;
  const { submit, pending, errors, last } = useLeadAction(action, (res) => {
    if (res.leadId) router.push(`/admin/leads/${res.leadId}`);
  });
  const v = initial;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        const values = formValues(e);
        submit(mode === "create" ? values : { ...values, leadId });
      }}
      noValidate
    >
      {last && !last.success && last.duplicates && last.duplicates.length > 0 && (
        <div role="alert" className="apple-card flex gap-3 border-s-4 border-(--sys-orange) p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-(--sys-orange)" />
          <div className="min-w-0 space-y-1.5 text-[14px]">
            <p className="font-semibold">{last.message}</p>
            <ul className="space-y-1">
              {last.duplicates.map((d) => (
                <li key={d.id}>
                  <Link href={`/admin/leads/${d.id}`} className="text-primary underline-offset-2 hover:underline">
                    {d.businessName}
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    · {STATUS_META[d.status].label}
                    {d.repName ? ` · عند ${d.repName}` : ""}
                    {d.archived ? " · في الأرشيف" : ""}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">افتح الليد الموجود وكمّل عليه بدل ما يتكرر.</p>
          </div>
        </div>
      )}

      <Group title="النشاط">
        <div className="sm:col-span-2">
          <Field label="اسم النشاط *" name="businessName" error={errors.businessName}>
            <Input id="businessName" name="businessName" defaultValue={v?.businessName} required maxLength={120} className="h-11" autoFocus={mode === "create"} />
          </Field>
        </div>
        <Field label="المجال" name="category" error={errors.category} hint="من القايمة أو اكتب مجال تاني">
          <Input id="category" name="category" list="lead-categories" defaultValue={v?.category ?? ""} maxLength={80} className="h-11" />
          <datalist id="lead-categories">
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="المدينة / المحافظة" name="city" error={errors.city}>
          <Input id="city" name="city" list="lead-cities" defaultValue={v?.city ?? ""} maxLength={80} className="h-11" />
          <datalist id="lead-cities">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="حجم النشاط" name="businessSize" error={errors.businessSize}>
          <EnumSelect name="businessSize" value={size} onChange={setSize} placeholder="مش معروف" options={BUSINESS_SIZES.map((s) => [s, SIZE_LABELS[s]])} />
        </Field>
        <Field label="الموقع" name="website" error={errors.website}>
          <Input id="website" name="website" dir="ltr" defaultValue={v?.website ?? ""} placeholder="example.com" maxLength={300} className="h-11" />
        </Field>
        <Field label="إنستجرام" name="instagram" error={errors.instagram}>
          <Input id="instagram" name="instagram" dir="ltr" defaultValue={v?.instagram ?? ""} placeholder="@handle" maxLength={300} className="h-11" />
        </Field>
        <Field label="فيسبوك" name="facebook" error={errors.facebook}>
          <Input id="facebook" name="facebook" dir="ltr" defaultValue={v?.facebook ?? ""} placeholder="الصفحة أو الرابط" maxLength={300} className="h-11" />
        </Field>
      </Group>

      <Group title="التواصل">
        <Field label="اسم صاحب النشاط" name="ownerName" error={errors.ownerName}>
          <Input id="ownerName" name="ownerName" defaultValue={v?.ownerName ?? ""} maxLength={100} className="h-11" />
        </Field>
        <Field label="الموبايل *" name="phone" error={errors.phone} hint="مصري 01xxxxxxxxx أو دولي بـ +">
          <Input id="phone" name="phone" dir="ltr" inputMode="tel" defaultValue={v?.phone} required maxLength={40} className="h-11" />
        </Field>
        <Field label="واتساب" name="whatsapp" error={errors.whatsapp} hint="لو غير رقم الموبايل">
          <Input id="whatsapp" name="whatsapp" dir="ltr" inputMode="tel" defaultValue={v?.whatsapp ?? ""} maxLength={40} className="h-11" />
        </Field>
        <Field label="الإيميل" name="email" error={errors.email}>
          <Input id="email" name="email" type="email" dir="ltr" defaultValue={v?.email ?? ""} maxLength={254} className="h-11" />
        </Field>
      </Group>

      <Group title={mode === "create" ? "المصدر والمبيعات" : "المصدر"}>
        <Field label="جه منين؟" name="source" error={errors.source}>
          <EnumSelect name="source" value={source} onChange={setSource} placeholder="مش محدد" options={LEAD_SOURCES.map((s) => [s, SOURCE_LABELS[s]])} />
        </Field>
        <Field label="تفاصيل المصدر" name="sourceDetails" error={errors.sourceDetails} hint="اسم الحملة، المعرض، مين رشّحه…">
          <Input id="sourceDetails" name="sourceDetails" defaultValue={v?.sourceDetails ?? ""} maxLength={300} className="h-11" />
        </Field>
        {mode === "create" && (
          <>
            <Field label="الأولوية" name="priority" error={errors.priority} hint="التلقائي بيتحسب من التقييم ويتحدث لوحده">
              <Select value={priority} onValueChange={setPriority} dir="rtl">
                <SelectTrigger id="priority" className="h-11 w-full rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">تلقائي (حسب التقييم)</SelectItem>
                  {PRIORITIES.map((p: LeadPriority) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="priority" value={priority} />
            </Field>
            <Field label="اسنده لمندوب (اختياري)" name="assignRepId" error={errors.assignRepId}>
              <EnumSelect name="assignRepId" value={rep} onChange={setRep} placeholder="من غير مندوب دلوقتي" options={reps.filter((r) => r.active).map((r) => [r.id, r.label])} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="ملاحظات أولية" name="notes" error={errors.notes}>
                <Textarea id="notes" name="notes" rows={3} maxLength={2000} />
              </Field>
            </div>
          </>
        )}
      </Group>

      <div className="flex items-center justify-end gap-2">
        <Link href={leadId ? `/admin/leads/${leadId}` : "/admin/leads/list"} className={cn(appleButton.gray)}>
          إلغاء
        </Link>
        <button type="submit" disabled={pending} className={appleButton.filled}>
          {pending ? "بيتحفظ…" : mode === "create" ? "ضيف الليد" : "احفظ التعديلات"}
        </button>
      </div>
    </form>
  );
}
