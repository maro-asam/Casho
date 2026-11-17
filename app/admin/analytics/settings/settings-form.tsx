"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { appleButton } from "@/components/saas-page";
import { DeleteAccountAnalyticsAction, DeleteVisitorDataAction, SaveAnalyticsSettingsAction, type AnalyticsSettingsInput } from "@/actions/admin/analytics.actions";
import type { AnalyticsSettingsValue } from "@/lib/analytics/settings";

type Values = Omit<AnalyticsSettingsValue, "updatedAt" | "updatedById">;

const nf = new Intl.NumberFormat("ar-EG");
const field = "apple-field h-11 w-full px-3 text-[15px] text-foreground disabled:opacity-60";

function Group({ title, footer, children }: { title: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-5 text-[13px] font-semibold text-muted-foreground">{title}</h2>
      <div className="apple-card apple-rows overflow-hidden [--row-inset:20px]">{children}</div>
      {footer && <p className="px-5 text-[12px] leading-[17px] text-muted-foreground">{footer}</p>}
    </section>
  );
}

function Toggle({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 px-5 py-2.5">
      <span className="min-w-0">
        <span className="block text-[15px]">{label}</span>
        {hint && <span className="block text-[12px] leading-[17px] text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="apple-switch" aria-label={label} />
    </label>
  );
}

function NumberRow({ label, hint, value, onChange, min, max, suffix, disabled }: { label: string; hint?: string; value: number; onChange: (v: number) => void; min: number; max: number; suffix: string; disabled?: boolean }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 px-5 py-2.5">
      <span className="min-w-0">
        <span className="block text-[15px]">{label}</span>
        {hint && <span className="block text-[12px] leading-[17px] text-muted-foreground">{hint}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2 text-[13px] text-muted-foreground">
        <input type="number" min={min} max={max} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="apple-field h-9 w-20 px-2 text-center text-[15px] text-foreground" />
        {suffix}
      </span>
    </label>
  );
}

function ListRow({ label, hint, value, onChange, placeholder, disabled }: { label: string; hint: string; value: string[]; onChange: (v: string[]) => void; placeholder: string; disabled?: boolean }) {
  return (
    <label className="block space-y-1.5 px-5 py-3">
      <span className="block text-[15px]">{label}</span>
      <span className="block text-[12px] leading-[17px] text-muted-foreground">{hint}</span>
      <textarea
        dir="ltr"
        rows={3}
        disabled={disabled}
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        placeholder={placeholder}
        className="apple-field w-full px-3 py-2 font-mono text-[13px] text-foreground"
      />
    </label>
  );
}

export function SettingsForm({ initial, readOnly, rows }: { initial: Values; readOnly: boolean; rows: { sessions: number; pageviews: number; events: number } | null }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof Values>(key: K) => (value: Values[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);

  const save = () =>
    start(async () => {
      const input: AnalyticsSettingsInput = {
        ...v,
        excludedPaths: v.excludedPaths.map((s) => s.trim()).filter(Boolean),
        excludedQueryParams: v.excludedQueryParams.map((s) => s.trim()).filter(Boolean),
        internalIps: v.internalIps.map((s) => s.trim()).filter(Boolean),
      };
      const res = await SaveAnalyticsSettingsAction(input);
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message ?? "اتحفظت");
      router.refresh();
    });

  const off = readOnly || pending;

  return (
    <div className="apple-form space-y-8">
      <Group title="التتبع" footer="لما التتبع يقف، عداد زيارات المتاجر للتجار بيفضل شغال (عدد بس، من غير أي بيانات عن الزائر).">
        <Toggle label="تشغيل التحليلات" hint="قفلها بيوقف جمع أي بيانات جديدة فورًا (خلال دقايق)." checked={v.enabled} onChange={set("enabled")} disabled={off} />
        <Toggle label="موقع كاشو" hint="casho.store وصفحات التسجيل والدخول" checked={v.trackMarketing} onChange={set("trackMarketing")} disabled={off || !v.enabled} />
        <Toggle label="لوحة التاجر" hint="الصفحات اللي التجار بيفتحوها في الداشبورد" checked={v.trackApp} onChange={set("trackApp")} disabled={off || !v.enabled} />
        <Toggle label="متاجر التجار" hint="زوار كل المتاجر (كل متجر لوحده)" checked={v.trackStorefronts} onChange={set("trackStorefronts")} disabled={off || !v.enabled} />
      </Group>

      <Group
        title="الموافقة والخصوصية"
        footer="«حسب البلد» بيسأل زوار الاتحاد الأوروبي وبريطانيا وسويسرا بس (GDPR) ويقيس الباقي من غير سؤال، لأن البيانات مجهولة (رقم عشوائي، من غير IP). «اسأل الكل» مناسب لو عايز أعلى درجة حذر — بس هيقلل الأرقام."
      >
        <label className="flex min-h-12 items-center justify-between gap-4 px-5 py-2.5">
          <span className="text-[15px]">طلب الموافقة</span>
          <select value={v.consentMode} disabled={off} onChange={(e) => set("consentMode")(e.target.value as Values["consentMode"])} className="apple-field h-10 w-48 px-3 text-[15px]">
            <option value="REGION">حسب البلد (GDPR)</option>
            <option value="BANNER">اسأل كل الزوار</option>
            <option value="NONE">من غير سؤال</option>
          </select>
        </label>
        <Toggle label="احترام Do Not Track" hint="المتصفحات اللي باعتة DNT أو Global Privacy Control مش بتتقاس خالص." checked={v.respectDnt} onChange={set("respectDnt")} disabled={off} />
        <Toggle label="استبعاد الفريق" hint="الأدمن والمبيعات (أي متصفح فتح /admin أو /sales) مش بيتحسبوا. أصحاب المتاجر على متاجرهم مش بيتحسبوا دايمًا." checked={v.excludeTeam} onChange={set("excludeTeam")} disabled={off} />
        <ListRow label="IPs داخلية" hint="سطر لكل IP أو نطاق IPv4 (مثال 41.33.0.0/16). الزيارات منها بتتشال قبل ما تتسجل، والـ IP نفسه عمره ما بيتخزن." value={v.internalIps} onChange={set("internalIps")} placeholder="41.33.10.5" disabled={off} />
      </Group>

      <Group title="الجلسات والاحتفاظ بالبيانات" footer="البيانات القديمة بتتمسح تلقائيًا كل ساعة (مع cron التجديد). قصّر المدة = بيانات أقل محفوظة ومساحة أقل في قاعدة البيانات.">
        <NumberRow label="مهلة انتهاء الزيارة" hint="من غير نشاط المدة دي = زيارة جديدة" value={v.sessionTimeoutMin} onChange={set("sessionTimeoutMin")} min={5} max={240} suffix="دقيقة" disabled={off} />
        <NumberRow label="«نشط دلوقتي» يعني" hint="آخر نشاط خلال" value={v.realtimeWindowMin} onChange={set("realtimeWindowMin")} min={1} max={30} suffix="دقيقة" disabled={off} />
        <NumberRow label="الصفحات والأحداث والنقرات" hint="التفاصيل الخام (heatmaps، الرحلات، الأحداث)" value={v.rawRetentionDays} onChange={set("rawRetentionDays")} min={7} max={730} suffix="يوم" disabled={off} />
        <NumberRow label="ملخص الزيارات وربط الحسابات" hint="الأرقام العامة والمصادر والنسب للحسابات" value={v.sessionRetentionDays} onChange={set("sessionRetentionDays")} min={30} max={1095} suffix="يوم" disabled={off} />
      </Group>

      <Group title="الصفحات والروابط" footer="أسماء الباراميترات الحساسة (token, email, phone, code, password…) ومعرّفات الإعلانات (fbclid, gclid) بتتشال دايمًا. UTM بتتقرا للمصدر ومش بتتخزن مع الصفحة.">
        <ListRow label="صفحات مستبعدة" hint="سطر لكل بادئة مسار. أي صفحة تبدأ بيها مش بتتسجل خالص (لا مشاهدة ولا نقرات)." value={v.excludedPaths} onChange={set("excludedPaths")} placeholder="/checkout/success" disabled={off} />
        <ListRow label="باراميترات مستبعدة" hint="سطر لكل اسم — بتتشال من أي رابط بيتسجل." value={v.excludedQueryParams} onChange={set("excludedQueryParams")} placeholder="ref_id" disabled={off} />
      </Group>

      <Group title="الـ Heatmaps" footer="بنسجل مكان النقرة والعنصر بس — من غير تسجيل شاشة ولا قيم حقول. صفحات لوحة التاجر خاصة، فمقفولة افتراضيًا.">
        <Toggle label="جمع أماكن النقرات" checked={v.heatmapsEnabled} onChange={set("heatmapsEnabled")} disabled={off || !v.trackClicks} />
        <NumberRow label="نسبة الزيارات" hint="لو الزيارات كتير، قلّلها توفر في قاعدة البيانات" value={v.heatmapSampleRate} onChange={set("heatmapSampleRate")} min={1} max={100} suffix="٪" disabled={off || !v.heatmapsEnabled} />
        <Toggle label="صفحات لوحة التاجر كمان" hint="النقرات جوه الداشبورد (من غير أي نصوص — بس مكان النقرة والعنصر)." checked={v.heatmapPrivatePages} onChange={set("heatmapPrivatePages")} disabled={off || !v.heatmapsEnabled} />
      </Group>

      <Group title="الأحداث اللي بتتسجل">
        <Toggle label="النقرات" hint="الضغطات على العناصر (للـ heatmaps والعناصر الأكتر ضغطًا). ضغطات أزرار CTA بتتسجل دايمًا." checked={v.trackClicks} onChange={set("trackClicks")} disabled={off} />
        <Toggle label="عمق السكرول" checked={v.trackScroll} onChange={set("trackScroll")} disabled={off} />
        <Toggle label="الفورمز" hint="بدأ يملأ / أرسل — من غير أي قيمة أو اسم حقل." checked={v.trackForms} onChange={set("trackForms")} disabled={off} />
        <Toggle label="الأخطاء والطلبات الفاشلة" checked={v.trackErrors} onChange={set("trackErrors")} disabled={off} />
        <Toggle label="سرعة الصفحات (Web Vitals)" checked={v.trackVitals} onChange={set("trackVitals")} disabled={off} />
        <Toggle label="أحداث مخصصة" hint="اللي بتتبعت من الكود بـ trackEvent()" checked={v.trackCustomEvents} onChange={set("trackCustomEvents")} disabled={off} />
      </Group>

      {rows && (
        <p className="px-5 text-[12px] text-muted-foreground tabular-nums">
          محفوظ دلوقتي: {nf.format(rows.sessions)} زيارة · {nf.format(rows.pageviews)} مشاهدة صفحة · {nf.format(rows.events)} حدث.
        </p>
      )}

      {!readOnly && (
        <div className="sticky bottom-4 z-10 flex justify-end">
          <button type="button" onClick={save} disabled={pending || !dirty} className={`${appleButton.filled} shadow-lg`}>
            {pending ? "بنحفظ…" : "حفظ الإعدادات"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Data-subject requests: delete one visitor's data, or everything linked to an account. */
export function DataTools() {
  const [visitor, setVisitor] = useState("");
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error ?? "حصل خطأ");
      else toast.success(res.message ?? "اتمسح");
    });

  return (
    <section className="apple-form space-y-2">
      <h2 className="px-5 text-[13px] font-semibold text-muted-foreground">طلبات حذف البيانات</h2>
      <div className="apple-card apple-rows overflow-hidden [--row-inset:20px]">
        <div className="space-y-2 px-5 py-3">
          <p className="text-[15px]">حذف بيانات حساب</p>
          <p className="text-[12px] text-muted-foreground">كل الزيارات والأحداث المربوطة بحساب كاشو ده وبالمتصفحات اللي سجّل منها. مش بيأثر على الحساب نفسه.</p>
          <div className="flex gap-2">
            <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="merchant@example.com" className={field} aria-label="إيميل الحساب" />
            <button
              type="button"
              disabled={pending || !email}
              onClick={() => confirm(`تمسح كل بيانات التحليلات لـ ${email}؟ مفيش رجوع.`) && run(() => DeleteAccountAnalyticsAction(email))}
              className={appleButton.destructive}
            >
              امسح
            </button>
          </div>
        </div>
        <div className="space-y-2 px-5 py-3">
          <p className="text-[15px]">حذف بيانات زائر</p>
          <p className="text-[12px] text-muted-foreground">برقم الزائر (أول جزء في cookie اسمها _ca، أو _cs_… في المتاجر).</p>
          <div className="flex gap-2">
            <input dir="ltr" value={visitor} onChange={(e) => setVisitor(e.target.value)} placeholder="Visitor id" className={field} aria-label="رقم الزائر" />
            <button
              type="button"
              disabled={pending || !visitor}
              onClick={() => confirm("تمسح كل بيانات الزائر ده؟ مفيش رجوع.") && run(() => DeleteVisitorDataAction(visitor))}
              className={appleButton.destructive}
            >
              امسح
            </button>
          </div>
        </div>
      </div>
      <p className="px-5 text-[12px] text-muted-foreground">كل حذف بيتسجل في سجل الأمان.</p>
    </section>
  );
}
