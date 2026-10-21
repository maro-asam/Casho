"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ExternalLink, ImageIcon, Loader2, Minus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SaveOfferAction, SearchOfferProductsAction, type OfferProductOption } from "@/actions/offers/offers.actions";
import { Card, LargeTitle, SegmentedButtons, appleButton } from "@/components/saas-page";
import { Switch } from "@/components/ui/switch";
import { acceptRate, defaultHeadline, offerUnitPrice, type OfferDiscountType, type OfferType } from "@/lib/offers/offer-pricing";
import { cn } from "@/lib/utils";
import { OFFER_TYPE_META, offerTypeMeta } from "./offer-meta";
import { DeleteOfferDialog } from "./offer-row-actions";
import { lazyIntl, tr, trv } from "@/lib/i18n/dashboard";

export type EditableOffer = {
  id: string;
  type: OfferType;
  name: string;
  headline: string | null;
  isActive: boolean;
  priority: number;
  discountType: OfferDiscountType;
  discountValue: number;
  offerProduct: OfferProductOption;
  triggers: OfferProductOption[];
  /** Revenue in piasters, from non-canceled orders. */
  stats: { views: number; accepts: number; revenue: number; orders: number };
};

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 2 });
const money0 = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const nf = lazyIntl.number({ maximumFractionDigits: 1 });

const BASE_PATH = "/offers";

function Thumb({ src, className }: { src?: string | null; className?: string }) {
  return (
    <span className={cn("relative grid shrink-0 place-items-center overflow-hidden bg-(--fill-3)", className)}>
      {src ? <Image src={src} alt="" fill sizes="64px" className="object-cover" /> : <ImageIcon className="size-4 text-(--label-3)" />}
    </span>
  );
}

type Props = { offer: EditableOffer | null; initialType: OfferType; storefrontUrl: string };

export function OfferForm({ offer, initialType, storefrontUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<OfferType>(offer?.type ?? initialType);
  const [name, setName] = useState(offer?.name ?? "");
  const [headline, setHeadline] = useState(offer?.headline ?? "");
  const [offerProduct, setOfferProduct] = useState<OfferProductOption | null>(offer?.offerProduct ?? null);
  const [triggers, setTriggers] = useState<OfferProductOption[]>(offer?.triggers ?? []);
  const [anyProduct, setAnyProduct] = useState(offer ? offer.triggers.length === 0 && offer.type !== "UPSELL" : false);
  const [discountType, setDiscountType] = useState<OfferDiscountType>(offer?.discountType ?? "PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(offer && offer.discountValue > 0 ? String(offer.discountValue) : "10");
  const [priority, setPriority] = useState(offer ? String(offer.priority) : "0");
  const [isActive, setIsActive] = useState(offer?.isActive ?? true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = offerTypeMeta(type);
  const allowAny = type !== "UPSELL";
  const useAny = allowAny && anyProduct;
  const value = Number(discountValue);
  const finalPrice = offerProduct ? offerUnitPrice(offerProduct.price, { discountType, discountValue: value || 0 }) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await SaveOfferAction(offer?.id ?? null, {
        type,
        name,
        headline: headline || null,
        offerProductId: offerProduct?.id ?? "",
        triggerProductIds: useAny ? [] : triggers.map((t) => t.id),
        discountType,
        discountValue: discountType === "NONE" ? 0 : value,
        priority: Number(priority) || 0,
        isActive,
      });
      if (!result.ok) {
        setError(result.message);
        toast.error(trv(result.message));
        return;
      }
      toast.success(offer ? tr("اتحفظ العرض") : tr("اتعمل عرض {0}", name.trim()));
      router.push(BASE_PATH);
      router.refresh();
    });
  }

  const triggerLabel = type === "DOWNSELL" ? tr("لما يرفض ترقية المنتجات دي") : tr("لما العميل يضيف");
  const rowCls = "flex min-h-11 items-center gap-3 px-4";
  const inputCls = "h-11 min-w-0 flex-1 bg-transparent text-end text-[15px] outline-none placeholder:text-(--label-3)";
  const group = "apple-rows overflow-hidden rounded-[14px] bg-(--fill-3)/50 [--row-inset:16px]";

  return (
    <form onSubmit={submit} className="apple-form min-w-0 space-y-6">
      <LargeTitle
        eyebrow={
          <Link
            href={BASE_PATH}
            className="apple-press -ms-1.5 mb-1 inline-flex h-8 items-center gap-0.5 rounded-full pe-2.5 ps-1 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="size-5 ltr:-scale-x-100" strokeWidth={2.2} />
            {tr("Upsell و Cross-sell")}
          </Link>
        }
        title={<span className="line-clamp-2 break-words">{name.trim() || (offer ? tr("تعديل العرض") : tr("عرض جديد"))}</span>}
        subtitle={tr("بيظهر للعميل في اللحظة اللي بيضيف فيها للسلة — والسعر بيتحسب لوحده في السلة والطلب.")}
        actions={
          <a href={storefrontUrl} target="_blank" rel="noreferrer" className={appleButton.gray}>
            <ExternalLink className="size-4 text-muted-foreground" />
            {tr("عرض في المتجر")}
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Main column ─────────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">
          <Card title={tr("نوع العرض")} subtitle={meta.description}>
            <div className="space-y-4 px-5 pb-5">
              <div role="radiogroup" aria-label={tr("نوع العرض")} className="grid gap-2 sm:grid-cols-3">
                {OFFER_TYPE_META.map((m) => {
                  const selected = type === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setType(m.value)}
                      className={cn(
                        "apple-press flex items-center gap-3 rounded-xl p-3 text-start transition-colors duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected ? "bg-primary/10 ring-2 ring-primary ring-inset" : "bg-(--fill-3) hover:bg-(--fill-3)/70",
                      )}
                    >
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-[8px] text-white", m.glyph)}>
                        <m.icon className="size-4" strokeWidth={2.6} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] leading-5 font-medium">{m.title}</span>
                        <span className="block text-[12px] leading-4 text-muted-foreground" dir="ltr">
                          {m.short}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="offer-name" className={cn(rowCls, "rounded-[14px] bg-(--fill-3)/50")}>
                  <span className="shrink-0 text-[15px]">{tr("اسم العرض")}</span>
                  <input
                    id="offer-name"
                    value={name}
                    maxLength={80}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={tr("مثال: ترقية السماعة للبرو")}
                    autoComplete="off"
                    className={inputCls}
                  />
                </label>
                <p className="px-4 text-[13px] text-muted-foreground">{tr("للوحة بس — العميل مش هيشوفه.")}</p>
              </div>
            </div>
          </Card>

          <Card title={triggerLabel} subtitle={useAny ? tr("العرض هيظهر مع أي منتج يتضاف للسلة.") : tr("المنتجات اللي لما تتضاف للسلة العرض يظهر.")}>
            <div className="px-5 pb-5">
              <div className={group}>
                {allowAny && (
                  <label className={cn(rowCls, "cursor-pointer")}>
                    <span className="flex-1 text-[15px]">{tr("أي منتج في المتجر")}</span>
                    <Switch checked={anyProduct} onCheckedChange={setAnyProduct} className="apple-switch" />
                  </label>
                )}
                {!useAny && (
                  <>
                    {triggers.map((t) => (
                      <div key={t.id} className="flex min-h-13 items-center gap-3 px-4 py-2">
                        <button
                          type="button"
                          aria-label={tr("شيل {0}", t.name)}
                          onClick={() => setTriggers((list) => list.filter((x) => x.id !== t.id))}
                          className="apple-press grid size-[22px] shrink-0 place-items-center rounded-full bg-(--sys-red) text-white"
                        >
                          <Minus className="size-3.5" strokeWidth={3} />
                        </button>
                        <Thumb src={t.image} className="size-9 rounded-[8px]" />
                        <span className="min-w-0 flex-1 truncate text-[15px]">{t.name}</span>
                        <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">{money.format(t.price)}</span>
                      </div>
                    ))}
                    <ProductSearch
                      exclude={[...triggers.map((t) => t.id), ...(offerProduct ? [offerProduct.id] : [])]}
                      onPick={(p) => setTriggers((list) => [...list, p])}
                      placeholder={tr("ضيف منتج يشغّل العرض")}
                      adding
                    />
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card title={type === "UPSELL" ? tr("اعرض عليه بداله") : tr("اعرض عليه")}>
            <div className="space-y-2 px-5 pb-5">
              <div className="overflow-hidden rounded-[14px] bg-(--fill-3)/50">
                {offerProduct ? (
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <Thumb src={offerProduct.image} className="size-12 rounded-[10px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{offerProduct.name}</p>
                      <p className="text-[13px] text-muted-foreground tabular-nums">{money.format(offerProduct.price)}</p>
                    </div>
                    <button type="button" onClick={() => setOfferProduct(null)} className={appleButton.plain}>
                      {tr("تغيير")}
                    </button>
                  </div>
                ) : (
                  <ProductSearch exclude={triggers.map((t) => t.id)} onPick={setOfferProduct} placeholder={tr("ابحث باسم المنتج أو الـ SKU")} />
                )}
              </div>
              {offerProduct && !offerProduct.isActive && (
                <p className="px-4 text-[13px] text-(--sys-orange)">{tr("المنتج ده مخفي — العرض مش هيظهر لحد ما تظهره.")}</p>
              )}
            </div>
          </Card>

          <Card
            title={tr("الخصم")}
            action={
              <SegmentedButtons
                label={tr("الخصم على المنتج المعروض")}
                value={discountType}
                onChange={setDiscountType}
                options={[
                  ["PERCENTAGE", tr("نسبة")],
                  ["FIXED", tr("مبلغ")],
                  ["NONE", tr("من غير خصم")],
                ]}
              />
            }
          >
            <div className="px-5 pb-5">
              <div className={group}>
                {discountType !== "NONE" && (
                  <label htmlFor="offer-discount" className={rowCls}>
                    <span className="shrink-0 text-[15px]">{discountType === "PERCENTAGE" ? tr("النسبة") : tr("المبلغ")}</span>
                    <input
                      id="offer-discount"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={discountType === "PERCENTAGE" ? 100 : undefined}
                      step="any"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className={cn(inputCls, "tabular-nums")}
                    />
                    <span className="shrink-0 text-[15px] text-muted-foreground">{discountType === "PERCENTAGE" ? tr("٪") : tr("ج.م للقطعة")}</span>
                  </label>
                )}
                <div className={cn(rowCls, "justify-between")}>
                  <span className="text-[15px]">{tr("العميل هيدفع")}</span>
                  <span className="text-[15px] tabular-nums">
                    {offerProduct && finalPrice !== null ? (
                      <>
                        {finalPrice < offerProduct.price && (
                          <span className="me-2 text-[13px] text-muted-foreground line-through">{money.format(offerProduct.price)}</span>
                        )}
                        <span className="font-semibold">{money.format(finalPrice)}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{tr("اختار المنتج الأول")}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card title={tr("العرض في المتجر")}>
            <div className="space-y-2 px-5 pb-5">
              <div className={group}>
                <label htmlFor="offer-headline" className={rowCls}>
                  <span className="shrink-0 text-[15px]">{tr("العنوان")}</span>
                  <input
                    id="offer-headline"
                    value={headline}
                    maxLength={120}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder={defaultHeadline(type)}
                    autoComplete="off"
                    className={inputCls}
                  />
                </label>
                <label htmlFor="offer-priority" className={rowCls}>
                  <span className="shrink-0 text-[15px]">{tr("الأولوية")}</span>
                  <input
                    id="offer-priority"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={cn(inputCls, "tabular-nums")}
                  />
                </label>
              </div>
              <p className="px-4 text-[13px] leading-[18px] text-muted-foreground">
                {tr("العنوان اختياري — لو سبته فاضي هيظهر الافتراضي. ولو أكتر من عرض على نفس المنتج، الأعلى أولوية هو اللي يظهر.")}
              </p>
            </div>
          </Card>
        </div>

        {/* ── Side column ─────────────────────────────────────────── */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card title={tr("المعاينة")} subtitle={tr("اللي العميل هيشوفه بعد ما يضيف للسلة.")}>
            <div className="px-5 pb-5">
              <div className="space-y-3 rounded-[18px] bg-background p-4" aria-hidden>
                <div className="flex items-center gap-2">
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-[6px] text-white transition-colors", meta.glyph)}>
                    <meta.icon className="size-3" strokeWidth={3} />
                  </span>
                  <p className="min-w-0 truncate text-[15px] font-semibold">{headline || defaultHeadline(type)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Thumb src={offerProduct?.image} className="size-16 rounded-[12px]" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("line-clamp-2 text-[13px]", !offerProduct && "text-(--label-3)")}>{offerProduct?.name ?? tr("المنتج المعروض")}</p>
                    <p className="text-[13px] tabular-nums">
                      {offerProduct && finalPrice !== null ? (
                        <>
                          <span className="font-semibold">{money.format(finalPrice)}</span>
                          {finalPrice < offerProduct.price && (
                            <span className="ms-1.5 text-[12px] text-muted-foreground line-through">{money.format(offerProduct.price)}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-(--label-3)">{tr("{0} ج.م", "—")}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="inline-flex h-9 items-center justify-center rounded-full bg-(--fill-3) text-[13px] text-muted-foreground">{tr("لا شكرًا")}</span>
                  <span className="inline-flex h-9 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
                    {type === "UPSELL" ? tr("بدّل") : tr("أضف")}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card title={tr("النشر")}>
            <div className="space-y-3 px-5 pb-5">
              <label htmlFor="offer-active" className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl bg-(--fill-3)/60 px-4 py-3">
                <span className="space-y-0.5">
                  <span className="block text-[15px] leading-5">{tr("شغّال")}</span>
                  <span className="block text-[13px] leading-[18px] text-muted-foreground">{tr("لو قفلته، العرض يفضل محفوظ بس مش هيظهر للعملاء.")}</span>
                </span>
                <Switch id="offer-active" checked={isActive} onCheckedChange={setIsActive} className="apple-switch" />
              </label>
            </div>
          </Card>

          {offer && (
            <Card title={tr("الأداء")}>
              <dl className="grid grid-cols-2 gap-px border-t-[0.5px] border-border bg-border/60">
                {[
                  [tr("نسبة القبول"), tr("{0}٪", nf.format(acceptRate(offer.stats.views, offer.stats.accepts)))],
                  [tr("مشاهدات"), nf.format(offer.stats.views)],
                  [tr("مبيعات"), money0.format(offer.stats.revenue / 100)],
                  [tr("طلبات"), nf.format(offer.stats.orders)],
                ].map(([label, v]) => (
                  <div key={label} className="bg-card px-5 py-3">
                    <dt className="text-[12px] text-muted-foreground">{label}</dt>
                    <dd className="text-[20px] leading-[25px] font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {offer && (
            <button type="button" onClick={() => setConfirmDelete(true)} className={cn(appleButton.destructive, "h-11 w-full")}>
              <Trash2 className="size-4" />
              {tr("حذف العرض")}
            </button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="px-1 text-[13px] text-(--sys-red)">{trv(error)}</p>}

      {/* Floating toolbar (Liquid Glass): Save is always one tap away, the content scrolls beneath it. */}
      <div className="pointer-events-none sticky bottom-4 z-20 flex justify-center pb-[env(safe-area-inset-bottom)]">
        <div className="apple-glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
          <Link href={BASE_PATH} className={cn(appleButton.plain, "mx-0 h-10 px-4")}>
            {tr("إلغاء")}
          </Link>
          <button type="submit" disabled={pending} className={cn(appleButton.filled, "h-10")}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {offer ? tr("حفظ التعديلات") : tr("إنشاء العرض")}
          </button>
        </div>
      </div>

      {offer && (
        <DeleteOfferDialog
          offer={{ id: offer.id, name: offer.name, orders: offer.stats.orders, isActive: offer.isActive }}
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          onDone={() => {
            router.push(BASE_PATH);
            router.refresh();
          }}
        />
      )}
    </form>
  );
}

/** iOS search field + result rows, living inside a grouped card. */
function ProductSearch({
  exclude,
  onPick,
  placeholder,
  adding,
}: {
  exclude: string[];
  onPick: (p: OfferProductOption) => void;
  placeholder: string;
  /** Rows read as "add" (green plus) rather than "pick". */
  adding?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OfferProductOption[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await SearchOfferProductsAction(query);
        if (alive) setResults(rows);
      } catch {
        if (alive) setResults([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const visible = results?.filter((p) => !exclude.includes(p.id)) ?? null;

  return (
    <div>
      <div className="p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-2.5 my-auto size-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-9 w-full rounded-[10px] bg-card ps-8 pe-8 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          {loading && <Loader2 className="absolute inset-y-0 end-2.5 my-auto size-4 animate-spin text-muted-foreground" />}
        </div>
      </div>
      <ul className="apple-rows max-h-64 overflow-y-auto [--row-inset:64px]" role="listbox" aria-label={tr("المنتجات")}>
        {visible?.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-muted-foreground">{tr("مفيش منتجات بالاسم ده.")}</li>}
        {visible?.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => onPick(p)}
              className="flex w-full items-center gap-3 px-4 py-2 text-start transition-colors hover:bg-(--fill-3)/60 focus-visible:bg-(--fill-3)/60 focus-visible:outline-none"
            >
              <Thumb src={p.image} className="size-9 rounded-[8px]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px]">{p.name}</span>
                <span className="block text-[12px] text-muted-foreground tabular-nums">
                  {money.format(p.price)}
                  {!p.isActive && ` · ${tr("مخفي")}`}
                </span>
              </span>
              {adding && (
                <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-(--sys-green) text-white">
                  <Plus className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
