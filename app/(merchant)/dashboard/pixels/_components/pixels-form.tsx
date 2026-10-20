"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, FlaskConical, Ghost, Infinity as InfinityIcon, Loader2, Lock, Music2, Server, X } from "lucide-react";
import { toast } from "sonner";

import { SaveStorePixelsAction, SendTestPixelEventAction, type PixelsInput } from "@/actions/settings/pixels.actions";
import type { ServerEventResult } from "@/lib/pixels/server";
import { SegmentedButtons, StatusText, appleButton, type PillTone } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { tr, trv } from "@/lib/i18n/dashboard";

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
  { get name() { return tr("زيارة صفحة"); }, code: "PageView" },
  { get name() { return tr("فتح منتج"); }, code: "ViewContent" },
  { get name() { return tr("إضافة للسلة"); }, code: "AddToCart" },
  { get name() { return tr("بدء الدفع"); }, code: "InitiateCheckout" },
  { get name() { return tr("شراء"); }, code: "Purchase" },
];

type Platform = "meta" | "tiktok" | "snap";

const PLATFORMS: { id: Platform; name: string; icon: typeof Ghost; tile: string }[] = [
  { id: "meta", get name() { return tr("فيسبوك وإنستجرام (Meta)"); }, icon: InfinityIcon, tile: "bg-[#0866ff] text-white" },
  { id: "tiktok", get name() { return tr("تيك توك"); }, icon: Music2, tile: "bg-[#111111] text-white dark:bg-[#2c2c2e]" },
  { id: "snap", get name() { return tr("سناب شات"); }, icon: Ghost, tile: "bg-[#fffc00] text-black" },
];

function PlatformTile({ platform, size = "md" }: { platform: (typeof PLATFORMS)[number]; size?: "sm" | "md" }) {
  const Icon = platform.icon;
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center", platform.tile, size === "md" ? "size-11 rounded-[12px]" : "size-[29px] rounded-[7px]")}>
      <Icon className={size === "md" ? "size-6" : "size-[17px]"} strokeWidth={2.2} />
    </span>
  );
}

/** Settings-style inset group. */
function Group({ title, footer, children }: { title?: string; footer?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      {title && <h3 className="px-4 text-[13px] font-semibold text-muted-foreground">{title}</h3>}
      <div className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:16px]">{children}</div>
      {footer && <div className="px-4 text-[13px] leading-[18px] text-muted-foreground">{footer}</div>}
    </section>
  );
}

const INLINE_INPUT =
  "h-11 min-w-0 flex-1 bg-transparent text-end font-mono text-[15px] text-muted-foreground outline-none placeholder:font-sans placeholder:text-(--label-3) focus:text-foreground disabled:opacity-50";

/** iOS form row: label leading, borderless field trailing. */
function InlineField({ id, label, error, children }: { id: string; label: string; error?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-3 px-4">
      <label htmlFor={id} className={cn("shrink-0 text-[15px]", error && "text-(--sys-red)")}>
        {label}
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

function TokenField({
  id,
  label,
  value,
  onChange,
  savedHint,
  cleared,
  onClear,
  disabled,
  invalid,
}: {
  id: string;
  label: string;
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
    <InlineField id={id} label={label} error={invalid}>
      <input
        id={id}
        type="password"
        autoComplete="off"
        dir="ltr"
        value={value}
        disabled={disabled}
        placeholder={hasSaved ? tr("محفوظ {0} — اكتب توكن جديد عشان تغيّره", savedHint) : tr("الصق التوكن هنا")}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        className={INLINE_INPUT}
      />
      {hasSaved && !disabled && (
        <button type="button" onClick={onClear} className="shrink-0 text-[15px] text-(--sys-red)" title={tr("امسح التوكن المحفوظ")}>
          {tr("امسح")}
        </button>
      )}
    </InlineField>
  );
}

function ResultRow({ label, result }: { label: string; result?: { ok: boolean; error?: string } }) {
  if (!result) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-white", result.ok ? "bg-(--sys-green)" : "bg-(--sys-red)")}>
        {result.ok ? <Check className="size-3" strokeWidth={3.5} /> : <X className="size-3" strokeWidth={3.5} />}
      </span>
      <span className="text-[15px]">
        <span className="font-medium">{label}</span> · {result.ok ? tr("الحدث وصل") : tr("فشل — {0}", result.error ?? tr("خطأ غير معروف"))}
      </span>
    </div>
  );
}

export function PixelsForm({ storeId, serverTracking, initial, tokenHints }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [metaToken, setMetaToken] = useState("");
  const [tiktokToken, setTiktokToken] = useState("");
  const [clearMeta, setClearMeta] = useState(false);
  const [clearTiktok, setClearTiktok] = useState(false);
  const [platform, setPlatform] = useState<Platform>("meta");
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const [testResult, setTestResult] = useState<ServerEventResult | null>(null);
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();

  const set = (key: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (error?.field === key) setError(null);
  };

  const dirty = JSON.stringify(values) !== JSON.stringify(initial) || !!metaToken || !!tiktokToken || clearMeta || clearTiktok;
  const canTest = serverTracking && Boolean((tokenHints.meta && !clearMeta) || (tokenHints.tiktok && !clearTiktok));

  function reset() {
    setValues(initial);
    setMetaToken("");
    setTiktokToken("");
    setClearMeta(false);
    setClearTiktok(false);
    setError(null);
  }

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
        // Jump to the platform the bad field belongs to.
        if (result.field?.startsWith("meta")) setPlatform("meta");
        else if (result.field?.startsWith("tiktok")) setPlatform("tiktok");
        else if (result.field?.startsWith("snap")) setPlatform("snap");
        toast.error(trv(result.message));
        return;
      }
      setError(null);
      setMetaToken("");
      setTiktokToken("");
      setClearMeta(false);
      setClearTiktok(false);
      toast.success(tr("اتحفظت إعدادات البيكسل"));
      router.refresh();
    });
  }

  function sendTest() {
    startTest(async () => {
      setTestResult(null);
      const result = await SendTestPixelEventAction(storeId);
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      setTestResult(result.results);
    });
  }

  const serverLocked = !serverTracking;

  // ── Connection status per platform (from what's saved, not the draft) ──
  const status = (p: Platform): { label: string; tone: PillTone } => {
    const pixel = p === "meta" ? initial.metaPixelId : p === "tiktok" ? initial.tiktokPixelId : initial.snapPixelId;
    const server = p === "meta" ? tokenHints.meta : p === "tiktok" ? tokenHints.tiktok : null;
    if (!pixel) return { label: tr("مش مربوط"), tone: "neutral" };
    if (server && serverTracking) return { label: tr("متصفح + سيرفر"), tone: "success" };
    return { label: tr("متصفح بس"), tone: "info" };
  };
  const current = PLATFORMS.find((p) => p.id === platform)!;

  const serverFooter = serverLocked ? (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Lock className="size-3" />
      {tr("متاح في باقة جولد وبلاتينيوم —")}{" "}
      <Link href="/change-plan" className="font-semibold text-primary">
        {tr("رقّي باقتك")}
      </Link>
    </span>
  ) : null;

  return (
    <div className="space-y-10">
      {/* ── Overview: one tile per platform ─────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PLATFORMS.map((p) => {
          const st = status(p.id);
          const active = platform === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => setPlatform(p.id)}
              className={cn(
                "apple-card apple-press flex items-center gap-3 p-4 text-start ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "ring-2 ring-primary",
              )}
            >
              <PlatformTile platform={p} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{p.name}</span>
                <StatusText tone={st.tone}>{st.label}</StatusText>
              </span>
              <ChevronLeft className="size-[18px] shrink-0 text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />
            </button>
          );
        })}
      </div>

      {/* ── Events we send, as a funnel ─────────────────────────── */}
      <section aria-labelledby="events-title" className="apple-card p-5 sm:p-6">
        <h2 id="events-title" className="text-[17px] font-semibold">
          {tr("الأحداث اللي بنبعتها تلقائيًا لكل بيكسل")}
        </h2>
        <ol className="mt-4 flex flex-wrap items-center gap-y-3">
          {EVENTS.map((e, i) => (
            <li key={e.code} className="flex items-center">
              <span className={cn("rounded-[12px] px-3.5 py-2", i === EVENTS.length - 1 ? "bg-(--sys-green)/12" : "bg-(--fill-3)")}>
                <span className="block text-[15px] font-medium">{e.name}</span>
                <span className="block font-mono text-[11px] text-muted-foreground" dir="ltr">
                  {e.code}
                </span>
              </span>
              {i < EVENTS.length - 1 && <ChevronLeft className="mx-1.5 size-4 text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />}
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-4xl text-[13px] leading-5 text-muted-foreground">
          {tr("الشراء بيتحسب لما العميل يأكد طلب كاش عند الاستلام، أو لما الدفع أونلاين ينجح. ولو فعّلت التتبع من السيرفر، نفس الحدث بيتبعت من السيرفر كمان ومنصة الإعلانات بتحسبه مرة واحدة — ده بيرجّع المبيعات اللي البيكسل بيفوّتها بسبب حاجب الإعلانات وأجهزة الآيفون.")}
        </p>
      </section>

      {/* ── Editor: one platform at a time ──────────────────────── */}
      <section aria-labelledby="platform-title" className="space-y-6">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <PlatformTile platform={current} />
            <h2 id="platform-title" className="text-[22px] leading-[28px] font-bold">
              {current.name}
            </h2>
          </div>
          <SegmentedButtons
            label={tr("المنصة")}
            role="tablist"
            value={platform}
            onChange={setPlatform}
            options={[
              ["meta", "Meta"],
              ["tiktok", "TikTok"],
              ["snap", "Snapchat"],
            ]}
          />
        </div>

        <div className="grid max-w-5xl gap-8 lg:grid-cols-2">
          {platform === "meta" && (
            <>
              <Group title={tr("بيكسل المتصفح")} footer={<>{tr("من Events Manager ← مصادر البيانات ← اختار البيكسل ← الإعدادات.")} {tr("رقم من 15 أو 16 خانة تحت اسم البيكسل.")}</>}>
                <InlineField id="meta-pixel" label="Pixel ID" error={error?.field === "metaPixelId"}>
                  <input
                    id="meta-pixel"
                    dir="ltr"
                    inputMode="numeric"
                    value={values.metaPixelId}
                    placeholder="123456789012345"
                    onChange={(e) => set("metaPixelId", e.target.value)}
                    aria-invalid={error?.field === "metaPixelId" || undefined}
                    className={INLINE_INPUT}
                  />
                </InlineField>
              </Group>
              <Group
                title={tr("التتبع من السيرفر (Conversions API)")}
                footer={
                  serverFooter ?? (
                    <>
                      {tr("من نفس صفحة الإعدادات ← Conversions API ← Generate access token.")}{" "}
                      {tr("من تبويب Test events. طول ما هو مكتوب، أحداث السيرفر بتظهر هناك ومش بتتحسب في الإعلانات — امسحه بعد ما تتأكد.")}
                    </>
                  )
                }
              >
                <TokenField
                  id="meta-token"
                  label="Access Token"
                  value={metaToken}
                  onChange={setMetaToken}
                  savedHint={tokenHints.meta}
                  cleared={clearMeta}
                  onClear={() => setClearMeta(true)}
                  disabled={serverLocked}
                  invalid={error?.field === "metaCapiToken"}
                />
                <InlineField id="meta-test" label={tr("Test event code (اختياري)")} error={error?.field === "metaTestEventCode"}>
                  <input
                    id="meta-test"
                    dir="ltr"
                    value={values.metaTestEventCode}
                    placeholder="TEST12345"
                    disabled={serverLocked}
                    onChange={(e) => set("metaTestEventCode", e.target.value)}
                    className={INLINE_INPUT}
                  />
                </InlineField>
              </Group>
            </>
          )}

          {platform === "tiktok" && (
            <>
              <Group title={tr("بيكسل المتصفح")} footer={<>{tr("من TikTok Ads Manager ← Assets ← Events ← Web events ← اختار البيكسل.")} {tr("حروف وأرقام إنجليزي، تحت اسم البيكسل.")}</>}>
                <InlineField id="tiktok-pixel" label="Pixel ID" error={error?.field === "tiktokPixelId"}>
                  <input
                    id="tiktok-pixel"
                    dir="ltr"
                    value={values.tiktokPixelId}
                    placeholder="C4ABCD1234EFGH567890"
                    onChange={(e) => set("tiktokPixelId", e.target.value)}
                    aria-invalid={error?.field === "tiktokPixelId" || undefined}
                    className={INLINE_INPUT}
                  />
                </InlineField>
              </Group>
              <Group
                title={tr("التتبع من السيرفر (Events API)")}
                footer={
                  serverFooter ?? (
                    <>
                      {tr("من إعدادات البيكسل ← Events API ← Generate Access Token.")}{" "}
                      {tr("من تبويب Test events في تيك توك. امسحه بعد ما تتأكد إن الأحداث بتوصل.")}
                    </>
                  )
                }
              >
                <TokenField
                  id="tiktok-token"
                  label="Access Token"
                  value={tiktokToken}
                  onChange={setTiktokToken}
                  savedHint={tokenHints.tiktok}
                  cleared={clearTiktok}
                  onClear={() => setClearTiktok(true)}
                  disabled={serverLocked}
                  invalid={error?.field === "tiktokAccessToken"}
                />
                <InlineField id="tiktok-test" label={tr("Test event code (اختياري)")} error={error?.field === "tiktokTestEventCode"}>
                  <input
                    id="tiktok-test"
                    dir="ltr"
                    value={values.tiktokTestEventCode}
                    placeholder="TEST12345"
                    disabled={serverLocked}
                    onChange={(e) => set("tiktokTestEventCode", e.target.value)}
                    className={INLINE_INPUT}
                  />
                </InlineField>
              </Group>
            </>
          )}

          {platform === "snap" && (
            <Group title={tr("بيكسل المتصفح")} footer={<>{tr("من Snap Ads Manager ← Events Manager ← اختار البيكسل.")}</>}>
              <InlineField id="snap-pixel" label="Pixel ID" error={error?.field === "snapPixelId"}>
                <input
                  id="snap-pixel"
                  dir="ltr"
                  value={values.snapPixelId}
                  placeholder="1a2b3c4d-1234-…"
                  onChange={(e) => set("snapPixelId", e.target.value)}
                  aria-invalid={error?.field === "snapPixelId" || undefined}
                  className={INLINE_INPUT}
                />
              </InlineField>
            </Group>
          )}
        </div>
      </section>

      {/* ── Server test ─────────────────────────────────────────── */}
      <section className="max-w-5xl">
        <Group title={tr("اختبار")}>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span aria-hidden className="grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-(--sys-indigo) text-white">
              <Server className="size-[17px]" />
            </span>
            <span className="min-w-0 flex-1 text-[15px]">{tr("ابعت حدث تجريبي من السيرفر")}</span>
            <button type="button" className={cn(appleButton.tinted, "text-primary")} onClick={sendTest} disabled={!canTest || testing || saving}>
              {testing ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
              {tr("جرّب")}
            </button>
          </div>
          {testResult && (
            <>
              <ResultRow label="Meta" result={testResult.meta} />
              <ResultRow label="TikTok" result={testResult.tiktok} />
              {!testResult.meta && !testResult.tiktok && <p className="px-4 py-3 text-[15px] text-muted-foreground">{tr("مفيش منصة متظبطة للتتبع من السيرفر.")}</p>}
            </>
          )}
        </Group>
      </section>

      {/* ── Floating save bar (glass) ───────────────────────────── */}
      <div
        className={cn(
          "sticky bottom-4 z-20 flex justify-center transition-[opacity,transform] duration-300 ease-(--ease-apple)",
          dirty || error ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <div className="apple-glass flex items-center gap-2 rounded-full p-1.5 ps-5">
          <p className="me-2 text-[13px] text-muted-foreground">
            {error ? <span className="text-(--sys-red)">{trv(error.message)}</span> : tr("عندك تعديلات مش محفوظة")}
          </p>
          <button type="button" className={cn(appleButton.plain, "mx-0 h-10")} onClick={reset} disabled={saving}>
            {tr("تراجع")}
          </button>
          <button type="button" className={cn(appleButton.filled, "h-10")} onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {tr("حفظ")}
          </button>
        </div>
      </div>
    </div>
  );
}
