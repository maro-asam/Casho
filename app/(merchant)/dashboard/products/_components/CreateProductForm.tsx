"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { CreateProductAction, type ProductFormState } from "@/actions/products/products.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import AttributesInput from "./AttributesInput";
import BundleItemsInput from "./BundleItemsInput";
import MarketingAssistantModal, { type ProductDataForMarketing } from "./MarketingAssistantModal";
import ColorInput from "./ColorInput";
import TagInput from "./TagInput";
import WholesaleInput from "./WholesaleInput";
import { Field, FormSection } from "./product-form/form-section";
import { MediaInput } from "./product-form/media-input";
import { MoneyInput } from "./product-form/money-input";
import { ProductPreview } from "./product-form/product-preview";

type Category = { id: string; name: string };
type AvailableProduct = { id: string; name: string; image: string };

const initialState: ProductFormState = { success: false, message: "" };
const pct = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 });

const toNumber = (value: string) => (value.trim() === "" || Number.isNaN(Number(value)) ? null : Number(value));

function ToggleRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <Switch name={name} defaultChecked={defaultChecked} className="mt-0.5 shrink-0" />
    </label>
  );
}

export default function CreateProductForm({
  categories,
  products = [],
}: {
  categories: Category[];
  products?: AvailableProduct[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(CreateProductAction, initialState);

  // Only what the live preview and the price helpers need is controlled.
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryError, setCategoryError] = useState<string>();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const categoryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!state?.message) return;
    if (state.success) {
      toast.success(state.message);
      // With product data the AI marketing modal opens (below); otherwise go back to the list.
      if (!state.productData) router.push("/products");
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  const marketingData: ProductDataForMarketing | null = state.success ? (state.productData ?? null) : null;

  const priceNum = toNumber(price);
  const compareNum = toNumber(compareAtPrice);
  const costNum = toNumber(costPrice);
  const discount = priceNum && compareNum && compareNum > priceNum ? (1 - priceNum / compareNum) * 100 : null;
  const compareTooLow = priceNum !== null && compareNum !== null && compareNum <= priceNum;
  const profit = priceNum !== null && costNum !== null ? priceNum - costNum : null;
  const margin = profit !== null && priceNum ? (profit / priceNum) * 100 : null;

  function validateBeforeSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!categoryId) {
      e.preventDefault();
      setCategoryError("اختار تصنيف للمنتج");
      categoryRef.current?.focus();
    }
  }

  const saveButton = (
    <Button type="submit" className="h-9 gap-1.5" disabled={isPending || uploading}>
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {isPending ? "جاري الحفظ..." : uploading ? "استنى الصور..." : "حفظ المنتج"}
    </Button>
  );

  return (
    <form action={formAction} onSubmit={validateBeforeSubmit} className="space-y-6">
      {/* Header — sticky under the topbar so Save is always reachable */}
      <div className="sticky top-16 z-20 -mx-4 -mt-6 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm supports-backdrop-filter:bg-background/75 sm:-mx-6 sm:px-6 md:-mx-8 md:-mt-8 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowRight className="size-3.5" />
              المنتجات
            </Link>
            <h1 className="truncate text-xl font-bold tracking-tight">{name.trim() || "منتج جديد"}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" className="hidden h-9 sm:inline-flex">
              <Link href="/products">إلغاء</Link>
            </Button>
            {saveButton}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ─────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          <FormSection title="التفاصيل" description="الاسم والوصف اللي العميل هيشوفهم في صفحة المنتج.">
            <div className="space-y-4">
              <Field label="اسم المنتج" htmlFor="name">
                <Input
                  id="name"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: تيشيرت قطن أسود"
                  className="h-9"
                />
              </Field>
              <Field label="الوصف" htmlFor="description" optional hint="اكتب الخامة والمقاسات وأي تفاصيل تساعد العميل يقرر.">
                <Textarea
                  id="description"
                  name="description"
                  placeholder="وصف واضح لمميزات المنتج..."
                  className="min-h-32 resize-y"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="الصور" description="أول صورة هي اللي بتظهر في المتجر. تقدر تغيّرها بعلامة النجمة.">
            <MediaInput onChange={setImages} onUploadingChange={setUploading} />
          </FormSection>

          <FormSection title="التسعير">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="السعر" htmlFor="price">
                <MoneyInput id="price" name="price" required value={price} onChange={(e) => setPrice(e.target.value)} />
              </Field>
              <Field
                label="السعر قبل الخصم"
                htmlFor="compareAtPrice"
                optional
                error={compareTooLow ? "لازم يكون أكبر من السعر، وإلا مش هيظهر للعميل." : undefined}
                hint={
                  discount !== null ? `هيظهر للعميل خصم ${pct.format(discount)}٪` : "بيظهر مشطوب جنب السعر عشان يبان الخصم."
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
              <Field label="سعر التكلفة" htmlFor="costPrice" optional hint="مش بيظهر للعميل. بنستخدمه نحسب ربحك في التقارير والكاشير.">
                <MoneyInput id="costPrice" name="costPrice" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
              </Field>
              <div className="flex items-end">
                <dl className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
                  <div className="bg-muted/40 px-3 py-2">
                    <dt className="text-xs text-muted-foreground">ربحك في القطعة</dt>
                    <dd
                      className={
                        profit !== null && profit < 0
                          ? "font-semibold tabular-nums text-destructive"
                          : "font-semibold tabular-nums"
                      }
                    >
                      {profit !== null ? money.format(profit) : "—"}
                    </dd>
                  </div>
                  <div className="bg-muted/40 px-3 py-2">
                    <dt className="text-xs text-muted-foreground">هامش الربح</dt>
                    <dd className="font-semibold tabular-nums">{margin !== null ? `${pct.format(margin)}٪` : "—"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </FormSection>

          <FormSection title="المخزون" description="الكمية بتتخصم تلقائي مع كل بيعة أونلاين أو من الكاشير.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الكمية المتاحة" htmlFor="stock">
                <Input id="stock" name="stock" type="number" inputMode="numeric" min="0" step="1" defaultValue="0" className="h-9 tabular-nums" />
              </Field>
              <Field label="نبّهني لما توصل لـ" htmlFor="lowStockThreshold" optional hint="لو سبتها فاضية هننبهك عند ٥ قطع.">
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  placeholder="5"
                  className="h-9 tabular-nums"
                />
              </Field>
              <Field label="SKU" htmlFor="sku" optional hint="كود داخلي تعرف بيه المنتج.">
                <Input id="sku" name="sku" dir="ltr" placeholder="SHIRT-BLK-XL" className="h-9" />
              </Field>
              <Field label="الباركود" htmlFor="barcode" optional hint="للبيع بالسكانر من الكاشير.">
                <Input id="barcode" name="barcode" dir="ltr" inputMode="numeric" placeholder="6221234567890" className="h-9" />
              </Field>
            </div>
          </FormSection>

          <FormSection
            title="المقاسات والألوان"
            description="لو المنتج ليه أكتر من مقاس أو لون، العميل هيختار منهم قبل ما يطلب."
            aside={
              <Switch
                name="hasVariants"
                checked={hasVariants}
                onCheckedChange={setHasVariants}
                aria-label="المنتج ليه مقاسات أو ألوان"
              />
            }
          >
            {hasVariants ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="المقاسات">
                  <TagInput name="sizes" placeholder="S, M, L, XL" hint="دوس Enter أو فاصلة بعد كل مقاس" />
                </Field>
                {/* Full width: the swatch palette needs the room. */}
                <div className="sm:col-span-2">
                  <Field label="الألوان">
                    <ColorInput name="colors" />
                  </Field>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">المنتج ده بنسخة واحدة. فعّل الزرار لو ليه مقاسات أو ألوان.</p>
            )}
          </FormSection>

          {products.length > 0 && (
            <FormSection title="باقة منتجات" description="بيع مجموعة من منتجاتك مع بعض بسعر واحد." collapsible>
              <BundleItemsInput products={products} />
            </FormSection>
          )}

          <FormSection title="أسعار الجملة" description="أسعار أقل لما العميل يطلب كميات أكبر." collapsible>
            <WholesaleInput />
          </FormSection>

          <FormSection title="تفاصيل إضافية" description="الوزن للشحن، وأي خصائص زي الخامة أو بلد الصنع." collapsible>
            <div className="space-y-4">
              <Field label="الوزن" htmlFor="weight" optional hint="بالكيلو، بيتحسب بيه الشحن لو شركة الشحن بتطلبه.">
                <Input id="weight" name="weight" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.5" className="h-9 sm:max-w-40" />
              </Field>
              <Field label="خصائص مخصصة" optional>
                <AttributesInput />
              </Field>
            </div>
          </FormSection>
        </div>

        {/* ── Side column ─────────────────────────────────────────── */}
        <div className="space-y-6">
          <FormSection title="الظهور">
            <div className="divide-y divide-border">
              <ToggleRow name="isActive" label="ظاهر في المتجر" description="العملاء يقدروا يشوفوه ويطلبوه." defaultChecked />
              <ToggleRow name="isFeatured" label="منتج مميز" description="بيظهر في أماكن المنتجات المميزة في واجهة المتجر." />
            </div>
          </FormSection>

          <FormSection title="التنظيم">
            <div className="space-y-4">
              <Field label="التصنيف" htmlFor="categoryId" error={categoryError}>
                <Select
                  value={categoryId}
                  onValueChange={(v) => {
                    setCategoryId(v);
                    setCategoryError(undefined);
                  }}
                  dir="rtl"
                >
                  <SelectTrigger ref={categoryRef} id="categoryId" className="h-9 w-full" aria-invalid={!!categoryError || undefined}>
                    <SelectValue placeholder="اختار تصنيف" />
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
              <Field label="البراند" htmlFor="brand" optional>
                <Input id="brand" name="brand" placeholder="مثال: Nike" className="h-9" />
              </Field>
              <Field label="الوسوم" optional>
                <TagInput name="tags" placeholder="جديد، عروض..." hint="بتساعد العملاء يلاقوا المنتج في البحث." />
              </Field>
            </div>
          </FormSection>

          <div className="lg:sticky lg:top-36">
            <FormSection title="معاينة" description="شكل المنتج في المتجر تقريبًا.">
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

      {/* Bottom save for long forms on mobile */}
      <div className="flex justify-end gap-2 border-t border-border pt-4 lg:hidden">{saveButton}</div>

      {marketingData && (
        <MarketingAssistantModal productData={marketingData} open={!!marketingData} onDone={() => router.push("/products")} />
      )}
    </form>
  );
}
