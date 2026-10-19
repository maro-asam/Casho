"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Banknote,
  Check,
  ExternalLink,
  Globe2,
  Loader2,
  PenLine,
  Search,
  Settings2,
  Trash2,
  Warehouse,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusPill } from "@/components/saas-page";
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
    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      <Zap className="size-3" />
      {tr("بوليصة تلقائية")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
        <span key={label} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
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
    <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-3 bg-card p-4">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-xs font-bold text-background tabular-nums">
            {nf.format(i + 1)}
          </span>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">{step.title}</p>
            <p className="text-xs leading-5 text-muted-foreground">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── Connected carrier card ────────────────────────────────────────────── */

function ConnectedCard({
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
    <li className={cn("flex flex-col rounded-xl border border-border bg-card transition-opacity", !active && "opacity-70")}>
      <div className="flex items-start gap-3 p-4">
        <CarrierMark carrier={carrier.key} size="lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate font-semibold">{entry.settings.displayName || carrier.nameAr}</p>
            <StatusPill tone={active ? "success" : "neutral"}>{active ? tr("شغّالة") : tr("متوقفة")}</StatusPill>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <IntegrationChip carrier={carrier} />
            {entry.hint && (
              <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                {entry.hint}
              </span>
            )}
          </div>
        </div>
        <Switch
          checked={active}
          onCheckedChange={toggle}
          disabled={isPending}
          aria-label={active ? tr("إيقاف {0}", carrier.nameAr) : tr("تفعيل {0}", carrier.nameAr)}
        />
      </div>

      <dl className="mx-4 grid grid-cols-3 divide-x divide-x-reverse divide-border rounded-lg bg-muted/50 text-center">
        <div className="px-2 py-2.5">
          <dt className="text-[0.6875rem] text-muted-foreground">{tr("شغّالة")}</dt>
          <dd className="text-sm font-semibold tabular-nums">{nf.format(stats.active)}</dd>
        </div>
        <div className="px-2 py-2.5">
          <dt className="text-[0.6875rem] text-muted-foreground">{tr("اتسلّمت")}</dt>
          <dd className="text-sm font-semibold tabular-nums">{nf.format(stats.delivered)}</dd>
        </div>
        <div className="px-2 py-2.5">
          <dt className="text-[0.6875rem] text-muted-foreground">{tr("فلوس عندهم")}</dt>
          <dd
            className={cn(
              "text-sm font-semibold tabular-nums",
              stats.codOutstanding > 0 && "text-amber-700 dark:text-amber-400",
            )}
          >
            {money.format(stats.codOutstanding / 100)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-2 p-4 pt-3">
        <span className="text-xs text-muted-foreground">{CARRIER_CATEGORY_LABELS[carrier.category]}</span>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onSettings}>
          <Settings2 className="size-3.5" />
          {tr("الإعدادات")}
        </Button>
      </div>
    </li>
  );
}

/* ── Catalog card ──────────────────────────────────────────────────────── */

function CatalogCard({ carrier, connected, onOpen }: { carrier: Carrier; connected: boolean; onOpen: () => void }) {
  return (
    <li className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start gap-3">
        <CarrierMark carrier={carrier.key} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold" dir="auto">
              <button
                type="button"
                onClick={onOpen}
                className="text-start after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
              >
                {carrier.name}
              </button>
            </h3>
            {connected && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Check className="size-3.5" />
                {tr("مربوطة")}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {carrier.nameAr} · {CARRIER_CATEGORY_LABELS[carrier.category]}
          </p>
        </div>
      </div>

      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{carrier.tagline}</p>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3">
        <IntegrationChip carrier={carrier} />
        <FeatureChips carrier={carrier} />
        <span className="ms-auto text-xs font-semibold text-primary group-hover:underline">
          {connected ? tr("الإعدادات") : tr("اربط")}
        </span>
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

  return (
    <form action={save} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="gap-3 border-b border-border p-5">
        <div className="flex items-center gap-3 pe-8">
          <CarrierMark carrier={carrier.key} size="lg" />
          <div className="min-w-0">
            <SheetTitle className="text-base font-semibold" dir="auto">
              {carrier.name}
            </SheetTitle>
            <p className="text-xs text-muted-foreground">{carrier.nameAr}</p>
          </div>
        </div>
        <SheetDescription className="leading-6">
          {carrier.integration === "api"
            ? tr("كاشو هيعمل البوليصة على حسابك في {0} ويجيب حالة الشحنة منهم لوحده.", carrier.nameAr)
            : isOwn
              ? tr("سجّل شحنات مندوبك أو أي شركة مش في القايمة، وتابع حالتها وتحصيلها من كاشو.")
              : tr("بتحجز الشحنة مع {0} زي ما متعوّد، وتكتب رقم البوليصة في الطلب — كاشو يتابع الحالة والتحصيل ويوري العميل التتبع.", carrier.nameAr)}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {carrier.integration === "api" && (
          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-semibold">{tr("بيانات الحساب")}</legend>
            {carrier.credentialFields?.map((field) => {
              const stored = entry?.storedFields.includes(field.key) ?? false;
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={`cred_${field.key}`}>
                    {field.label}
                    {field.required && !stored && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    id={`cred_${field.key}`}
                    name={`cred_${field.key}`}
                    type={field.type}
                    dir="ltr"
                    autoComplete="off"
                    placeholder={stored ? tr("محفوظ — سيبه فاضي عشان يفضل زي ما هو") : field.placeholder}
                    required={field.required && !stored}
                    className="font-mono text-sm placeholder:font-sans"
                  />
                  {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
                </div>
              );
            })}
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
              {tr("البيانات بتتخزّن متشفّرة، ومحدش يقدر يشوفها تاني ولا حتى إنت.")}
            </p>
          </fieldset>
        )}

        <fieldset className="space-y-4">
          <legend className="mb-3 text-sm font-semibold">{tr("الإعدادات")}</legend>

          <div className="space-y-1.5">
            <Label htmlFor="displayName">{isOwn ? tr("اسم المندوب أو الشركة") : tr("الاسم اللي يظهر للعميل")}</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={entry?.settings.displayName ?? ""}
              placeholder={isOwn ? tr("مثال: مندوب المتجر") : carrier.nameAr}
              maxLength={60}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trackingUrlTemplate">{tr("رابط التتبع")}</Label>
            <Input
              id="trackingUrlTemplate"
              name="trackingUrlTemplate"
              dir="ltr"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder={carrier.trackingUrl ?? "https://example.com/track/{tracking}"}
              aria-invalid={templateInvalid || undefined}
              className="font-mono text-xs"
            />
            <p className={cn("text-xs leading-5", templateInvalid ? "text-destructive" : "text-muted-foreground")}>
              {templateInvalid
                ? tr("لازم يبدأ بـ https:// ويكون فيه {tracking}")
                : carrier.trackingUrl
                  ? tr("سيبه فاضي عشان نستخدم صفحة التتبع الرسمية. حط {tracking} مكان رقم الشحنة لو عايز رابط تاني.")
                  : tr("حط رابط صفحة التتبع بتاعت الشركة، و {tracking} مكان رقم الشحنة — عشان العميل يتابع شحنته.")}
            </p>
            {preview && !templateInvalid && (
              <p className="truncate rounded-md bg-muted/60 px-2 py-1 font-mono text-[0.6875rem] text-muted-foreground" dir="ltr">
                {preview}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="defaultWeightKg">{tr("الوزن الافتراضي (كجم)")}</Label>
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
                <Label htmlFor="pickupGovernorate">{tr("محافظة الاستلام")}</Label>
                <select
                  id="pickupGovernorate"
                  name="pickupGovernorate"
                  defaultValue={entry?.settings.pickupGovernorate ?? "cairo"}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
        </fieldset>

        {carrier.website && (
          <a
            href={carrier.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
            {tr("موقع {0}", carrier.nameAr)}
          </a>
        )}
      </div>

      <SheetFooter className="flex-row items-center gap-2 border-t border-border p-4">
        {entry && (
          <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={remove} disabled={isPending}>
            <Trash2 className="size-3.5" />
            {tr("إلغاء الربط")}
          </Button>
        )}
        <Button type="submit" className="ms-auto min-w-28" disabled={isPending || templateInvalid}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {entry ? tr("حفظ") : tr("اربط {0}", carrier.nameAr)}
        </Button>
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
        <section aria-labelledby="connected-title" className="space-y-3">
          <h2 id="connected-title" className="text-base font-semibold">
            {tr("شركاتك")}{" "}<span className="font-normal text-muted-foreground">({nf.format(connected.length)})</span>
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {connected.map((entry) => {
              const carrier = CARRIERS.find((c) => c.key === entry.provider)!;
              return (
                <ConnectedCard
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 id="catalog-title" className="text-base font-semibold">
            {connected.length > 0 ? tr("ضيف شركة تانية") : tr("اختار شركة الشحن")}{" "}
            <span className="font-normal text-muted-foreground">({nf.format(CARRIERS.length)})</span>
          </h2>
          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr("دوّر على شركة…")}
              aria-label={tr("دوّر على شركة شحن")}
              className="h-9 ps-9"
            />
          </div>
        </div>

        <div role="tablist" aria-label={tr("نوع الشركة")} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
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
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
                <span className={cn("tabular-nums", selected ? "text-background/70" : "text-muted-foreground/70")}>
                  {nf.format(count)}
                </span>
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {tr("مفيش شركة بالاسم ده. لو بتتعامل مع شركة مش موجودة، اربطها كـ")}{" "}<button type="button" className="font-semibold text-foreground underline underline-offset-4" onClick={() => setOpenKey("OWN_COURIER")}>{tr("مندوب خاص")}</button>.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((carrier) => (
              <CatalogCard
                key={carrier.key}
                carrier={carrier}
                connected={connectedByKey.has(carrier.key)}
                onOpen={() => setOpenKey(carrier.key)}
              />
            ))}
          </ul>
        )}
      </section>

      <Sheet open={openCarrier !== null} onOpenChange={(open) => !open && setOpenKey(null)}>
        <SheetContent side={isRtl() ? "left" : "right"} className="w-full gap-0 p-0 sm:max-w-md" dir={tdir()}>
          {openCarrier && (
            <CarrierSheet
              key={openCarrier.key}
              carrier={openCarrier}
              entry={connectedByKey.get(openCarrier.key)}
              onClose={() => setOpenKey(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
