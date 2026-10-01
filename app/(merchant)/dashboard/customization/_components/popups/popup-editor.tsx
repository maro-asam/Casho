"use client";

import { useMemo, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Gift,
  ImagePlus,
  Loader2,
  Megaphone,
  Monitor,
  PanelBottom,
  PanelRight,
  RotateCcw,
  Smartphone,
  Square,
  SquareStack,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { CreatePopupAction, SetPopupActiveAction, UpdatePopupAction } from "@/actions/store/popups.actions";
import { PopupView, type PopupStage } from "@/components/storefront/popup-view";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import type { PopupConfig, PopupType } from "@/lib/popups/popup-config";
import { cn } from "@/lib/utils";
import { Segmented } from "../growth/controls";

export type EditorCoupon = { code: string; label: string; isActive: boolean; expiresAt: string | null };
export type EditorPopup = {
  id: string | null;
  name: string;
  type: PopupType;
  isActive: boolean;
  config: PopupConfig;
  startsAt: string | null;
  endsAt: string | null;
};
export type ThemeVars = Record<string, string>;

const TYPES: { value: PopupType; label: string; hint: string; icon: typeof Gift }[] = [
  { value: "discount", label: "كود خصم", hint: "يكشف كود خصم للعميل", icon: Gift },
  { value: "lead", label: "جمع أرقام", hint: "يبني قائمة واتساب", icon: UserPlus },
  { value: "announcement", label: "إعلان", hint: "صورة وزرار لصفحة", icon: Megaphone },
];

const LAYOUTS: { value: PopupConfig["design"]["layout"]; label: string; icon: typeof Square }[] = [
  { value: "center", label: "في النص", icon: Square },
  { value: "split", label: "بصورة جنب", icon: PanelRight },
  { value: "bottom", label: "من تحت", icon: PanelBottom },
  { value: "corner", label: "في الركن", icon: SquareStack },
];

const ACCENTS = ["#111827", "#2563eb", "#db2777", "#16a34a", "#ea580c", "#7c3aed"];

/** ISO → value for <input type="datetime-local"> in the merchant's timezone. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

type Props = {
  storeId: string;
  popup: EditorPopup;
  coupons: EditorCoupon[];
  themeVars: ThemeVars;
};

/** URL-driven: open while `?popup=` is set; closing drops it. */
export function PopupEditorDialog(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function close() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("popup");
    next.delete("template");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        dir="rtl"
        showCloseButton={false}
        className="flex h-[min(52rem,calc(100dvh-2rem))] max-w-[min(80rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(80rem,calc(100%-2rem))]"
      >
        <PopupEditor {...props} onClose={close} />
      </DialogContent>
    </Dialog>
  );
}

function PopupEditor({ storeId, popup, coupons, themeVars, onClose }: Props & { onClose: () => void }) {
  const router = useRouter();
  const isNew = !popup.id;
  const [name, setName] = useState(popup.name);
  const [type, setType] = useState<PopupType>(popup.type);
  const [config, setConfig] = useState<PopupConfig>(popup.config);
  const [startsAt, setStartsAt] = useState(toLocalInput(popup.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(popup.endsAt));
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [stage, setStage] = useState<PopupStage>("offer");
  const [replay, setReplay] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = <S extends keyof PopupConfig>(section: S, patch: Partial<PopupConfig[S]>) =>
    setConfig((c) => ({ ...c, [section]: { ...c[section], ...patch } }));

  const coupon = coupons.find((c) => c.code === config.content.couponCode);
  const previewCountdown = useMemo(() => {
    const dates = [coupon?.expiresAt, endsAt ? fromLocalInput(endsAt) : null].filter(Boolean) as string[];
    return dates.sort()[0] ?? null;
  }, [coupon?.expiresAt, endsAt]);

  function changeType(next: PopupType) {
    setType(next);
    setStage("offer");
    if (next === "lead") update("gate", { requirePhone: true });
    if (next === "announcement") update("gate", { requirePhone: false, askName: false });
    if (next === "discount" && !config.content.couponCode && coupons[0]) update("content", { couponCode: coupons[0].code });
  }

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUploading(true);
      update("content", { image: await uploadImageToCloudinary(file, "casho/uploads/popups") });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  function save(activate: boolean) {
    setError(null);
    startTransition(async () => {
      const input = { name, type, config, startsAt: fromLocalInput(startsAt), endsAt: fromLocalInput(endsAt) };
      const result = popup.id ? await UpdatePopupAction(popup.id, storeId, input) : await CreatePopupAction(storeId, input);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (activate && result.id && !popup.isActive) {
        const toggled = await SetPopupActiveAction(result.id, storeId, true);
        if (!toggled.ok) {
          setError(toggled.message);
          return;
        }
      }
      toast.success(activate ? "النافذة شغّالة في متجرك دلوقتي" : isNew ? "اتحفظت كمسودة" : "اتحفظت التعديلات");
      onClose();
      router.refresh();
    });
  }

  const gated = type === "lead" || (type === "discount" && config.gate.requirePhone);
  const hasSuccess = type !== "announcement";

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose} aria-label="إغلاق">
          <X className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <DialogTitle className="sr-only">{isNew ? "نافذة جديدة" : "تعديل النافذة"}</DialogTitle>
          <DialogDescription className="sr-only">صمّم النافذة وشوف شكلها في المتجر مباشرة.</DialogDescription>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            aria-label="اسم النافذة"
            placeholder="اسم النافذة (ليك انت بس)"
            className="w-full max-w-sm rounded-md bg-transparent px-1 py-0.5 text-base font-semibold outline-none hover:bg-muted/60 focus:bg-muted/60"
          />
        </div>
        {error && <p className="hidden max-w-xs truncate text-xs text-destructive md:block">{error}</p>}
        <div className="flex shrink-0 items-center gap-2">
          {popup.isActive ? (
            <Button onClick={() => save(false)} disabled={pending || uploading} className="gap-1.5">
              {pending && <Loader2 className="size-4 animate-spin" />}
              حفظ
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => save(false)} disabled={pending || uploading} className="max-sm:hidden">
                حفظ كمسودة
              </Button>
              <Button onClick={() => save(true)} disabled={pending || uploading} className="gap-1.5">
                {pending && <Loader2 className="size-4 animate-spin" />}
                حفظ وتشغيل
              </Button>
            </>
          )}
        </div>
      </header>
      {error && <p className="border-b border-border bg-destructive/5 px-4 py-2 text-xs text-destructive md:hidden">{error}</p>}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[24rem_1fr]">
        {/* ── Settings ─────────────────────────────────────────── */}
        <div className="min-h-0 overflow-y-auto border-border lg:border-e">
          <div className="space-y-2 border-b border-border p-4">
            <Label>النوع</Label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => changeType(t.value)}
                  aria-pressed={type === t.value}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition-colors",
                    type === t.value ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  <t.icon className={cn("size-4", type === t.value && "text-primary")} />
                  <span className="text-xs font-medium">{t.label}</span>
                  <span className="text-[10px] leading-4 text-muted-foreground">{t.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["content"]} className="px-4">
            <Section value="content" title="المحتوى">
              {type === "discount" && (
                <Field label="كود الخصم">
                  {coupons.length ? (
                    <Select value={config.content.couponCode} onValueChange={(v) => update("content", { couponCode: v })} dir="rtl">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختار كود" />
                      </SelectTrigger>
                      <SelectContent>
                        {coupons.map((c) => (
                          <SelectItem key={c.code} value={c.code} disabled={!c.isActive}>
                            <span className="font-mono" dir="ltr">
                              {c.code}
                            </span>
                            <span className="text-muted-foreground"> · {c.label}</span>
                            {!c.isActive && <span className="text-muted-foreground"> (متوقف)</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                      معندكش أكواد خصم لسه.{" "}
                      <Link href="/coupons?new=1" className="font-medium text-primary hover:underline">
                        اعمل كود
                      </Link>{" "}
                      وارجع هنا.
                    </div>
                  )}
                </Field>
              )}
              <Field label="سطر صغير فوق العنوان" counter={[config.content.eyebrow.length, 40]}>
                <Input value={config.content.eyebrow} maxLength={40} onChange={(e) => update("content", { eyebrow: e.target.value })} />
              </Field>
              <Field label="العنوان" counter={[config.content.title.length, 80]}>
                <Input value={config.content.title} maxLength={80} onChange={(e) => update("content", { title: e.target.value })} />
              </Field>
              <Field label="الوصف" counter={[config.content.body.length, 240]}>
                <Textarea rows={2} className="resize-none" value={config.content.body} maxLength={240} onChange={(e) => update("content", { body: e.target.value })} />
              </Field>
              <Field label="الصورة (اختياري)">
                {config.content.image ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={config.content.image} alt="" className="size-10 rounded object-cover" />
                    <span className="flex-1 text-xs text-muted-foreground">صورة النافذة</span>
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => update("content", { image: "" })}>
                      شيل
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:bg-muted/50">
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                    {uploading ? "بنرفع…" : "ارفع صورة"}
                    <input type="file" accept="image/*" className="sr-only" onChange={onImage} disabled={uploading} />
                  </label>
                )}
              </Field>
              <Field label="نص الزرار" counter={[config.content.ctaText.length, 30]}>
                <Input value={config.content.ctaText} maxLength={30} onChange={(e) => update("content", { ctaText: e.target.value })} />
              </Field>
              {type === "announcement" && (
                <Field label="الزرار يودّي على" hint="مثال: ‎/products أو ‎/categories/summer أو لينك كامل">
                  <Input dir="ltr" value={config.content.ctaLink} onChange={(e) => update("content", { ctaLink: e.target.value.trim() })} placeholder="/products" />
                </Field>
              )}
              <Field label="نص الرفض (اختياري)" hint="سيبه فاضي لو مش عايزه يظهر.">
                <Input value={config.content.dismissText} maxLength={40} onChange={(e) => update("content", { dismissText: e.target.value })} />
              </Field>

              {type === "discount" && (
                <ToggleRow
                  title="اطلب رقم الموبايل قبل الكود"
                  description="العميل يسيب رقمه عشان يشوف الكود — بيتسجل في عملائك."
                  checked={config.gate.requirePhone}
                  onChange={(v) => {
                    update("gate", { requirePhone: v });
                    setStage("offer");
                  }}
                />
              )}
              {gated && (
                <ToggleRow title="اسأل عن الاسم كمان" checked={config.gate.askName} onChange={(v) => update("gate", { askName: v })} />
              )}
              {hasSuccess && (
                <>
                  <Field label="عنوان بعد النجاح">
                    <Input value={config.content.successTitle} maxLength={80} onChange={(e) => update("content", { successTitle: e.target.value })} />
                  </Field>
                  <Field label="رسالة بعد النجاح">
                    <Input value={config.content.successBody} maxLength={200} onChange={(e) => update("content", { successBody: e.target.value })} />
                  </Field>
                </>
              )}
            </Section>

            <Section value="design" title="الشكل">
              <div className="grid grid-cols-4 gap-2">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => update("design", { layout: l.value })}
                    aria-pressed={config.design.layout === l.value}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 text-[11px] transition-colors",
                      config.design.layout === l.value ? "border-primary bg-primary/5" : "border-border text-muted-foreground hover:border-foreground/30",
                    )}
                  >
                    <l.icon className="size-4" />
                    {l.label}
                  </button>
                ))}
              </div>
              <Field label="لون الزرار">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update("design", { accent: "theme" })}
                    className={cn(
                      "h-7 rounded-full border px-2.5 text-[11px]",
                      config.design.accent === "theme" ? "border-foreground font-medium" : "border-border text-muted-foreground",
                    )}
                  >
                    لون المتجر
                  </button>
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      onClick={() => update("design", { accent: c })}
                      className={cn("size-7 rounded-full ring-offset-2 ring-offset-background", config.design.accent === c && "ring-2 ring-foreground")}
                      style={{ background: c }}
                    />
                  ))}
                  <label className="relative size-7 cursor-pointer overflow-hidden rounded-full bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]">
                    <input
                      type="color"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      value={config.design.accent === "theme" ? "#111827" : config.design.accent}
                      onChange={(e) => update("design", { accent: e.target.value })}
                      aria-label="لون مخصص"
                    />
                  </label>
                </div>
              </Field>
              <Field label="الحواف">
                <Segmented
                  value={config.design.radius}
                  onChange={(v) => update("design", { radius: v })}
                  options={[
                    { value: "sm", label: "حادة" },
                    { value: "md", label: "متوسطة" },
                    { value: "lg", label: "دائرية" },
                  ]}
                />
              </Field>
              <ToggleRow
                title="عدّاد تنازلي حقيقي"
                description={
                  previewCountdown
                    ? "بيعدّ لحد انتهاء الكود أو نهاية الجدولة — أقرب واحد."
                    : "بيظهر لما يكون للكود تاريخ انتهاء أو للنافذة تاريخ نهاية (خلال ٧ أيام)."
                }
                checked={config.design.showCountdown}
                onChange={(v) => update("design", { showCountdown: v })}
              />
            </Section>

            <Section value="trigger" title="إمتى تظهر">
              <Segmented
                value={config.trigger.kind}
                onChange={(v) => update("trigger", { kind: v })}
                options={[
                  { value: "delay", label: "بعد وقت" },
                  { value: "scroll", label: "بعد نزول" },
                  { value: "exit", label: "قبل الخروج" },
                ]}
              />
              {config.trigger.kind === "delay" && (
                <SliderField
                  label="بعد"
                  value={config.trigger.delaySeconds}
                  min={0}
                  max={60}
                  format={(v) => (v === 0 ? "فورًا" : `${v} ثانية`)}
                  onChange={(v) => update("trigger", { delaySeconds: v })}
                />
              )}
              {config.trigger.kind === "scroll" && (
                <SliderField
                  label="لما يتصفح"
                  value={config.trigger.scrollPercent}
                  min={10}
                  max={90}
                  step={5}
                  format={(v) => `${v}٪ من الصفحة`}
                  onChange={(v) => update("trigger", { scrollPercent: v })}
                />
              )}
              {config.trigger.kind === "exit" && (
                <p className="rounded-lg bg-muted/60 p-2.5 text-xs leading-5 text-muted-foreground">
                  على الكمبيوتر: لما الماوس يطلع ناحية قفل التاب. على الموبايل: لما يطلع لفوق بسرعة بعد ما يتصفح شوية.
                </p>
              )}
            </Section>

            <Section value="targeting" title="لمين تظهر">
              <Field label="الصفحات">
                <Segmented
                  value={config.targeting.pages}
                  onChange={(v) => update("targeting", { pages: v })}
                  options={[
                    { value: "all", label: "كل الصفحات" },
                    { value: "home", label: "الرئيسية" },
                    { value: "products", label: "المنتجات" },
                  ]}
                />
              </Field>
              <Field label="الأجهزة">
                <Segmented
                  value={config.targeting.devices}
                  onChange={(v) => update("targeting", { devices: v })}
                  options={[
                    { value: "all", label: "الكل" },
                    { value: "mobile", label: "موبايل" },
                    { value: "desktop", label: "كمبيوتر" },
                  ]}
                />
              </Field>
              <Field label="الزوار">
                <Segmented
                  value={config.targeting.audience}
                  onChange={(v) => update("targeting", { audience: v })}
                  options={[
                    { value: "all", label: "الكل" },
                    { value: "new", label: "أول زيارة" },
                    { value: "returning", label: "راجعين" },
                  ]}
                />
              </Field>
              <p className="text-xs text-muted-foreground">مش هتظهر أبدًا في السلة أو الدفع، ولا لحد سجّل قبل كده.</p>
            </Section>

            <Section value="frequency" title="كام مرة">
              <Segmented
                value={config.frequency.mode}
                onChange={(v) => update("frequency", { mode: v })}
                options={[
                  { value: "once", label: "مرة واحدة" },
                  { value: "session", label: "كل زيارة" },
                  { value: "days", label: "كل كام يوم" },
                ]}
              />
              {config.frequency.mode === "days" && (
                <SliderField
                  label="تظهر تاني بعد"
                  value={config.frequency.days}
                  min={1}
                  max={30}
                  format={(v) => `${v} يوم`}
                  onChange={(v) => update("frequency", { days: v })}
                />
              )}
            </Section>

            <Section value="schedule" title="الجدولة">
              <div className="grid grid-cols-2 gap-2">
                <Field label="تبدأ">
                  <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="text-xs" />
                </Field>
                <Field label="تنتهي">
                  <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="text-xs" />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">فاضي = شغّالة لحد ما توقفها. مفيدة لعروض الويك إند والمواسم.</p>
            </Section>
          </Accordion>
        </div>

        {/* ── Live preview ─────────────────────────────────────── */}
        <div className="hidden min-h-0 flex-col bg-muted/40 lg:flex">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-background/60 px-4 py-2">
            <Segmented
              value={device}
              onChange={setDevice}
              className="w-auto"
              options={[
                { value: "desktop", label: <Monitor className="mx-1 size-3.5" /> },
                { value: "mobile", label: <Smartphone className="mx-1 size-3.5" /> },
              ]}
            />
            {hasSuccess && (
              <Segmented
                value={stage}
                onChange={setStage}
                className="w-auto"
                options={[
                  { value: "offer", label: "العرض" },
                  { value: "success", label: gated ? "بعد التسجيل" : "بعد الضغط" },
                ]}
              />
            )}
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setReplay((n) => n + 1)}>
              <RotateCcw className="size-3.5" />
              إعادة
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
            <div
              style={themeVars as CSSProperties}
              className={cn(
                "relative overflow-hidden bg-(--store-background,#fff) shadow-xl ring-1 ring-black/10",
                device === "desktop" ? "aspect-[16/10] w-full max-w-4xl rounded-xl" : "h-[40rem] w-[22rem] rounded-[2rem] ring-[6px] ring-foreground/85",
              )}
            >
              <FakeStore mobile={device === "mobile"} />
              <PopupView
                key={`${replay}-${device}-${stage}`}
                contained
                mobile={device === "mobile"}
                type={type}
                config={config}
                stage={stage}
                revealedCode={type === "discount" ? config.content.couponCode || "CODE10" : null}
                countdownTo={previewCountdown}
                onCta={() => hasSuccess && setStage("success")}
                onSubmit={() => setStage("success")}
                onClose={() => setReplay((n) => n + 1)}
              />
            </div>
          </div>
          <p className="pb-3 text-center text-xs text-muted-foreground">
            ده نفس الشكل اللي هيظهر للعميل — بألوان وخطوط متجرك.
          </p>
        </div>
      </div>
    </>
  );
}

function Section({ value, title, children }: { value: string; title: string; children: ReactNode }) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-sm font-semibold hover:no-underline">{title}</AccordionTrigger>
      <AccordionContent className="space-y-4 pb-5">{children}</AccordionContent>
    </AccordionItem>
  );
}

function Field({ label, hint, counter, children }: { label: string; hint?: string; counter?: [number, number]; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        {counter && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {counter[0]}/{counter[1]}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({ title, description, checked, onChange }: { title: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3">
      <span className="space-y-0.5">
        <span className="block text-xs font-medium">{title}</span>
        {description && <span className="block text-[11px] leading-4 text-muted-foreground">{description}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <Label className="text-xs">{label}</Label>
        <span className="font-medium tabular-nums">{format(value)}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

/** Neutral storefront skeleton behind the popup, tinted by the store's vars. */
function FakeStore({ mobile }: { mobile: boolean }) {
  const block = "bg-(--store-muted,#f4f4f5)";
  return (
    <div className="pointer-events-none absolute inset-0 space-y-4 p-4" dir="rtl" aria-hidden>
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 rounded bg-(--store-primary,#111827) opacity-80" />
        {!mobile && (
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("h-2 w-12 rounded-full", block)} />
            ))}
          </div>
        )}
        <div className={cn("size-6 rounded-full", block)} />
      </div>
      <div className={cn("rounded-xl", block, mobile ? "h-40" : "h-44")} />
      <div className={cn("grid gap-3", mobile ? "grid-cols-2" : "grid-cols-4")}>
        {Array.from({ length: mobile ? 4 : 8 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className={cn("aspect-square rounded-lg", block)} />
            <div className={cn("h-2 w-3/4 rounded-full", block)} />
          </div>
        ))}
      </div>
    </div>
  );
}

