"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Banknote, Check, ChevronLeft, ExternalLink, Globe2, Loader2, Lock, PenLine, Search, Trash2, Warehouse, Zap } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusText, appleButton } from "@/components/saas-page";
import { CarrierMark } from "@/components/shipping/carrier-mark";
import { cn } from "@/lib/utils";
import { EGYPT_GOVERNORATES } from "@/constants/egypt-governorates";
import {
  CARRIERS,
  CARRIER_CATEGORY_LABELS,
  buildTrackingUrl,
  isValidTrackingTemplate,
  type Carrier,
} from "@/lib/shipping/carriers";
import type { ConnectedCarrier } from "@/lib/shipping/store-carriers";
import {
  RemoveShippingIntegrationAction,
  SaveCarrierIntegrationAction,
  ToggleShippingIntegrationAction,
} from "@/actions/shipping-integrations.actions";
import { isRtl, lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";

export type CarrierStats = { active: number; delivered: number; codOutstanding: number };

const nf = lazyIntl.number();
const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });

type Filter = "all" | "api" | "local" | "international" | "fulfillment" | "cod";

const FILTERS: { value: Filter; label: string; match: (c: Carrier) => boolean }[] = [
  { value: "all", get label() { return tr("الكل"); }, match: () => true },
  { value: "api", get label() { return tr("بوليصة تلقائية"); }, match: (c) => c.integration === "api" },
  { value: "local", get label() { return tr("توصيل محلي"); }, match: (c) => c.category === "local" || c.category === "own" },
  { value: "international", get label() { return tr("دولي"); }, match: (c) => c.features.international },
  { value: "fulfillment", get label() { return tr("تخزين وتوصيل"); }, match: (c) => c.features.fulfillment },
  { value: "cod", get label() { return tr("تحصيل عند الاستلام"); }, match: (c) => c.features.cod },
];

/* ── Small pieces ──────────────────────────────────────────────────────── */

function IntegrationChip({ carrier }: { carrier: Carrier }) {
  return carrier.integration === "api" ? (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
      <Zap className="size-3" />
      {tr("بوليصة تلقائية")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
      <PenLine className="size-3" />
      {tr("تسجيل يدوي")}
    </span>
  );
}

function FeatureChips({ carrier }: { carrier: Carrier }) {
  const items = [
    carrier.features.cod && { icon: Banknote, label: tr("تحصيل") },
    carrier.features.international && { icon: Globe2, label: tr("دولي") },
    carrier.features.fulfillment && { icon: Warehouse, label: tr("تخزين") },
  ].filter(Boolean) as { icon: typeof Banknote; label: string }[];
  return (
    <>
      {items.map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
      ))}
    </>
  );
}

function HowItWorks() {
  const steps = [
    { title: tr("اربط الشركة"), body: tr("بالـ API لو متاح، أو يدوي لأي شركة تانية أو مندوبك.") },
    { title: tr("اشحن من صفحة الطلب"), body: tr("اختار الشركة، والبوليصة تتعمل أو تكتب رقمها.") },
    { title: tr("تابع وحصّل"), body: tr("الحالة تتحدّث، العميل يتابع، وتعرف فلوسك فين.") },
  ];
  return (
    <ol className="apple-card grid gap-5 p-5 sm:grid-cols-3 sm:gap-6 sm:p-6">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-[13px] font-bold text-background tabular-nums">{nf.format(i + 1)}</span>
          <div className="space-y-0.5">
            <p className="text-[15px] font-semibold">{step.title}</p>
            <p className="text-[13px] leading-[18px] text-muted-foreground">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── Connected carrier row (Settings style) ────────────────────────────── */

function ConnectedRow({
  carrier,
  entry,
  stats,
  onSettings,
}: {
  carrier: Carrier;
  entry: ConnectedCarrier;
  stats: CarrierStats;
  onSettings: () => void;
}) {
  const router = useRouter();
  const [active, setActive] = useState(entry.isActive);
  const [isPending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setActive(next);
    startTransition(async () => {
      const res = await ToggleShippingIntegrationAction(carrier.key, next);
      if (!res.success) {
        setActive(!next);
        toast.error(trv(res.message));
        return;
      }
      toast.success(trv(res.message));
      router.refresh();
    });
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <CarrierMark carrier={carrier.key} size="lg" />
      <button type="button" onClick={onSettings} className="min-w-0 flex-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex flex-wrap items-center gap-x-2.5">
          <span className="truncate text-[15px] font-semibold">{entry.settings.displayName || carrier.nameAr}</span>
          <StatusText tone={active ? "success" : "neutral"}>{active ? tr("شغّالة") : tr("متوقفة")}</StatusText>
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-muted-foreground tabular-nums">
          <span>
            {tr("شغّالة")} {nf.format(stats.active)}
          </span>
          <span>
            {tr("اتسلّمت")} {nf.format(stats.delivered)}
          </span>
          <span className={cn(stats.codOutstanding > 0 && "font-semibold text-(--sys-orange)")}>
            {tr("فلوس عندهم")} {money.format(stats.codOutstanding / 100)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <IntegrationChip carrier={carrier} />
          {entry.hint && (
            <span className="font-mono text-[12px] text-muted-foreground" dir="ltr">
              {entry.hint}
            </span>
          )}
        </span>
      </button>
      <Switch
        className="apple-switch"
        checked={active}
        onCheckedChange={toggle}
        disabled={isPending}
        aria-label={active ? tr("إيقاف {0}", carrier.nameAr) : tr("تفعيل {0}", carrier.nameAr)}
      />
      <button type="button" onClick={onSettings} className={cn(appleButton.more, "size-8 bg-transparent text-(--label-3) hover:bg-(--fill-3)")} aria-label={tr("الإعدادات")}>
        <ChevronLeft className="size-[18px] ltr:-scale-x-100" strokeWidth={2.4} />
      </button>
    </li>
  );
}

/* ── Catalog card (App Store style) ────────────────────────────────────── */

function CatalogCard({ carrier, connected, onOpen }: { carrier: Carrier; connected: boolean; onOpen: () => void }) {
  return (
    <li className="apple-card relative flex flex-col gap-3 p-4 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-3">
        <CarrierMark carrier={carrier.key} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold" dir="auto">
            <button type="button" onClick={onOpen} className="text-start after:absolute after:inset-0 after:rounded-[22px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring">
              {carrier.name}
            </button>
          </h3>
          <p className="truncate text-[13px] text-muted-foreground">
            {carrier.nameAr} · {CARRIER_CATEGORY_LABELS[carrier.category]}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full px-3.5 text-[13px] font-bold",
            connected ? "text-(--sys-green)" : "bg-(--fill-3) text-primary",
          )}
        >
          {connected ? (
            <>
              <Check className="size-4" strokeWidth={3} />
              {tr("مربوطة")}
            </>
          ) : (
            tr("اربط")
          )}
        </span>
      </div>

      <p className="line-clamp-2 text-[13px] leading-[18px] text-muted-foreground">{carrier.tagline}</p>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t-[0.5px] border-border pt-3">
        <IntegrationChip carrier={carrier} />
        <FeatureChips carrier={carrier} />
      </div>
    </li>
  );
}

/* ── Connect / settings sheet ──────────────────────────────────────────── */

function CarrierSheet({
  carrier,
  entry,
  onClose,
}: {
  carrier: Carrier;
  entry: ConnectedCarrier | undefined;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [template, setTemplate] = useState(entry?.settings.trackingUrlTemplate ?? "");
  const preview = buildTrackingUrl(carrier, { trackingUrlTemplate: template || undefined }, "123456789");
  const templateInvalid = template.trim() !== "" && !isValidTrackingTemplate(template.trim());
  const isOwn = carrier.key === "OWN_COURIER";

  function save(fd: FormData) {
    startTransition(async () => {
      const res = await SaveCarrierIntegrationAction(carrier.key, fd);
      if (!res.success) {
        toast.error(trv(res.message));
        return;
      }
      toast.success(trv(res.message));
      router.refresh();
      onClose();
    });
  }

  function remove() {
    if (!confirm(tr("تلغي ربط {0}؟ الشحنات القديمة هتفضل محفوظة.", carrier.nameAr))) return;
    startTransition(async () => {
      const res = await RemoveShippingIntegrationAction(carrier.key);
      if (!res.success) {
        toast.error(trv(res.message));
        return;
      }
      toast.success(trv(res.message));
      router.refresh();
      onClose();
    });
  }

  const fieldLabel = "px-1 text-[13px] font-normal text-muted-foreground";

  return (
    <form action={save} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="items-center gap-1.5 px-6 pt-10 pb-5 text-center">
        <CarrierMark carrier={carrier.key} size="lg" />
        <SheetTitle className="mt-2 text-[22px] font-bold" dir="auto">
          {carrier.name}
        </SheetTitle>
        <p className="text-[13px] text-muted-foreground">
          {carrier.nameAr} · <IntegrationChip carrier={carrier} />
        </p>
        <SheetDescription className="text-[15px] leading-6">
          {carrier.integration === "api"
            ? tr("كاشو هيعمل البوليصة على حسابك في {0} ويجيب حالة الشحنة منهم لوحده.", carrier.nameAr)
            : isOwn
              ? tr("سجّل شحنات مندوبك أو أي شركة مش في القايمة، وتابع حالتها وتحصيلها من كاشو.")
              : tr("بتحجز الشحنة مع {0} زي ما متعوّد، وتكتب رقم البوليصة في الطلب — كاشو يتابع الحالة والتحصيل ويوري العميل التتبع.", carrier.nameAr)}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-7 overflow-y-auto px-4 pb-6">
        {carrier.integration === "api" && (
          <section className="space-y-2">
            <h3 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("بيانات الحساب")}</h3>
            <div className="space-y-4 rounded-[14px] bg-card p-4">
              {carrier.credentialFields?.map((field) => {
                const stored = entry?.storedFields.includes(field.key) ?? false;
                return (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={`cred_${field.key}`} className={fieldLabel}>
                      {field.label}
                      {field.required && !stored && <span className="text-(--sys-red)"> *</span>}
                    </Label>
                    <Input
                      id={`cred_${field.key}`}
                      name={`cred_${field.key}`}
                      type={field.type}
                      dir="ltr"
                      autoComplete="off"
                      placeholder={stored ? tr("محفوظ — سيبه فاضي عشان يفضل زي ما هو") : field.placeholder}
                      required={field.required && !stored}
                      className="font-mono placeholder:font-sans"
                    />
                    {field.help && <p className="px-1 text-[13px] text-muted-foreground">{field.help}</p>}
                  </div>
                );
              })}
            </div>
            <p className="flex items-center gap-1.5 px-4 text-[13px] text-muted-foreground">
              <Lock className="size-3" />
              {tr("البيانات بتتخزّن متشفّرة، ومحدش يقدر يشوفها تاني ولا حتى إنت.")}
            </p>
          </section>
        )}

        <section className="space-y-2">
          <h3 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("الإعدادات")}</h3>
          <div className="space-y-4 rounded-[14px] bg-card p-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className={fieldLabel}>
                {isOwn ? tr("اسم المندوب أو الشركة") : tr("الاسم اللي يظهر للعميل")}
              </Label>
              <Input id="displayName" name="displayName" defaultValue={entry?.settings.displayName ?? ""} placeholder={isOwn ? tr("مثال: مندوب المتجر") : carrier.nameAr} maxLength={60} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trackingUrlTemplate" className={fieldLabel}>
                {tr("رابط التتبع")}
              </Label>
              <Input
                id="trackingUrlTemplate"
                name="trackingUrlTemplate"
                dir="ltr"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder={carrier.trackingUrl ?? "https://example.com/track/{tracking}"}
                aria-invalid={templateInvalid || undefined}
                className="font-mono text-[13px]"
              />
              <p className={cn("px-1 text-[13px] leading-[18px]", templateInvalid ? "text-(--sys-red)" : "text-muted-foreground")}>
                {templateInvalid
                  ? tr("لازم يبدأ بـ https:// ويكون فيه {tracking}")
                  : carrier.trackingUrl
                    ? tr("سيبه فاضي عشان نستخدم صفحة التتبع الرسمية. حط {tracking} مكان رقم الشحنة لو عايز رابط تاني.")
                    : tr("حط رابط صفحة التتبع بتاعت الشركة، و {tracking} مكان رقم الشحنة — عشان العميل يتابع شحنته.")}
              </p>
              {preview && !templateInvalid && (
                <p className="truncate rounded-[8px] bg-(--fill-3) px-2.5 py-1.5 font-mono text-[12px] text-muted-foreground" dir="ltr">
                  {preview}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="defaultWeightKg" className={fieldLabel}>
                  {tr("الوزن الافتراضي (كجم)")}
                </Label>
                <Input
                  id="defaultWeightKg"
                  name="defaultWeightKg"
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  inputMode="decimal"
                  defaultValue={entry?.settings.defaultWeightKg ?? ""}
                  placeholder="1"
                />
              </div>
              {carrier.integration === "api" && (
                <div className="space-y-1.5">
                  <Label htmlFor="pickupGovernorate" className={fieldLabel}>
                    {tr("محافظة الاستلام")}
                  </Label>
                  <select
                    id="pickupGovernorate"
                    name="pickupGovernorate"
                    defaultValue={entry?.settings.pickupGovernorate ?? "cairo"}
                    className="apple-field h-11 w-full px-3 text-[15px] outline-none"
                  >
                    {EGYPT_GOVERNORATES.map((g) => (
                      <option key={g.code} value={g.code}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </section>

        {carrier.website && (
          <a href={carrier.website} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 text-[13px] text-primary">
            <ExternalLink className="size-3.5" />
            {tr("موقع {0}", carrier.nameAr)}
          </a>
        )}
      </div>

      <SheetFooter className="apple-glass gap-2 px-4 pt-3 pb-4">
        <button type="submit" className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")} disabled={isPending || templateInvalid}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {entry ? tr("حفظ") : tr("اربط {0}", carrier.nameAr)}
        </button>
        {entry && (
          <button type="button" className={cn(appleButton.plain, "mx-0 h-10 w-full text-(--sys-red) hover:bg-(--sys-red)/8")} onClick={remove} disabled={isPending}>
            <Trash2 className="size-4" />
            {tr("إلغاء الربط")}
          </button>
        )}
      </SheetFooter>
    </form>
  );
}

/* ── Page body ─────────────────────────────────────────────────────────── */

export default function ShippingIntegrationsClient({
  connected,
  stats,
}: {
  connected: ConnectedCarrier[];
  stats: Record<string, CarrierStats>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const connectedByKey = useMemo(() => new Map(connected.map((c) => [c.provider, c])), [connected]);
  const openCarrier = CARRIERS.find((c) => c.key === openKey) ?? null;

  const visible = useMemo(() => {
    const match = FILTERS.find((f) => f.value === filter)!.match;
    const q = query.trim().toLowerCase();
    return CARRIERS.filter(
      (c) => match(c) && (!q || c.name.toLowerCase().includes(q) || c.nameAr.includes(q)),
    );
  }, [filter, query]);

  return (
    <>
      <HowItWorks />

      {connected.length > 0 && (
        <section aria-labelledby="connected-title" className="space-y-2">
          <h2 id="connected-title" className="px-4 text-[13px] font-semibold text-muted-foreground">
            {tr("شركاتك")} ({nf.format(connected.length)})
          </h2>
          <ul className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:76px]">
            {connected.map((entry) => {
              const carrier = CARRIERS.find((c) => c.key === entry.provider)!;
              return (
                <ConnectedRow
                  key={entry.provider}
                  carrier={carrier}
                  entry={entry}
                  stats={stats[entry.provider] ?? { active: 0, delivered: 0, codOutstanding: 0 }}
                  onSettings={() => setOpenKey(entry.provider)}
                />
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="catalog-title" className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="catalog-title" className="text-[22px] leading-[28px] font-bold">
            {connected.length > 0 ? tr("ضيف شركة تانية") : tr("اختار شركة الشحن")}{" "}
            <span className="font-normal text-muted-foreground">({nf.format(CARRIERS.length)})</span>
          </h2>
          <label className="flex h-9 items-center gap-2 rounded-[10px] bg-card px-3 lg:w-72">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr("دوّر على شركة…")}
              aria-label={tr("دوّر على شركة شحن")}
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-(--label-3)"
            />
          </label>
        </div>

        <div role="tablist" aria-label={tr("نوع الشركة")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {FILTERS.map((f) => {
            const count = CARRIERS.filter(f.match).length;
            const selected = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "apple-press inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors",
                  selected ? "bg-foreground font-semibold text-background" : "bg-card text-foreground/80 hover:text-foreground",
                )}
              >
                {f.label}
                <span className={cn("tabular-nums", selected ? "text-background/70" : "text-(--label-3)")}>{nf.format(count)}</span>
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <p className="apple-card p-10 text-center text-[15px] text-muted-foreground">
            {tr("مفيش شركة بالاسم ده. لو بتتعامل مع شركة مش موجودة، اربطها كـ")}{" "}
            <button type="button" className="font-semibold text-primary" onClick={() => setOpenKey("OWN_COURIER")}>
              {tr("مندوب خاص")}
            </button>
            .
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((carrier) => (
              <CatalogCard key={carrier.key} carrier={carrier} connected={connectedByKey.has(carrier.key)} onOpen={() => setOpenKey(carrier.key)} />
            ))}
          </ul>
        )}
      </section>

      <Sheet open={openCarrier !== null} onOpenChange={(open) => !open && setOpenKey(null)}>
        <SheetContent
          side={isRtl() ? "left" : "right"}
          className="apple-ui apple-form w-full gap-0 border-0 bg-background p-0 text-foreground sm:max-w-md"
          dir={tdir()}
        >
          {openCarrier && <CarrierSheet key={openCarrier.key} carrier={openCarrier} entry={connectedByKey.get(openCarrier.key)} onClose={() => setOpenKey(null)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
