"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

import { SaveOfferAction, SearchOfferProductsAction, type OfferProductOption } from "@/actions/offers/offers.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { defaultHeadline, offerUnitPrice, type OfferDiscountType, type OfferType } from "@/lib/offers/offer-pricing";
import { cn } from "@/lib/utils";
import { OFFER_TYPE_META } from "./offer-meta";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";

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
};

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 2 });

/** URL-driven: `?new=<TYPE>` creates, `?edit=<id>` edits. */
export function UrlOfferDialog({ mode, newType, offer }: { mode: "new" | "edit" | null; newType: OfferType; offer: EditableOffer | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = mode === "new" || (mode === "edit" && Boolean(offer));

  function close() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("new");
    next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent dir={tdir()} className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        {open && (
          <OfferForm key={offer?.id ?? `new-${newType}`} offer={mode === "edit" ? offer : null} initialType={newType} onDone={close} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function OfferForm({ offer, initialType, onDone }: { offer: EditableOffer | null; initialType: OfferType; onDone: () => void }) {
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
  const [error, setError] = useState<string | null>(null);

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
        return;
      }
      toast.success(offer ? tr("اتحفظ العرض") : tr("اتعمل عرض {0}", name.trim()));
      onDone();
      router.refresh();
    });
  }

  const triggerLabel =
    type === "UPSELL" ? tr("لما العميل يضيف") : type === "DOWNSELL" ? tr("لما يرفض ترقية المنتجات دي") : tr("لما العميل يضيف");

  return (
    <form onSubmit={submit} className="min-w-0 space-y-5">
      <DialogHeader className="text-start sm:text-start">
        <DialogTitle>{offer ? tr("تعديل العرض") : tr("عرض جديد")}</DialogTitle>
        <DialogDescription>{tr("بيظهر للعميل في اللحظة اللي بيضيف فيها للسلة — والسعر بيتحسب لوحده في السلة والطلب.")}</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label>{tr("نوع العرض")}</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {OFFER_TYPE_META.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setType(m.value)}
              aria-pressed={type === m.value}
              className={cn(
                "rounded-lg border p-3 text-start transition-colors",
                type === m.value ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
              )}
            >
              <span className="block text-sm font-medium">{m.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{OFFER_TYPE_META.find((m) => m.value === type)?.description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="offer-name">{tr("اسم العرض")}</Label>
        <Input
          id="offer-name"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          placeholder={tr("مثال: ترقية السماعة للبرو")}
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">{tr("للوحة بس — العميل مش هيشوفه.")}</p>
      </div>

      <div className="space-y-2">
        <Label>{triggerLabel}</Label>
        {allowAny && (
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3">
            <span className="text-sm">{tr("أي منتج في المتجر")}</span>
            <Switch checked={anyProduct} onCheckedChange={setAnyProduct} />
          </label>
        )}
        {!useAny && (
          <>
            {triggers.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {triggers.map((t) => (
                  <li key={t.id} className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-0.5 ps-1 pe-2 text-xs">
                    <span className="relative size-5 overflow-hidden rounded-full bg-muted">
                      <Image src={t.image} alt="" fill sizes="20px" className="object-cover" />
                    </span>
                    <span className="max-w-40 truncate">{t.name}</span>
                    <button
                      type="button"
                      aria-label={tr("شيل {0}", t.name)}
                      onClick={() => setTriggers((list) => list.filter((x) => x.id !== t.id))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <ProductSearch
              exclude={[...triggers.map((t) => t.id), ...(offerProduct ? [offerProduct.id] : [])]}
              onPick={(p) => setTriggers((list) => [...list, p])}
              placeholder={tr("ضيف منتج يشغّل العرض")}
            />
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label>{type === "UPSELL" ? tr("اعرض عليه بداله") : tr("اعرض عليه")}</Label>
        {offerProduct ? (
          <div className="flex items-center gap-3 rounded-lg border border-border p-2">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
              <Image src={offerProduct.image} alt="" fill sizes="40px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{offerProduct.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{money.format(offerProduct.price)}</p>
              {!offerProduct.isActive && <p className="text-xs text-amber-600">{tr("المنتج ده مخفي — العرض مش هيظهر لحد ما تظهره.")}</p>}
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setOfferProduct(null)}>
              {tr("تغيير")}
            </Button>
          </div>
        ) : (
          <ProductSearch exclude={triggers.map((t) => t.id)} onPick={setOfferProduct} placeholder={tr("ابحث باسم المنتج أو الـ SKU")} />
        )}
      </div>

      <div className="space-y-2">
        <Label>{tr("الخصم على المنتج المعروض")}</Label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["PERCENTAGE", tr("نسبة")],
              ["FIXED", tr("مبلغ")],
              ["NONE", tr("من غير خصم")],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setDiscountType(v)}
              aria-pressed={discountType === v}
              className={cn(
                "h-10 rounded-lg border text-sm transition-colors",
                discountType === v ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-foreground/30",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {discountType !== "NONE" && (
          <div className="flex h-10 items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring/30">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              aria-label={tr("قيمة الخصم")}
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-none"
            />
            <span className="pe-3 text-xs text-muted-foreground">{discountType === "PERCENTAGE" ? tr("٪") : tr("ج.م للقطعة")}</span>
          </div>
        )}
        {offerProduct && finalPrice !== null && (
          <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">{tr("العميل هيدفع:")}{" "}</span>
            <span className="font-semibold tabular-nums">{money.format(finalPrice)}</span>
            {finalPrice < offerProduct.price && (
              <span className="ms-1.5 text-xs text-muted-foreground line-through tabular-nums">{money.format(offerProduct.price)}</span>
            )}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <div className="space-y-2">
          <Label htmlFor="offer-headline" className="text-xs">
            {tr("العنوان اللي العميل يشوفه")}{" "}<span className="font-normal text-muted-foreground">{tr("(اختياري)")}</span>
          </Label>
          <Input
            id="offer-headline"
            value={headline}
            maxLength={120}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder={defaultHeadline(type)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-priority" className="text-xs">
            {tr("الأولوية")}
          </Label>
          <Input
            id="offer-priority"
            type="number"
            min={0}
            max={100}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="tabular-nums"
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">{tr("لو أكتر من عرض على نفس المنتج، الأعلى أولوية هو اللي يظهر.")}</p>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3">
        <span>
          <span className="block text-sm font-medium">{tr("شغّال")}</span>
          <span className="block text-xs text-muted-foreground">{tr("لو قفلته، العرض يفضل محفوظ بس مش هيظهر للعملاء.")}</span>
        </span>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter className="gap-2 sm:justify-start">
        <Button type="submit" disabled={pending} className="gap-1.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {offer ? tr("حفظ التعديلات") : tr("إنشاء العرض")}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          {tr("إلغاء")}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ProductSearch({
  exclude,
  onPick,
  placeholder,
}: {
  exclude: string[];
  onPick: (p: OfferProductOption) => void;
  placeholder: string;
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
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="relative border-b border-border">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-10 rounded-none border-0 ps-9 shadow-none focus-visible:ring-0"
        />
        {loading && <Loader2 className="absolute inset-y-0 end-3 my-auto size-4 animate-spin text-muted-foreground" />}
      </div>
      <ul className="max-h-48 overflow-y-auto p-1" role="listbox" aria-label={tr("المنتجات")}>
        {visible?.length === 0 && <li className="px-3 py-5 text-center text-xs text-muted-foreground">{tr("مفيش منتجات بالاسم ده.")}</li>}
        {visible?.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => onPick(p)}
              className="flex w-full items-center gap-3 rounded-md p-1.5 text-start transition-colors hover:bg-muted"
            >
              <span className="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
                <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{money.format(p.price)}</span>
              {!p.isActive && <span className="shrink-0 text-[11px] text-muted-foreground">{tr("مخفي")}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
