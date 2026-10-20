"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { ProductFormState } from "@/actions/products/products.actions";
import { LargeTitle, appleButton } from "@/components/saas-page";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import AttributesInput from "../AttributesInput";
import BundleItemsInput, { type BundleItem } from "../BundleItemsInput";
import ColorInput from "../ColorInput";
import MarketingAssistantModal, { type ProductDataForMarketing } from "../MarketingAssistantModal";
import TagInput from "../TagInput";
import WholesaleInput, { type WholesaleTier } from "../WholesaleInput";
import { Field, FormSection, ToggleRow } from "./form-section";
import { MediaInput } from "./media-input";
import { MoneyInput } from "./money-input";
import { ProductPreview } from "./product-preview";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";

export type ProductCategory = { id: string; name: string };
export type BundleCandidate = { id: string; name: string; image: string };

/** Saved values of the product being edited (same shape the edit page selects). */
export type ProductDefaults = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  image: string | null;
  images: string[];
  brand: string | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  lowStockThreshold: number | null;
  sizes: string[];
  colors: string[];
  tags: string[];
  weight: number | null;
  isActive: boolean;
  isFeatured: boolean;
  hasVariants: boolean;
  type: string;
  bundleItems: unknown;
  categoryId: string;
  attributes: unknown;
  wholesaleOptions: unknown;
};

type Props = {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  categories: ProductCategory[];
  /** Simple products that can go in a bundle. */
  products?: BundleCandidate[];
  /** Present when editing. */
  product?: ProductDefaults;
  /** Edit only: the product page on the storefront. */
  storefrontUrl?: string;
};

const initialState: ProductFormState = { success: false, message: "" };
const pct = lazyIntl.number({ maximumFractionDigits: 0 });
const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 2 });

// The action stores this when a product has no image; it isn't a real photo to manage.
const PLACEHOLDER_IMAGE = "/images/product-placeholder.png";

const toNumber = (value: string) => (value.trim() === "" || Number.isNaN(Number(value)) ? null : Number(value));
const asString = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));
const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export function ProductForm({ action, categories, products = [], product, storefrontUrl }: Props) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [state, formAction, isPending] = useActionState(action, initialState);

  // Only what the live preview and the price helpers need is controlled.
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(asString(product?.price));
  const [compareAtPrice, setCompareAtPrice] = useState(asString(product?.compareAtPrice));
  const [costPrice, setCostPrice] = useState(asString(product?.costPrice));
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [categoryError, setCategoryError] = useState<string>();
  const [images, setImages] = useState<string[]>(() =>
    [product?.image, ...(product?.images ?? [])].filter((src): src is string => Boolean(src) && src !== PLACEHOLDER_IMAGE),
  );
  const [uploading, setUploading] = useState(false);
  const [hasVariants, setHasVariants] = useState(product?.hasVariants ?? false);
  const categoryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!state?.message) return;
    if (state.success) {
      toast.success(trv(state.message));
      // New product: with product data the AI marketing modal opens (below); otherwise go back to the list.
      if (!isEdit && !state.productData) router.push("/products");
    } else {
      toast.error(trv(state.message));
    }
  }, [state, router, isEdit]);

  const marketingData: ProductDataForMarketing | null = !isEdit && state.success ? (state.productData ?? null) : null;

  const priceNum = toNumber(price);
  const compareNum = toNumber(compareAtPrice);
  const costNum = toNumber(costPrice);
  const discount = priceNum && compareNum && compareNum > priceNum ? (1 - priceNum / compareNum) * 100 : null;
  const compareTooLow = priceNum !== null && compareNum !== null && compareNum <= priceNum;
  const profit = priceNum !== null && costNum !== null ? priceNum - costNum : null;
  const margin = profit !== null && priceNum ? (profit / priceNum) * 100 : null;

  const bundleItems = asArray<BundleItem>(product?.bundleItems);
  const wholesaleTiers = asArray<WholesaleTier>(product?.wholesaleOptions);
  const attributes = asArray<{ key: string; value: string }>(product?.attributes);

  function validateBeforeSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!categoryId) {
      e.preventDefault();
      setCategoryError(tr("اختار تصنيف للمنتج"));
      categoryRef.current?.focus();
    }
  }

  const busy = isPending || uploading;
  const saveLabel = isPending
    ? tr("جاري الحفظ...")
    : uploading
      ? tr("استنى الصور...")
      : isEdit
        ? tr("حفظ التعديلات")
        : tr("حفظ المنتج");

  return (
    <form action={formAction} onSubmit={validateBeforeSubmit} className="apple-form space-y-6" dir={tdir()}>
      <LargeTitle
        eyebrow={
          <Link
            href="/products"
            className="apple-press -ms-1.5 mb-1 inline-flex h-8 items-center gap-0.5 rounded-full pe-2.5 ps-1 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="size-5 ltr:-scale-x-100" strokeWidth={2.2} />
            {tr("المنتجات")}
          </Link>
        }
        title={<span className="line-clamp-2 break-words">{name.trim() || (isEdit ? tr("تعديل المنتج") : tr("منتج جديد"))}</span>}
        subtitle={
          isEdit
            ? tr("عدّل الاسم والسعر والصورة والتصنيف وحالة المنتج، ثم احفظ التغييرات.")
            : tr("الاسم والوصف اللي العميل هيشوفهم في صفحة المنتج.")
        }
        actions={
          storefrontUrl ? (
            <a href={storefrontUrl} target="_blank" rel="noreferrer" className={appleButton.gray}>
              <ExternalLink className="size-4 text-muted-foreground" />
              {tr("عرض في المتجر")}
            </a>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Main column ─────────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">
          <FormSection title={tr("التفاصيل")} description={tr("الاسم والوصف اللي العميل هيشوفهم في صفحة المنتج.")}>
            <div className="space-y-4">
              <Field label={tr("اسم المنتج")} htmlFor="name">
                <Input
                  id="name"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tr("مثال: تيشيرت قطن أسود")}
                />
              </Field>
              <Field label={tr("الوصف")} htmlFor="description" optional hint={tr("اكتب الخامة والمقاسات وأي تفاصيل تساعد العميل يقرر.")}>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={product?.description ?? ""}
                  placeholder={tr("وصف واضح لمميزات المنتج...")}
                  className="min-h-32 resize-y px-3.5 py-3"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title={tr("الصور")} description={tr("أول صورة هي اللي بتظهر في المتجر. تقدر تغيّرها بعلامة النجمة.")}>
            <MediaInput initialImages={images} onChange={setImages} onUploadingChange={setUploading} />
          </FormSection>

          <FormSection title={tr("التسعير")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("السعر")} htmlFor="price">
                <MoneyInput id="price" name="price" required value={price} onChange={(e) => setPrice(e.target.value)} />
              </Field>
              <Field
                label={tr("السعر قبل الخصم")}
                htmlFor="compareAtPrice"
                optional
                error={compareTooLow ? tr("لازم يكون أكبر من السعر، وإلا مش هيظهر للعميل.") : undefined}
                hint={
                  discount !== null ? tr("هيظهر للعميل خصم {0}٪", pct.format(discount)) : tr("بيظهر مشطوب جنب السعر عشان يبان الخصم.")
                }
              >
                <MoneyInput
                  id="compareAtPrice"
                  name="compareAtPrice"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  aria-invalid={compareTooLow || undefined}
                />
              </Field>
              <Field label={tr("سعر التكلفة")} htmlFor="costPrice" optional hint={tr("مش بيظهر للعميل. بنستخدمه نحسب ربحك في التقارير والكاشير.")}>
                <MoneyInput id="costPrice" name="costPrice" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
              </Field>
              <dl className="grid grid-cols-2 gap-2 self-end">
                <div className="rounded-xl bg-background px-3.5 py-2.5">
                  <dt className="text-[12px] text-muted-foreground">{tr("ربحك في القطعة")}</dt>
                  <dd className={cn("text-[17px] leading-6 font-semibold tabular-nums", profit !== null && profit < 0 && "text-(--sys-red)")}>
                    {profit !== null ? money.format(profit) : "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-background px-3.5 py-2.5">
                  <dt className="text-[12px] text-muted-foreground">{tr("هامش الربح")}</dt>
                  <dd className="text-[17px] leading-6 font-semibold tabular-nums">{margin !== null ? tr("{0}٪", pct.format(margin)) : "—"}</dd>
                </div>
              </dl>
            </div>
          </FormSection>

          <FormSection title={tr("المخزون")} description={tr("الكمية بتتخصم تلقائي مع كل بيعة أونلاين أو من الكاشير.")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("الكمية المتاحة")} htmlFor="stock">
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  defaultValue={product?.stock ?? 0}
                  className="tabular-nums"
                />
              </Field>
              <Field label={tr("نبّهني لما توصل لـ")} htmlFor="lowStockThreshold" optional hint={tr("لو سبتها فاضية هننبهك عند ٥ قطع.")}>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  placeholder="5"
                  defaultValue={product?.lowStockThreshold ?? ""}
                  className="tabular-nums"
                />
              </Field>
              <Field label="SKU" htmlFor="sku" optional hint={tr("كود داخلي تعرف بيه المنتج.")}>
                <Input id="sku" name="sku" dir="ltr" placeholder="SHIRT-BLK-XL" defaultValue={product?.sku ?? ""} />
              </Field>
              <Field label={tr("الباركود")} htmlFor="barcode" optional hint={tr("للبيع بالسكانر من الكاشير.")}>
                <Input
                  id="barcode"
                  name="barcode"
                  dir="ltr"
                  inputMode="numeric"
                  placeholder="6221234567890"
                  defaultValue={product?.barcode ?? ""}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            title={tr("المقاسات والألوان")}
            description={tr("لو المنتج ليه أكتر من مقاس أو لون، العميل هيختار منهم قبل ما يطلب.")}
            aside={
              <Switch
                name="hasVariants"
                checked={hasVariants}
                onCheckedChange={setHasVariants}
                aria-label={tr("المنتج ليه مقاسات أو ألوان")}
                className="mt-0.5"
              />
            }
          >
            {/* When editing, the fields stay mounted while switched off so saving never wipes the saved sizes/colors. */}
            {(hasVariants || isEdit) && (
              <div className={cn("grid gap-4 sm:grid-cols-2", !hasVariants && "hidden")}>
                <Field label={tr("المقاسات")}>
                  <TagInput
                    name="sizes"
                    placeholder="S, M, L, XL"
                    defaultValues={product?.sizes}
                    hint={tr("دوس Enter أو فاصلة بعد كل مقاس")}
                  />
                </Field>
                {/* Full width: the swatch palette needs the room. */}
                <div className="sm:col-span-2">
                  <Field label={tr("الألوان")}>
                    <ColorInput name="colors" defaultValues={product?.colors} />
                  </Field>
                </div>
              </div>
            )}
            {!hasVariants && (
              <p className="rounded-xl bg-background px-4 py-3 text-[15px] text-muted-foreground">
                {tr("المنتج ده بنسخة واحدة. فعّل الزرار لو ليه مقاسات أو ألوان.")}
              </p>
            )}
          </FormSection>

          {products.length > 0 && (
            <FormSection
              title={tr("باقة منتجات")}
              description={tr("بيع مجموعة من منتجاتك مع بعض بسعر واحد.")}
              collapsible
              defaultOpen={product?.type === "BUNDLE"}
            >
              <BundleItemsInput products={products} initialType={product?.type} initialItems={bundleItems} />
            </FormSection>
          )}

          <FormSection
            title={tr("أسعار الجملة")}
            description={tr("أسعار أقل لما العميل يطلب كميات أكبر.")}
            collapsible
            defaultOpen={wholesaleTiers.length > 0}
          >
            <WholesaleInput initialTiers={wholesaleTiers} />
          </FormSection>

          <FormSection
            title={tr("تفاصيل إضافية")}
            description={tr("الوزن للشحن، وأي خصائص زي الخامة أو بلد الصنع.")}
            collapsible
            defaultOpen={attributes.length > 0 || product?.weight != null}
          >
            <div className="space-y-4">
              <Field label={tr("الوزن")} htmlFor="weight" optional hint={tr("بالكيلو، بيتحسب بيه الشحن لو شركة الشحن بتطلبه.")}>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.5"
                  defaultValue={product?.weight ?? ""}
                  className="sm:max-w-40"
                />
              </Field>
              <Field label={tr("خصائص مخصصة")} optional>
                <AttributesInput defaultValues={attributes} />
              </Field>
            </div>
          </FormSection>
        </div>

        {/* ── Side column ─────────────────────────────────────────── */}
        <div className="space-y-5">
          <FormSection title={tr("الظهور")}>
            <div className="apple-rows -my-3 [--row-inset:0px]">
              <ToggleRow
                label={tr("ظاهر في المتجر")}
                description={tr("العملاء يقدروا يشوفوه ويطلبوه.")}
                control={<Switch name="isActive" defaultChecked={product?.isActive ?? true} className="shrink-0" />}
              />
              <ToggleRow
                label={tr("منتج مميز")}
                description={tr("بيظهر في أماكن المنتجات المميزة في واجهة المتجر.")}
                control={<Switch name="isFeatured" defaultChecked={product?.isFeatured ?? false} className="shrink-0" />}
              />
            </div>
          </FormSection>

          <FormSection title={tr("التنظيم")}>
            <div className="space-y-4">
              <Field label={tr("التصنيف")} htmlFor="categoryId" error={categoryError}>
                <Select
                  value={categoryId}
                  onValueChange={(v) => {
                    setCategoryId(v);
                    setCategoryError(undefined);
                  }}
                  dir={tdir()}
                >
                  <SelectTrigger ref={categoryRef} id="categoryId" aria-invalid={!!categoryError || undefined}>
                    <SelectValue placeholder={tr("اختار تصنيف")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="categoryId" value={categoryId} />
              </Field>
              <Field label={tr("البراند")} htmlFor="brand" optional>
                <Input id="brand" name="brand" placeholder={tr("مثال: Nike")} defaultValue={product?.brand ?? ""} />
              </Field>
              <Field label={tr("الوسوم")} optional>
                <TagInput
                  name="tags"
                  placeholder={tr("جديد، عروض...")}
                  defaultValues={product?.tags}
                  hint={tr("بتساعد العملاء يلاقوا المنتج في البحث.")}
                />
              </Field>
            </div>
          </FormSection>

          <div className="lg:sticky lg:top-24">
            <FormSection title={tr("معاينة")} description={tr("شكل المنتج في المتجر تقريبًا.")}>
              <ProductPreview
                name={name}
                image={images[0]}
                price={priceNum}
                compareAtPrice={compareNum}
                categoryName={categories.find((c) => c.id === categoryId)?.name}
              />
            </FormSection>
          </div>
        </div>
      </div>

      {/* Floating toolbar (Liquid Glass): Save is always one tap away, the content scrolls beneath it. */}
      <div className="pointer-events-none sticky bottom-4 z-20 flex justify-center pb-[env(safe-area-inset-bottom)]">
        <div className="apple-glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
          <Link href="/products" className={cn(appleButton.plain, "mx-0 h-10 px-4")}>
            {tr("إلغاء")}
          </Link>
          <button type="submit" className={cn(appleButton.filled, "h-10")} disabled={busy}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {saveLabel}
          </button>
        </div>
      </div>

      {marketingData && (
        <MarketingAssistantModal productData={marketingData} open={!!marketingData} onDone={() => router.push("/products")} />
      )}
    </form>
  );
}
