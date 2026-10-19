import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, Store, Wand2 } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { EmptyState, PageHeader, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { getStoreFont } from "@/constants/arabic-fonts";
import { getThemePreset, resolveStoreTheme } from "@/constants/store-themes";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { readConversionConfig } from "@/lib/conversion/conversion-config";
import { POPUP_TEMPLATES, isPopupType, readPopupConfig } from "@/lib/popups/popup-config";
import { prisma } from "@/lib/prisma";
import { contrastRatio, readableOn } from "@/lib/theme/contrast";
import { DEFAULT_SECTION_ORDER, type SectionKey, type ThemeCustomization } from "@/types/store-theme.types";
import { recentPurchases } from "@/app/store/[slug]/_components/conversion/StoreConversionLayer";

import StoreFontPicker from "./_components/StoreFontPicker";
import StoreIdentitySection from "./_components/StoreIdentitySection";
import ThemeLayoutEditor from "./_components/ThemeLayoutEditor";
import ThemePicker from "./_components/ThemePicker";
import ThemeSectionsEditor from "./_components/ThemeSectionsEditor";
import { PurchaseToastsPanel } from "./_components/growth/purchase-toasts-panel";
import { WhatsAppPanel } from "./_components/growth/whatsapp-panel";
import { PopupEditorDialog, type EditorPopup } from "./_components/popups/popup-editor";
import { PopupsPanel, type PopupListRow } from "./_components/popups/popups-panel";
import { BrandColorsPanel } from "./_components/studio/brand-colors-panel";
import { GrowthTools } from "./_components/studio/growth-tools";
import { BrandSnapshot, HomeOutline, StorePulse, UpcomingSeasons, type Pulse } from "./_components/studio/overview";
import { ReadinessCard, type ReadinessItem } from "./_components/studio/readiness-card";
import { PanelHeader, StudioNav, isStudioTab, studioHref, type StudioTab } from "./_components/studio/studio-nav";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("تخصيص المتجر"),
};
}

const daysAgo = (days: number) => new Date(new Date().getTime() - days * 86400_000);

type CustomizationRouteProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

export default async function CustomizationRoute({ searchParams }: CustomizationRouteProps) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;
  const tabParam = readParam(params, "tab");
  const requestedTab: StudioTab = isStudioTab(tabParam) ? tabParam : "overview";

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      slug: true,
      name: true,
      settings: {
        select: {
          themeId: true,
          primaryColor: true,
          secondaryColor: true,
          fontId: true,
          storeLanguage: true,
          themeConfig: true,
          logo: true,
          logoRadius: true,
          logoSize: true,
          coverImage: true,
          description: true,
          announcementText: true,
          showStoreName: true,
          whatsappNumber: true,
          seoDescription: true,
        },
      },
    },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title={tr("لسه معندكش متجر")}
        description={tr("أنشئ متجرك الأول وبعدها صمّمه من هنا.")}
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  const settings = store.settings;
  const themeConfig = settings?.themeConfig as ThemeCustomization | null;
  const presetId = themeConfig?.presetId ?? settings?.themeId;
  const theme = resolveStoreTheme(presetId, themeConfig, settings?.primaryColor, settings?.secondaryColor);
  const preset = getThemePreset(presetId);
  const font = getStoreFont(settings?.fontId);
  const storeUrl = buildStoreUrl(store.slug);
  const storeHost = storeUrl.replace(/^https?:\/\//, "");

  // New tables/columns: guarded so the page still works before the migration runs.
  // `async` wrappers turn synchronous throws (e.g. a stale Prisma client without
  // the new model) into rejections the fallbacks can catch.
  const [conversionRow, popupRows] = await Promise.all([
    (async () => prisma.storeSettings.findUnique({ where: { storeId: store.id }, select: { conversionConfig: true } }))()
      .then((r) => ({ ok: true as const, value: r?.conversionConfig }))
      .catch((error) => {
        console.error("[customization] conversionConfig:", error);
        return { ok: false as const, value: null };
      }),
    (async () =>
      prisma.storePopup.findMany({ where: { storeId: store.id }, orderBy: [{ priority: "desc" }, { createdAt: "desc" }] }))().catch(
      (error) => {
        console.error("[customization] popups:", error);
        return null;
      },
    ),
  ]);
  const tab = requestedTab;
  const conversion = readConversionConfig(conversionRow.value);

  const popups: PopupListRow[] = (popupRows ?? [])
    .filter((p) => isPopupType(p.type))
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type as PopupListRow["type"],
      isActive: p.isActive,
      config: readPopupConfig(p.config),
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      views: p.views,
      clicks: p.clicks,
      conversions: p.conversions,
    }));
  const now = new Date();
  const livePopups = popups.filter((p) => p.isActive && (!p.startsAt || p.startsAt <= now) && (!p.endsAt || p.endsAt > now));
  const whatsappOn = conversion.whatsapp.enabled && Boolean(conversion.whatsapp.phone || settings?.whatsappNumber);

  const status: Partial<Record<StudioTab, boolean>> = {
    popups: livePopups.length > 0,
    whatsapp: whatsappOn,
    "social-proof": conversion.purchaseToasts.enabled,
  };

  return (
    <div className="space-y-6" dir={tdir()}>
      <link rel="stylesheet" href={font.googleUrl} />
      <PageHeader
        title={tr("تخصيص المتجر")}
        description={tr("شكل متجرك وأدوات البيع اللي بتشتغل فيه — كل تعديل بيتطبق على المتجر فورًا.")}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={storeUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                {tr("عرض المتجر")}
              </a>
            </Button>
            <Button asChild size="sm" className="hidden gap-1.5 lg:inline-flex">
              <Link href="/builder">
                <Wand2 className="size-4" />
                {tr("المحرر المرئي")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
        <aside>
          <StudioNav active={tab} status={status} />
        </aside>

        <div className="min-w-0 space-y-5">
          {tab === "overview" && (
            <Overview
              storeId={store.id}
              storeName={store.name}
              storeHost={storeHost}
              themeName={preset.name}
              fontName={font.name}
              fontFamily={font.family}
              sectionOrder={theme.sections.home.sectionOrder ?? DEFAULT_SECTION_ORDER}
              sectionsEnabled={theme.sections.home as unknown as Partial<Record<SectionKey, boolean>>}
              primary={theme.tokens.primary}
              secondary={theme.tokens.secondary}
              settings={settings}
              sectionsOn={Object.entries(theme.sections.home).filter(([k, v]) => k.startsWith("show") && v === true).length}
              popups={{
                active: livePopups.length,
                views: popups.reduce((s, p) => s + p.views, 0),
                conversions: popups.reduce((s, p) => s + p.conversions, 0),
              }}
              whatsappOn={whatsappOn}
              toastsOn={conversion.purchaseToasts.enabled}
            />
          )}

          {tab === "theme" && (
            <>
              <PanelHeader title={tr("الثيم")} description={tr("نقطة البداية لشكل متجرك. تغيير الثيم بيحافظ على اللوجو والمنتجات والمحتوى.")} />
              <ThemePicker storeId={store.id} currentThemeId={presetId} />
            </>
          )}

          {tab === "colors" && (
            <>
              <PanelHeader title={tr("ألوان علامتك")} description={tr("اختار من باليتة جاهزة أو طلّع ألوانك من اللوجو — وإحنا بنظبط لون الكلام عشان يفضل واضح.")} />
              <BrandColorsPanel
                storeId={store.id}
                storeName={store.name}
                logo={settings?.logo ?? null}
                primaryColor={theme.tokens.primary}
                secondaryColor={theme.tokens.secondary}
                themeDefaults={{ primary: preset.tokens.primary, secondary: preset.tokens.secondary }}
              />
            </>
          )}

          {tab === "fonts" && (
            <>
              <PanelHeader title={tr("الخطوط واللغة")} description={tr("الخط بيدّي إحساس العلامة. اختار خط مريح للقراية على الموبايل.")} />
              <StoreFontPicker storeId={store.id} currentFontId={settings?.fontId} currentLanguage={settings?.storeLanguage} />
            </>
          )}

          {tab === "design" && (
            <>
              <PanelHeader title={tr("شكل العرض")} description={tr("القائمة العلوية، كروت المنتجات، الزراير، وعدد الأعمدة.")} />
              <ThemeLayoutEditor storeId={store.id} currentLayout={theme.layout} />
            </>
          )}

          {tab === "identity" && (
            <>
              <PanelHeader title={tr("الهوية واللوجو")} description={tr("اللوجو، صورة الغلاف، وصف المتجر، وشريط الإعلان اللي فوق.")} />
              <StoreIdentitySection
                storeId={store.id}
                logo={settings?.logo}
                logoRadius={settings?.logoRadius}
                logoSize={settings?.logoSize}
                coverImage={settings?.coverImage}
                description={settings?.description}
                announcementText={settings?.announcementText}
                showStoreName={settings?.showStoreName ?? true}
              />
            </>
          )}

          {tab === "sections" && (
            <>
              <PanelHeader title={tr("أقسام الصفحة الرئيسية")} description={tr("شغّل الأقسام اللي تخدم متجرك ورتّبها بالسحب. الأقسام المقفولة مش بتظهر للعميل.")} />
              <ThemeSectionsEditor storeId={store.id} currentSections={theme.sections} sectionContent={theme.sectionContent} />
            </>
          )}

          {tab === "popups" && (
            <PopupsTab
              storeId={store.id}
              rows={popups}
              popupParam={readParam(params, "popup")}
              templateParam={readParam(params, "template")}
              prefill={{ name: readParam(params, "name"), starts: readParam(params, "starts"), ends: readParam(params, "ends") }}
              themeVars={{
                "--store-primary": theme.tokens.primary,
                "--store-primary-foreground": theme.tokens.primaryForeground,
                "--store-background": theme.tokens.background,
                "--store-card": theme.tokens.card,
                "--store-card-foreground": theme.tokens.cardForeground,
                "--store-muted": theme.tokens.muted,
                "--store-muted-foreground": theme.tokens.mutedForeground,
                "--store-border": theme.tokens.border,
                fontFamily: font.family,
              }}
            />
          )}

          {tab === "whatsapp" && (
            <>
              <PanelHeader
                title={tr("زر واتساب العائم")}
                description={tr("أغلب عملاء مصر بيسألوا قبل ما يشتروا. خلّي السؤال على بُعد ضغطة — والرسالة فيها المنتج اللي بيتفرج عليه.")}
              />
              <WhatsAppPanel storeId={store.id} storeHost={storeHost} initial={conversion.whatsapp} fallbackPhone={settings?.whatsappNumber ?? null} />
            </>
          )}

          {tab === "social-proof" && (
            <SocialProofTab storeId={store.id} initial={conversion.purchaseToasts} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

async function Overview(props: {
  storeId: string;
  storeName: string;
  storeHost: string;
  themeName: string;
  fontName: string;
  fontFamily: string;
  primary: string;
  secondary: string;
  sectionOrder: SectionKey[];
  sectionsEnabled: Partial<Record<SectionKey, boolean>>;
  settings: {
    logo: string | null;
    coverImage: string | null;
    description: string | null;
    seoDescription: string | null;
    primaryColor: string | null;
    announcementText: string | null;
  } | null;
  sectionsOn: number;
  popups: { active: number; views: number; conversions: number };
  whatsappOn: boolean;
  toastsOn: boolean;
}) {
  const weekAgo = daysAgo(7);
  const twoWeeksAgo = daysAgo(14);
  const onlineOrders = (from: Date, to?: Date) =>
    prisma.order.count({
      where: { storeId: props.storeId, source: "ONLINE", status: { not: "CANCELED" }, createdAt: { gte: from, ...(to && { lt: to }) } },
    });

  const [activeBanners, categories, categoriesWithImage, orders, prevOrders, visitRows] = await Promise.all([
    prisma.banner.count({ where: { storeId: props.storeId, isActive: true } }),
    prisma.category.count({ where: { storeId: props.storeId } }),
    prisma.category.count({ where: { storeId: props.storeId, image: { not: null } } }),
    onlineOrders(weekAgo),
    onlineOrders(twoWeeksAgo, weekAgo),
    // One pass: this week, last week, and this week's mobile share.
    prisma.$queryRaw<{ visits: bigint; prev: bigint; mobile: bigint }[]>`
      SELECT
        COUNT(*) FILTER (WHERE "createdAt" >= ${weekAgo}) AS visits,
        COUNT(*) FILTER (WHERE "createdAt" < ${weekAgo}) AS prev,
        COUNT(*) FILTER (WHERE "createdAt" >= ${weekAgo} AND "userAgent" ~* '(mobile|android|iphone|ipod)') AS mobile
      FROM "Visit"
      WHERE "storeId" = ${props.storeId} AND "createdAt" >= ${twoWeeksAgo}
    `.catch(() => [{ visits: BigInt(0), prev: BigInt(0), mobile: BigInt(0) }]),
  ]);

  const v = visitRows[0];
  const pulse: Pulse = {
    visits: Number(v?.visits ?? 0),
    prevVisits: Number(v?.prev ?? 0),
    mobileVisits: Number(v?.mobile ?? 0),
    orders,
    prevOrders,
  };

  const s = props.settings;
  const colorsReadable = contrastRatio(props.primary, readableOn(props.primary)) >= 4.5;
  const items: ReadinessItem[] = [
    { id: "logo", label: tr("لوجو المتجر"), hint: tr("أول حاجة العميل بيشوفها — بتفرق في الثقة."), done: Boolean(s?.logo), href: studioHref("identity"), weight: 3 },
    { id: "banner", label: tr("بانر في الرئيسية"), hint: tr("عرض واضح فوق الصفحة بيزوّد الضغط على المنتجات."), done: activeBanners > 0, href: "/banners", weight: 2 },
    { id: "colors", label: tr("ألوان علامتك"), hint: tr("استخرجها من اللوجو في ثواني."), done: Boolean(s?.primaryColor) && colorsReadable, href: studioHref("colors"), weight: 2 },
    { id: "whatsapp", label: tr("زر واتساب"), hint: tr("أسهل طريق للعميل يسأل ويشتري."), done: props.whatsappOn, href: studioHref("whatsapp"), weight: 2 },
    { id: "description", label: tr("وصف المتجر"), hint: tr("سطرين عن متجرك بيبنوا ثقة."), done: Boolean(s?.description?.trim()), href: studioHref("identity"), weight: 1 },
    { id: "cover", label: tr("صورة غلاف"), hint: tr("بتدّي المتجر شكل احترافي من أول نظرة."), done: Boolean(s?.coverImage), href: studioHref("identity"), weight: 1 },
    {
      id: "categories",
      label: tr("تصنيفات بصور"),
      hint: tr("التصنيفات بالصور بتسهّل التصفح جدًا."),
      done: categories > 0 && categoriesWithImage / categories >= 0.5,
      href: "/categories",
      weight: 1,
    },
    { id: "sections", label: tr("٤ أقسام أو أكتر"), hint: tr("صفحة رئيسية غنية بتطوّل وقت الزيارة."), done: props.sectionsOn >= 4, href: studioHref("sections"), weight: 1 },
    { id: "popup", label: tr("نافذة ترحيب"), hint: tr("كود خصم لأول طلب بيحوّل زوار أكتر."), done: props.popups.active > 0, href: studioHref("popups"), weight: 1 },
    { id: "seo", label: tr("وصف لجوجل"), hint: tr("بيظهر في نتايج البحث وعند المشاركة."), done: Boolean(s?.seoDescription?.trim()), href: "/seo", weight: 1 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <BrandSnapshot
          storeName={props.storeName}
          storeHost={props.storeHost}
          logo={s?.logo ?? null}
          cover={s?.coverImage ?? null}
          description={s?.description ?? null}
          announcement={s?.announcementText ?? null}
          themeName={props.themeName}
          fontName={props.fontName}
          fontFamily={props.fontFamily}
          primary={props.primary}
          secondary={props.secondary}
        />
        <ReadinessCard items={items} />
      </div>

      <StorePulse pulse={pulse} />

      <div className="grid gap-4 lg:grid-cols-2">
        <HomeOutline order={props.sectionOrder} enabled={props.sectionsEnabled} />
        <UpcomingSeasons now={new Date()} />
      </div>

      <GrowthTools popups={props.popups} whatsappOn={props.whatsappOn} toastsOn={props.toastsOn} recentOrders={orders} />
    </div>
  );
}

// ─── Popups ──────────────────────────────────────────────────────────────────

async function PopupsTab({
  storeId,
  rows,
  popupParam,
  templateParam,
  prefill,
  themeVars,
}: {
  storeId: string;
  rows: PopupListRow[];
  popupParam?: string;
  templateParam?: string;
  /** From "upcoming seasons": campaign name + schedule. */
  prefill: { name?: string; starts?: string; ends?: string };
  themeVars: Record<string, string>;
}) {
  let editing: EditorPopup | null = null;
  if (popupParam === "new") {
    const template = POPUP_TEMPLATES.find((t) => t.id === templateParam) ?? POPUP_TEMPLATES[0];
    const validDate = (v?: string) => (v && !Number.isNaN(new Date(v).getTime()) ? new Date(v).toISOString() : null);
    const name = prefill.name?.slice(0, 50);
    editing = {
      id: null,
      name: name ? tr("عرض {0}", name) : template.name,
      type: template.type,
      isActive: false,
      config: name ? { ...template.config, content: { ...template.config.content, eyebrow: name.slice(0, 40) } } : template.config,
      startsAt: validDate(prefill.starts),
      endsAt: validDate(prefill.ends),
    };
  } else if (popupParam) {
    const row = rows.find((r) => r.id === popupParam);
    if (row) {
      editing = {
        id: row.id,
        name: row.name,
        type: row.type,
        isActive: row.isActive,
        config: row.config,
        startsAt: row.startsAt?.toISOString() ?? null,
        endsAt: row.endsAt?.toISOString() ?? null,
      };
    }
  }

  const coupons = editing
    ? await prisma.coupon.findMany({
        where: { storeId },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        select: { code: true, type: true, value: true, isActive: true, expiresAt: true },
      })
    : [];

  // A new discount popup starts with the store's newest active coupon.
  if (editing && !editing.id && editing.type === "discount" && !editing.config.content.couponCode) {
    const first = coupons.find((c) => c.isActive);
    if (first) editing = { ...editing, config: { ...editing.config, content: { ...editing.config.content, couponCode: first.code } } };
  }

  return (
    <>
      <PopupsPanel rows={rows} storeId={storeId} />
      {editing && (
        <PopupEditorDialog
          key={editing.id ?? `new-${templateParam}`}
          storeId={storeId}
          popup={editing}
          themeVars={themeVars}
          coupons={coupons.map((c) => ({
            code: c.code,
            isActive: c.isActive,
            expiresAt: c.expiresAt?.toISOString() ?? null,
            label: c.type === "PERCENTAGE" ? tr("{0}٪", c.value) : tr("{0} ج.م", c.value),
          }))}
        />
      )}
    </>
  );
}

// ─── Social proof ────────────────────────────────────────────────────────────

async function SocialProofTab({ storeId, initial }: { storeId: string; initial: ReturnType<typeof readConversionConfig>["purchaseToasts"] }) {
  const windows = [1, 3, 7, 14, 30];
  const [sample, ...counts] = await Promise.all([
    recentPurchases(storeId, 30),
    ...windows.map((d) =>
      prisma.order.count({
        where: { storeId, source: "ONLINE", status: { not: "CANCELED" }, createdAt: { gte: daysAgo(d) } },
      }),
    ),
  ]);

  return (
    <>
      <PanelHeader
        title={tr("إشعارات الشراء الحية")}
        description={tr("لما الزائر يشوف إن ناس بتشتري فعلًا، بيطمن ويشتري. كله من طلباتك الحقيقية.")}
      />
      <PurchaseToastsPanel
        storeId={storeId}
        initial={initial}
        sample={sample}
        recentCount={Object.fromEntries(windows.map((d, i) => [d, counts[i]]))}
      />
    </>
  );
}

