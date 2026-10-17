"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, FlaskConical, Loader2, Lock, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { SaveStorePixelsAction, SendTestPixelEventAction, type PixelsInput } from "@/actions/settings/pixels.actions";
import type { ServerEventResult } from "@/lib/pixels/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Values = {
  metaPixelId: string;
  tiktokPixelId: string;
  snapPixelId: string;
  metaTestEventCode: string;
  tiktokTestEventCode: string;
};

type Props = {
  storeId: string;
  /** Plan includes server-side tracking (Conversions API). */
  serverTracking: boolean;
  initial: Values;
  tokenHints: { meta: string | null; tiktok: string | null };
};

const EVENTS = [
  { name: "زيارة صفحة", code: "PageView" },
  { name: "فتح منتج", code: "ViewContent" },
  { name: "إضافة للسلة", code: "AddToCart" },
  { name: "بدء الدفع", code: "InitiateCheckout" },
  { name: "شراء", code: "Purchase" },
];

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-5 p-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function TokenInput({
  id,
  value,
  onChange,
  savedHint,
  cleared,
  onClear,
  disabled,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  savedHint: string | null;
  cleared: boolean;
  onClear: () => void;
  disabled: boolean;
  invalid: boolean;
}) {
  const hasSaved = Boolean(savedHint) && !cleared;
  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type="password"
        autoComplete="off"
        dir="ltr"
        value={value}
        disabled={disabled}
        placeholder={hasSaved ? `محفوظ ${savedHint} — اكتب توكن جديد عشان تغيّره` : "الصق التوكن هنا"}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
      />
      {hasSaved && !disabled && (
        <Button type="button" variant="outline" size="icon" onClick={onClear} aria-label="امسح التوكن المحفوظ" title="امسح التوكن المحفوظ">
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}

function ResultLine({ label, result }: { label: string; result?: { ok: boolean; error?: string } }) {
  if (!result) return null;
  return (
    <p className={cn("flex items-start gap-2 text-sm", result.ok ? "text-emerald-600" : "text-destructive")}>
      {result.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
      <span>
        {label}: {result.ok ? "الحدث وصل" : `فشل — ${result.error ?? "خطأ غير معروف"}`}
      </span>
    </p>
  );
}

export function PixelsForm({ storeId, serverTracking, initial, tokenHints }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [metaToken, setMetaToken] = useState("");
  const [tiktokToken, setTiktokToken] = useState("");
  const [clearMeta, setClearMeta] = useState(false);
  const [clearTiktok, setClearTiktok] = useState(false);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const [testResult, setTestResult] = useState<ServerEventResult | null>(null);
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();

  const set = (key: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (error?.field === key) setError(null);
  };

  const canTest = serverTracking && Boolean((tokenHints.meta && !clearMeta) || (tokenHints.tiktok && !clearTiktok));

  function save() {
    startSave(async () => {
      const input: PixelsInput = {
        ...values,
        metaCapiToken: metaToken,
        tiktokAccessToken: tiktokToken,
        clearMetaCapiToken: clearMeta && !metaToken,
        clearTiktokAccessToken: clearTiktok && !tiktokToken,
      };
      const result = await SaveStorePixelsAction(storeId, input);
      if (!result.ok) {
        setError({ field: result.field, message: result.message });
        toast.error(result.message);
        return;
      }
      setError(null);
      setMetaToken("");
      setTiktokToken("");
      setClearMeta(false);
      setClearTiktok(false);
      toast.success("اتحفظت إعدادات البيكسل");
      router.refresh();
    });
  }

  function sendTest() {
    startTest(async () => {
      setTestResult(null);
      const result = await SendTestPixelEventAction(storeId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setTestResult(result.results);
    });
  }

  const serverLocked = !serverTracking;
  const lockedHint = (
    <span className="inline-flex items-center gap-1">
      <Lock className="size-3" />
      متاح في باقة جولد وبلاتينيوم —{" "}
      <Link href="/change-plan" className="font-medium text-primary underline-offset-4 hover:underline">
        رقّي باقتك
      </Link>
    </span>
  );

  return (
    <div className="space-y-4">
      {/* ── What gets tracked ─────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium">الأحداث اللي بنبعتها تلقائيًا لكل بيكسل</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {EVENTS.map((e) => (
            <span key={e.code} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs">
              {e.name} <span className="font-mono text-muted-foreground">{e.code}</span>
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          الشراء بيتحسب لما العميل يأكد طلب كاش عند الاستلام، أو لما الدفع أونلاين ينجح. ولو فعّلت التتبع من السيرفر، نفس الحدث بيتبعت
          من السيرفر كمان ومنصة الإعلانات بتحسبه مرة واحدة — ده بيرجّع المبيعات اللي البيكسل بيفوّتها بسبب حاجب الإعلانات وأجهزة الآيفون.
        </p>
      </section>

      {/* ── Meta ──────────────────────────────────────────────────── */}
      <Section title="فيسبوك وإنستجرام (Meta)" description="من Events Manager ← مصادر البيانات ← اختار البيكسل ← الإعدادات.">
        <Field
          id="meta-pixel"
          label="Pixel ID"
          error={error?.field === "metaPixelId"}
          hint="رقم من 15 أو 16 خانة تحت اسم البيكسل."
        >
          <Input
            id="meta-pixel"
            dir="ltr"
            inputMode="numeric"
            value={values.metaPixelId}
            placeholder="123456789012345"
            onChange={(e) => set("metaPixelId", e.target.value)}
            aria-invalid={error?.field === "metaPixelId" || undefined}
          />
        </Field>
        <Field
          id="meta-token"
          label="Conversions API Access Token"
          error={error?.field === "metaCapiToken"}
          hint={serverLocked ? lockedHint : "من نفس صفحة الإعدادات ← Conversions API ← Generate access token."}
        >
          <TokenInput
            id="meta-token"
            value={metaToken}
            onChange={setMetaToken}
            savedHint={tokenHints.meta}
            cleared={clearMeta}
            onClear={() => setClearMeta(true)}
            disabled={serverLocked}
            invalid={error?.field === "metaCapiToken"}
          />
        </Field>
        <Field
          id="meta-test"
          label="Test event code (اختياري)"
          error={error?.field === "metaTestEventCode"}
          hint="من تبويب Test events. طول ما هو مكتوب، أحداث السيرفر بتظهر هناك ومش بتتحسب في الإعلانات — امسحه بعد ما تتأكد."
        >
          <Input
            id="meta-test"
            dir="ltr"
            value={values.metaTestEventCode}
            placeholder="TEST12345"
            disabled={serverLocked}
            onChange={(e) => set("metaTestEventCode", e.target.value)}
          />
        </Field>
      </Section>

      {/* ── TikTok ────────────────────────────────────────────────── */}
      <Section title="تيك توك" description="من TikTok Ads Manager ← Assets ← Events ← Web events ← اختار البيكسل.">
        <Field
          id="tiktok-pixel"
          label="Pixel ID"
          error={error?.field === "tiktokPixelId"}
          hint="حروف وأرقام إنجليزي، تحت اسم البيكسل."
        >
          <Input
            id="tiktok-pixel"
            dir="ltr"
            value={values.tiktokPixelId}
            placeholder="C4ABCD1234EFGH567890"
            onChange={(e) => set("tiktokPixelId", e.target.value)}
            aria-invalid={error?.field === "tiktokPixelId" || undefined}
          />
        </Field>
        <Field
          id="tiktok-token"
          label="Events API Access Token"
          error={error?.field === "tiktokAccessToken"}
          hint={serverLocked ? lockedHint : "من إعدادات البيكسل ← Events API ← Generate Access Token."}
        >
          <TokenInput
            id="tiktok-token"
            value={tiktokToken}
            onChange={setTiktokToken}
            savedHint={tokenHints.tiktok}
            cleared={clearTiktok}
            onClear={() => setClearTiktok(true)}
            disabled={serverLocked}
            invalid={error?.field === "tiktokAccessToken"}
          />
        </Field>
        <Field
          id="tiktok-test"
          label="Test event code (اختياري)"
          error={error?.field === "tiktokTestEventCode"}
          hint="من تبويب Test events في تيك توك. امسحه بعد ما تتأكد إن الأحداث بتوصل."
        >
          <Input
            id="tiktok-test"
            dir="ltr"
            value={values.tiktokTestEventCode}
            placeholder="TEST12345"
            disabled={serverLocked}
            onChange={(e) => set("tiktokTestEventCode", e.target.value)}
          />
        </Field>
      </Section>

      {/* ── Snapchat ──────────────────────────────────────────────── */}
      <Section title="سناب شات" description="من Snap Ads Manager ← Events Manager ← اختار البيكسل.">
        <Field
          id="snap-pixel"
          label="Pixel ID"
          error={error?.field === "snapPixelId"}
          hint="بالشكل ده: 1a2b3c4d-1234-5678-9abc-1a2b3c4d5e6f"
        >
          <Input
            id="snap-pixel"
            dir="ltr"
            value={values.snapPixelId}
            placeholder="1a2b3c4d-1234-5678-9abc-1a2b3c4d5e6f"
            onChange={(e) => set("snapPixelId", e.target.value)}
            aria-invalid={error?.field === "snapPixelId" || undefined}
          />
        </Field>
      </Section>

      {/* ── Test result ───────────────────────────────────────────── */}
      {testResult && (
        <section className="space-y-1.5 rounded-xl border border-border bg-card p-4">
          <ResultLine label="Meta" result={testResult.meta} />
          <ResultLine label="TikTok" result={testResult.tiktok} />
          {!testResult.meta && !testResult.tiktok && <p className="text-sm text-muted-foreground">مفيش منصة متظبطة للتتبع من السيرفر.</p>}
        </section>
      )}

      {error && !error.field && <p className="text-sm text-destructive">{error.message}</p>}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={sendTest} disabled={!canTest || testing || saving}>
          {testing ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
          ابعت حدث تجريبي من السيرفر
        </Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          حفظ
        </Button>
      </div>
    </div>
  );
}
