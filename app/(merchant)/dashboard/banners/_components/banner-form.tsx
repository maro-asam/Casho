"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BannerLinkType } from "@prisma/client";
import {
  CalendarClock,
  ChevronRight,
  ExternalLink,
  FileText,
  ImageIcon,
  ImageOff,
  LayoutGrid,
  Link2,
  Loader2,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Smartphone,
  Star,
  ImagePlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  CreateBannerAction,
  SearchBannerProductsAction,
  UpdateBannerAction,
  type BannerField,
  type BannerProductOption,
} from "@/actions/admin/banner.actions";
import { Card, LargeTitle, SegmentedButtons, appleButton } from "@/components/saas-page";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  BANNER_CTA_MAX,
  BANNER_DEFAULT_CTA,
  BANNER_LINK_TYPES,
  BANNER_PAGES,
  BANNER_SUBTITLE_MAX,
  BANNER_TITLE_MAX,
  resolveBannerLink,
  type BannerPageKey,
} from "@/lib/banners/banner-link";
import { imageSource, uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

export type EditableBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  image: string;
  mobileImage: string | null;
  isActive: boolean;
  linkType: BannerLinkType;
  linkCategoryId: string | null;
  linkProduct: BannerProductOption | null;
  linkValue: string | null;
  openInNewTab: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export type BannerCategoryOption = { id: string; name: string; slug: string };

/** Store context the form needs to offer and preview destinations. */
export type BannerFormContext = {
  storeId: string;
  storefrontUrl: string;
  categories: BannerCategoryOption[];
  whatsapp: string | null;
};

const UPLOAD_FOLDER = "casho/uploads/banners";

const LINK_ICONS: Record<BannerLinkType, LucideIcon> = {
  PRODUCTS: ShoppingBag,
  CATEGORY: LayoutGrid,
  PRODUCT: Package,
  FEATURED: Star,
  SEARCH: Search,
  PAGE: FileText,
  WHATSAPP: MessageCircle,
  URL: Link2,
  NONE: ImageOff,
};
const LINK_ORDER = Object.keys(BANNER_LINK_TYPES) as BannerLinkType[];

/** ISO → <input type="datetime-local"> value in the merchant's timezone. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

type BannerFormProps = BannerFormContext & {
  /** Present → edit mode. */
  banner?: EditableBanner | null;
};

/** Add / edit a banner on its own page — art, copy, destination, schedule, visibility. */
export function BannerForm({
  storeId,
  storefrontUrl,
  categories,
  whatsapp,
  banner,
}: BannerFormProps) {
  const router = useRouter();
  const isEdit = Boolean(banner);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const [image, setImage] = useState(banner?.image ?? "");
  const [mobileImage, setMobileImage] = useState(banner?.mobileImage ?? "");
  const [showMobile, setShowMobile] = useState(Boolean(banner?.mobileImage));
  const [title, setTitle] = useState(banner?.title ?? "");
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(banner?.ctaLabel ?? "");

  const [linkType, setLinkType] = useState<BannerLinkType>(banner?.linkType ?? "PRODUCTS");
  const [categoryId, setCategoryId] = useState(banner?.linkCategoryId ?? "");
  const [product, setProduct] = useState<BannerProductOption | null>(banner?.linkProduct ?? null);
  const [linkValue, setLinkValue] = useState(banner?.linkValue ?? "");
  const [newTab, setNewTab] = useState(banner?.openInNewTab ?? true);

  const [scheduled, setScheduled] = useState(Boolean(banner?.startsAt || banner?.endsAt));
  const [startsAt, setStartsAt] = useState(toLocalInput(banner?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toLocalInput(banner?.endsAt ?? null));
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);

  const [error, setError] = useState<{ field: BannerField; message: string } | null>(null);
  const busy = pending || uploading;
  const errorFor = (field: BannerField) => (error?.field === field ? error.message : null);

  function pickLinkType(next: BannerLinkType) {
    setLinkType(next);
    // Each type stores its own value; don't carry a keyword into a URL field.
    if (next !== linkType) setLinkValue(next === "PAGE" ? "categories" : "");
    if (error?.field === "link") setError(null);
  }

  const category = categories.find((c) => c.id === categoryId) ?? null;
  const link = resolveBannerLink(
    {
      linkType,
      linkValue,
      openInNewTab: newTab,
      linkCategory: category,
      linkProduct: product && { slug: product.slug, isActive: product.isActive },
    },
    { whatsapp },
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) return setError({ field: "image", message: tr("ضيف صورة للبانر.") });
    if (!title.trim()) return setError({ field: "title", message: tr("اكتب عنوان البانر.") });

    startTransition(async () => {
      const input = {
        title,
        subtitle,
        ctaLabel,
        image,
        mobileImage: showMobile ? mobileImage : null,
        isActive,
        link: {
          linkType,
          linkCategoryId: categoryId || null,
          linkProductId: product?.id ?? null,
          linkValue,
          openInNewTab: newTab,
        },
        startsAt: scheduled ? fromLocalInput(startsAt) : null,
        endsAt: scheduled ? fromLocalInput(endsAt) : null,
      };
      const result = banner ? await UpdateBannerAction(banner.id, storeId, input) : await CreateBannerAction(storeId, input);
      if (!result.ok) {
        if (result.field) setError({ field: result.field, message: result.message });
        else toast.error(trv(result.message));
        return;
      }
      toast.success(banner ? tr("اتحفظت التعديلات") : tr("اتضاف بانر \"{0}\"", title.trim()));
      router.push("/banners");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="apple-form min-w-0 space-y-6">
      <LargeTitle
        eyebrow={
          <Link
            href="/banners"
            className="apple-press -ms-1.5 mb-1 inline-flex h-8 items-center gap-0.5 rounded-full pe-2.5 ps-1 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="size-5 ltr:-scale-x-100" strokeWidth={2.2} />
            {tr("البانرز")}
          </Link>
        }
        title={<span className="line-clamp-2 break-words">{title.trim() || (isEdit ? tr("تعديل البانر") : tr("بانر جديد"))}</span>}
        subtitle={tr("البانرز بتظهر أعلى الصفحة الرئيسية لمتجرك — اختار الصورة والكلام والمكان اللي العميل يروحله.")}
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
          <Card title={tr("الصورة")} subtitle={tr("الصورة والكلام اللي عليها، زي ما هتظهر تقريبًا في المتجر.")}>
            <div className="space-y-3 px-5 pb-5">
                <ImageField
                  id="banner-image"
                  label={tr("الصورة")}
                  value={image}
                  onChange={(v) => {
                    setImage(v);
                    if (error?.field === "image") setError(null);
                  }}
                  onUploading={setUploading}
                  disabled={busy}
                  error={errorFor("image")}
                  sizeHint="1200×400"
                  preview={
                    image ? <PreviewOverlay title={title} subtitle={subtitle} cta={link ? ctaLabel.trim() || BANNER_DEFAULT_CTA : null} /> : null
                  }
                />

                {showMobile ? (
                  <div className="rounded-2xl bg-(--fill-3)/60 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 px-1 text-[13px] font-medium text-foreground/80">
                        <Smartphone className="size-4 text-muted-foreground" />
                        {tr("صورة الموبايل")}
                      </span>
                      <button
                        type="button"
                        className={cn(appleButton.plain, "mx-0 h-8 px-2.5 text-[13px] text-(--sys-red) hover:bg-(--sys-red)/10")}
                        onClick={() => {
                          setShowMobile(false);
                          setMobileImage("");
                        }}
                        disabled={busy}
                      >
                        <X className="size-3.5" />
                        {tr("شيل")}
                      </button>
                    </div>
                    <ImageField
                      id="banner-mobile-image"
                      value={mobileImage}
                      onChange={setMobileImage}
                      onUploading={setUploading}
                      disabled={busy}
                      error={errorFor("mobileImage")}
                      sizeHint="800×1000"
                      aspect="aspect-4/5 max-w-48"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMobile(true)}
                    className="apple-press flex min-h-11 w-full items-center gap-2.5 rounded-xl bg-(--fill-3) px-3.5 py-2.5 text-start text-[15px] text-primary hover:bg-(--fill-3)/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Smartphone className="size-4" />
                    <span className="flex-1">
                      {tr("صورة مخصصة للموبايل")}{" "}<span className="text-[12px] text-muted-foreground">{tr("(اختياري — بالطول، عشان الكلام اللي في الصورة ميتقصّش)")}</span>
                    </span>
                  </button>
                )}
            </div>
          </Card>

          <Card title={tr("الكلام")}>
            <div className="space-y-4 px-5 pb-5">
                <CountedField id="banner-title" label={tr("العنوان")} count={title.trim().length} max={BANNER_TITLE_MAX}>
                  <Input
                    id="banner-title"
                    value={title}
                    maxLength={BANNER_TITLE_MAX}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (error?.field === "title") setError(null);
                    }}
                    placeholder={tr("مثال: خصم ٢٠٪ على الصيفي")}
                    aria-invalid={Boolean(errorFor("title")) || undefined}
                  />
                  <FieldNote error={errorFor("title")}>{tr("بيظهر على البانر في أغلب الثيمات، وكنص بديل للصورة.")}</FieldNote>
                </CountedField>

                <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
                  <CountedField id="banner-subtitle" label={tr("وصف قصير")} optional count={subtitle.trim().length} max={BANNER_SUBTITLE_MAX}>
                    <Input
                      id="banner-subtitle"
                      value={subtitle}
                      maxLength={BANNER_SUBTITLE_MAX}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder={tr("مثال: لحد آخر الشهر أو لحد ما الكمية تخلص")}
                    />
                    <FieldNote error={errorFor("subtitle")} />
                  </CountedField>
                  <CountedField id="banner-cta" label={tr("نص الزرار")} optional count={ctaLabel.trim().length} max={BANNER_CTA_MAX}>
                    <Input
                      id="banner-cta"
                      value={ctaLabel}
                      maxLength={BANNER_CTA_MAX}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      placeholder={BANNER_DEFAULT_CTA}
                      disabled={linkType === "NONE"}
                    />
                    <FieldNote error={errorFor("ctaLabel")} />
                  </CountedField>
                </div>
            </div>
          </Card>

          <Card title={tr("البانر هيودّي العميل فين؟")} subtitle={tr("لما العميل يدوس على البانر أو الزرار.")}>
            <div className="space-y-3 px-5 pb-5">

                <div role="radiogroup" aria-label={tr("وجهة البانر")} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {LINK_ORDER.map((type) => {
                    const Icon = LINK_ICONS[type];
                    const selected = linkType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => pickLinkType(type)}
                        className={cn(
                          "apple-press flex items-start gap-2.5 rounded-xl p-3 text-start transition-colors duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected ? "bg-primary/10 ring-2 ring-primary ring-inset" : "bg-(--fill-3) hover:bg-(--fill-3)/70",
                        )}
                      >
                        <Icon className={cn("mt-0.5 size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                        <span className="min-w-0">
                          <span className="block text-[15px] leading-5">{BANNER_LINK_TYPES[type].label}</span>
                          <span className="block text-[12px] leading-4 text-muted-foreground">{BANNER_LINK_TYPES[type].hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <LinkTargetField
                  storeId={storeId}
                  linkType={linkType}
                  categories={categories}
                  categoryId={categoryId}
                  onCategory={setCategoryId}
                  product={product}
                  onProduct={setProduct}
                  value={linkValue}
                  onValue={setLinkValue}
                  newTab={newTab}
                  onNewTab={setNewTab}
                  whatsapp={whatsapp}
                  invalid={Boolean(errorFor("link"))}
                />
                {errorFor("link") ? (
                  <p role="alert" className="px-1 text-[12px] font-medium text-(--sys-red)">{errorFor("link")}</p>
                ) : (
                  <DestinationPreview link={link} linkType={linkType} storefrontUrl={storefrontUrl} />
                )}
            </div>
          </Card>
        </div>

        {/* ── Side column ─────────────────────────────────────────── */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card title={tr("النشر")}>
            <div className="space-y-3 px-5 pb-5">
                <label htmlFor="banner-scheduled" className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl bg-(--fill-3)/60 px-4 py-3">
                  <span className="flex items-start gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-[7px] bg-(--sys-orange) text-white">
                      <CalendarClock className="size-4" />
                    </span>
                    <span className="space-y-0.5">
                      <span className="block text-[15px] leading-5">{tr("جدولة البانر")}</span>
                      <span className="block text-[13px] leading-[18px] text-muted-foreground">{tr("يظهر ويختفي لوحده في الوقت اللي تحدده — مناسب للعروض والمواسم.")}</span>
                    </span>
                  </span>
                  <Switch id="banner-scheduled" checked={scheduled} onCheckedChange={setScheduled} disabled={busy} />
                </label>

                {scheduled && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="banner-start" className="block px-1 text-[13px] font-medium text-foreground/80">
                        {tr("يبدأ")}{" "}<span className="font-normal text-muted-foreground">{tr("(فاضي = من دلوقتي)")}</span>
                      </label>
                      <Input id="banner-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="text-[13px]" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="banner-end" className="block px-1 text-[13px] font-medium text-foreground/80">
                        {tr("ينتهي")}{" "}<span className="font-normal text-muted-foreground">{tr("(فاضي = مفتوح)")}</span>
                      </label>
                      <Input id="banner-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="text-[13px]" />
                    </div>
                    {errorFor("schedule") && <p role="alert" className="px-1 text-[12px] font-medium text-(--sys-red) sm:col-span-2">{errorFor("schedule")}</p>}
                  </div>
                )}

                <label htmlFor="banner-active" className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl bg-(--fill-3)/60 px-4 py-3">
                  <span className="space-y-0.5">
                    <span className="block text-[15px] leading-5">{tr("ظاهر في المتجر")}</span>
                    <span className="block text-[13px] leading-[18px] text-muted-foreground">{tr("لو قفلته، البانر يفضل محفوظ بس العملاء مش هيشوفوه.")}</span>
                  </span>
                  <Switch id="banner-active" checked={isActive} onCheckedChange={setIsActive} disabled={busy} />
                </label>
            </div>
          </Card>
        </div>
      </div>

      {/* Floating toolbar (Liquid Glass): Save is always one tap away, the content scrolls beneath it. */}
      <div className="pointer-events-none sticky bottom-4 z-20 flex justify-center pb-[env(safe-area-inset-bottom)]">
        <div className="apple-glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
          <Link href="/banners" className={cn(appleButton.plain, "mx-0 h-10 px-4")}>
            {tr("إلغاء")}
          </Link>
          <button type="submit" disabled={busy} className={cn(appleButton.filled, "h-10")}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? tr("حفظ التعديلات") : tr("إضافة البانر")}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Destination fields ──────────────────────────────────────────────────────

type LinkTargetFieldProps = {
  storeId: string;
  linkType: BannerLinkType;
  categories: BannerCategoryOption[];
  categoryId: string;
  onCategory: (id: string) => void;
  product: BannerProductOption | null;
  onProduct: (p: BannerProductOption | null) => void;
  value: string;
  onValue: (v: string) => void;
  newTab: boolean;
  onNewTab: (v: boolean) => void;
  whatsapp: string | null;
  invalid: boolean;
};

function LinkTargetField(props: LinkTargetFieldProps) {
  const { linkType, value, onValue, invalid } = props;

  switch (linkType) {
    case "CATEGORY":
      return props.categories.length === 0 ? (
        <EmptyHint text={tr("لسه مفيش أقسام في متجرك.")} href="/categories" action={tr("ضيف قسم")} />
      ) : (
        <Select dir={tdir()} value={props.categoryId} onValueChange={props.onCategory}>
          <SelectTrigger aria-invalid={invalid || undefined}>
            <SelectValue placeholder={tr("اختار القسم")} />
          </SelectTrigger>
          <SelectContent>
            {props.categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "PRODUCT":
      return <ProductPicker storeId={props.storeId} value={props.product} onChange={props.onProduct} invalid={invalid} />;

    case "SEARCH":
      return (
        <Input
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder={tr("مثال: صيفي — هيفتح كل المنتجات اللي فيها الكلمة دي")}
          aria-invalid={invalid || undefined}
        />
      );

    case "PAGE":
      return (
        <Select dir={tdir()} value={value || "categories"} onValueChange={onValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(BANNER_PAGES) as BannerPageKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {BANNER_PAGES[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "WHATSAPP":
      return (
        <div className="space-y-2">
          {!props.whatsapp && <EmptyHint text={tr("مفيش رقم واتساب في إعدادات متجرك — البانر هيودّي على المنتجات لحد ما تضيفه.")} href="/settings" action={tr("ضيف الرقم")} />}
          <Textarea
            value={value}
            onChange={(e) => onValue(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder={tr("الرسالة اللي هتتكتب للعميل جاهزة، مثال: عايز أعرف تفاصيل عرض الصيف")}
            className="resize-none px-3.5 py-3"
          />
        </div>
      );

    case "URL":
      return (
        <div className="space-y-2">
          <div className="relative">
            <Link2 className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-muted-foreground" />
            <Input
              dir="ltr"
              value={value}
              onChange={(e) => onValue(e.target.value)}
              placeholder={tr("https://… أو /products?sort=price-asc")}
              aria-invalid={invalid || undefined}
              className="ps-10"
            />
          </div>
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl bg-(--fill-3)/60 px-4 py-2 text-[15px]">
            {tr("افتح الرابط في تبويب جديد")}
            <Switch checked={props.newTab} onCheckedChange={props.onNewTab} />
          </label>
        </div>
      );

    default:
      return null;
  }
}

/** "Customer goes to …" — the resolved URL, so the merchant sees exactly where the click lands. */
function DestinationPreview({
  link,
  linkType,
  storefrontUrl,
}: {
  link: ReturnType<typeof resolveBannerLink>;
  linkType: BannerLinkType;
  storefrontUrl: string;
}) {
  if (!link) {
    return <p className="px-1 text-[12px] text-muted-foreground">{tr("البانر هيظهر كصورة بس، من غير زرار ومن غير ما يتداس عليه.")}</p>;
  }
  const href = link.external ? link.href : `${storefrontUrl}${link.href}`;
  const display = href.replace(/^https?:\/\//, "");
  // Incomplete pickers resolve to "/products" — say so instead of implying it's final.
  const pendingPick = (linkType === "CATEGORY" || linkType === "PRODUCT" || linkType === "SEARCH") && link.href === "/products";

  return (
    <div className="flex min-h-10 items-center gap-2 rounded-xl bg-(--fill-3)/60 px-3.5 py-2 text-[13px]">
      <span className="shrink-0 text-muted-foreground">{pendingPick ? tr("لحد ما تختار:") : tr("العميل هيروح على:")}</span>
      <a href={href} target="_blank" rel="noreferrer" dir="ltr" className="min-w-0 flex-1 truncate font-mono text-[12px] text-primary hover:underline">
        {decodeURI(display)}
      </a>
      <ExternalLink className="size-3.5 shrink-0 text-primary" />
    </div>
  );
}

function ProductPicker({
  storeId,
  value,
  onChange,
  invalid,
}: {
  storeId: string;
  value: BannerProductOption | null;
  onChange: (p: BannerProductOption | null) => void;
  invalid: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BannerProductOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const searching = !value;

  useEffect(() => {
    if (!searching) return;
    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await SearchBannerProductsAction(storeId, query);
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
  }, [storeId, query, searching]);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-(--fill-3)/60 p-2.5">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-[10px] bg-muted">
          <Image src={value.image} alt="" fill sizes="40px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px]">{value.name}</p>
          {!value.isActive && <p className="text-[12px] text-foreground/80">{tr("المنتج ده مخفي — البانر هيودّي على كل المنتجات لحد ما تظهره.")}</p>}
        </div>
        <button type="button" className={cn(appleButton.plain, "mx-0 h-9 px-3")} onClick={() => onChange(null)}>
          {tr("تغيير")}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl bg-(--fill-3)/60", invalid && "ring-2 ring-(--sys-red)/60")}>
      <div className="relative p-2">
        <Search className="pointer-events-none absolute inset-y-0 start-5 my-auto size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr("ابحث باسم المنتج أو الـ SKU")}
          className="h-10! bg-popover! ps-9"
          autoFocus
        />
        {loading && <Loader2 className="absolute inset-y-0 end-5 my-auto size-4 animate-spin text-muted-foreground" />}
      </div>
      <ul className="max-h-56 overflow-y-auto px-2 pb-2" role="listbox" aria-label={tr("المنتجات")}>
        {results?.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">{tr("مفيش منتجات بالاسم ده.")}</li>}
        {results?.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => onChange(p)}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl p-1.5 text-start transition-colors hover:bg-(--fill-3) focus-visible:bg-(--fill-3) focus-visible:outline-none"
            >
              <span className="relative size-9 shrink-0 overflow-hidden rounded-[9px] bg-muted">
                <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px]">{p.name}</span>
              {!p.isActive && <span className="shrink-0 text-[12px] text-muted-foreground">{tr("مخفي")}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyHint({ text, href, action }: { text: string; href: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-(--sys-orange)/12 px-3.5 py-2.5 text-[13px] leading-5">
      <span className="text-foreground/85">{text}</span>
      <Link href={href} className="shrink-0 text-primary hover:underline">
        {action}
      </Link>
    </div>
  );
}

// ── Small field helpers ─────────────────────────────────────────────────────

function CountedField({
  id,
  label,
  optional,
  count,
  max,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  count: number;
  max: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <label htmlFor={id} className="text-[13px] font-medium text-foreground/80">
          {label}
          {optional && <span className="ms-1 font-normal text-muted-foreground">{tr("(اختياري)")}</span>}
        </label>
        <span className="text-[12px] text-muted-foreground tabular-nums">
          {count}/{max}
        </span>
      </div>
      {children}
    </div>
  );
}

function FieldNote({ error, children }: { error: string | null; children?: React.ReactNode }) {
  if (error) return <p role="alert" className="px-1 text-[12px] font-medium text-(--sys-red)">{error}</p>;
  return children ? <p className="px-1 text-[12px] leading-[17px] text-muted-foreground">{children}</p> : null;
}

/** Title / subtitle / button drawn over the image, roughly as themes render them. */
function PreviewOverlay({ title, subtitle, cta }: { title: string; subtitle: string; cta: string | null }) {
  if (!title.trim() && !subtitle.trim()) return null;
  return (
    <>
      <span aria-hidden className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/20 to-transparent" />
      <span className="absolute inset-y-0 start-0 flex max-w-[70%] flex-col justify-center gap-1 p-4 text-white">
        <span className="line-clamp-2 text-base font-bold leading-snug">{title}</span>
        {subtitle.trim() && <span className="line-clamp-1 text-xs text-white/85">{subtitle}</span>}
        {cta && <span className="mt-1.5 self-start rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-neutral-900">{cta}</span>}
      </span>
    </>
  );
}

function ImageField({
  id,
  label,
  value,
  onChange,
  onUploading,
  disabled,
  error,
  sizeHint,
  aspect = "aspect-3/1 w-full",
  preview,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (url: string) => void;
  onUploading: (uploading: boolean) => void;
  disabled: boolean;
  error: string | null;
  sizeHint: string;
  aspect?: string;
  preview?: React.ReactNode;
}) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [uploading, setUploading] = useState(false);
  const inputId = `${id}-upload`;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUploading(true);
      onUploading(true);
      onChange(await uploadImageToCloudinary(file, UPLOAD_FOLDER));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr("فشل رفع الصورة"));
    } finally {
      setUploading(false);
      onUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {(label || !value) && (
        <div className="flex items-center justify-between gap-3 px-1">
          {label ? <span className="text-[13px] font-medium text-foreground/80">{label}</span> : <span />}
          {!value && (
            <SegmentedButtons
              role="tablist"
              label={tr("طريقة إضافة الصورة")}
              value={mode}
              onChange={setMode}
              options={[
                ["upload", tr("رفع")],
                ["link", tr("رابط")],
              ]}
            />
          )}
        </div>
      )}

      {value ? (
        <div className="space-y-2">
          <div className={cn("relative overflow-hidden rounded-2xl bg-muted", aspect)}>
            <Image src={value} alt="" fill sizes="640px" className="object-cover" />
            {preview}
          </div>
          <div className="flex items-center justify-between gap-3 ps-1">
            <p className="min-w-0 truncate text-[12px] text-muted-foreground" dir="ltr">
              {imageSource(value)}
            </p>
            <div className="flex shrink-0 gap-1">
              <label
                htmlFor={inputId}
                className={cn(appleButton.plain, "mx-0 h-8 cursor-pointer px-2.5 text-[13px]", disabled && "pointer-events-none opacity-50")}
              >
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                {tr("تغيير")}
              </label>
              <button
                type="button"
                className={cn(appleButton.plain, "mx-0 h-8 px-2.5 text-[13px] text-(--sys-red) hover:bg-(--sys-red)/10")}
                onClick={() => onChange("")}
                disabled={disabled}
              >
                {tr("شيل")}
              </button>
            </div>
          </div>
        </div>
      ) : mode === "upload" ? (
        <label
          htmlFor={inputId}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-(--label-3)/60 bg-(--fill-3)/50 text-center transition-colors duration-200 ease-(--ease-apple) hover:bg-(--fill-3) focus-within:ring-2 focus-within:ring-primary/40",
            aspect,
            error && "border-(--sys-red)/60",
            uploading && "pointer-events-none",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-7 animate-spin text-primary" strokeWidth={1.6} />
              <span className="text-[15px]">{tr("بنرفع الصورة…")}</span>
            </>
          ) : (
            <>
              <ImagePlus className="size-7 text-primary" strokeWidth={1.6} />
              <span className="text-[15px] text-primary">{tr("اضغط لرفع صورة")}</span>
              <span className="text-[12px] text-muted-foreground">
                {tr("أفضل مقاس")}{" "}
                <span className="font-mono" dir="ltr">
                  {sizeHint}
                </span>{" "}{tr("— لحد ٥ ميجا")}
              </span>
            </>
          )}
        </label>
      ) : (
        <LinkInput invalid={Boolean(error)} aspect={aspect} onSubmit={onChange} />
      )}
      <input id={inputId} type="file" accept="image/*" className="sr-only" onChange={onFile} disabled={uploading} />
      {error && <p role="alert" className="px-1 text-[12px] font-medium text-(--sys-red)">{error}</p>}
    </div>
  );
}

function LinkInput({ onSubmit, invalid, aspect }: { onSubmit: (url: string) => void; invalid?: boolean; aspect: string }) {
  const [value, setValue] = useState("");
  const valid = /^https?:\/\/\S+$/i.test(value.trim());

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center justify-center rounded-2xl bg-(--fill-3)/50", aspect)}>
        <ImageIcon className="size-8 text-(--label-3)" strokeWidth={1.5} />
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-muted-foreground" />
          <Input
            type="url"
            dir="ltr"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (valid) onSubmit(value.trim());
              }
            }}
            placeholder="https://…"
            aria-invalid={invalid || undefined}
            className="ps-10"
          />
        </div>
        <button type="button" className={cn(appleButton.tinted, "h-11 text-primary")} disabled={!valid} onClick={() => onSubmit(value.trim())}>
          {tr("استخدام")}
        </button>
      </div>
    </div>
  );
}
