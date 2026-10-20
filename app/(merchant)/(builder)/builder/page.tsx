import { redirect } from "next/navigation";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { getStoreFont } from "@/constants/arabic-fonts";
import { getThemePreset, resolveStoreTheme } from "@/constants/store-themes";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { readConversionConfig } from "@/lib/conversion/conversion-config";
import { POPUP_TEMPLATES, isPopupType, readPopupConfig } from "@/lib/popups/popup-config";
import { prisma } from "@/lib/prisma";
import { studioStatus } from "@/lib/studio/appearance";
import { workingAppearance } from "@/lib/studio/mutate";
import { contrastRatio, readableOn } from "@/lib/theme/contrast";
import { recentPurchases } from "@/app/store/[slug]/_components/conversion/StoreConversionLayer";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";
import { tr } from "@/lib/i18n/dashboard";
import { BuilderProvider, type PreviewDevice, type ReadinessItem, type StudioPopup } from "./_components/BuilderContext";
import { isPanelId } from "./_components/panel-ids";
import BuilderShell from "./_components/BuilderShell";
import type { EditorPopup } from "./_components/popups/popup-editor";

type BuilderPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86400_000);
const validDate = (v?: string) => (v && !Number.isNaN(new Date(v).getTime()) ? new Date(v).toISOString() : null);

export default async function BuilderPage({ searchParams }: BuilderPageProps) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = (await searchParams) ?? {};
  const panel = isPanelId(params.panel) ? params.panel : "home";

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true, name: true, settings: { select: { whatsappNumber: true, seoDescription: true } } },
  });
  if (!store) redirect("/dashboard");

  const { live, draft, working } = await workingAppearance(store.id);
  const status = studioStatus(live, draft);
  const preset = getThemePreset(working.themeConfig.presetId);
  const theme = resolveStoreTheme(preset.id, working.themeConfig, working.primaryColor, working.secondaryColor);
  const font = getStoreFont(working.fontId);
  const storeUrl = buildStoreUrl(store.slug);

  // Sales tools + readiness signals. Guarded: never block the editor.
  const [conversionRow, popupRows, sampleProduct, activeBanners, categories, categoriesWithImage] = await Promise.all([
    (async () => prisma.storeSettings.findUnique({ where: { storeId: store.id }, select: { conversionConfig: true } }))().catch(
      () => null,
    ),
    (async () => prisma.storePopup.findMany({ where: { storeId: store.id }, orderBy: [{ priority: "desc" }, { createdAt: "desc" }] }))().catch(
      () => [],
    ),
    prisma.product
      .findFirst({ where: { storeId: store.id, isActive: true }, orderBy: { createdAt: "desc" }, select: { slug: true } })
      .catch(() => null),
    prisma.banner.count({ where: { storeId: store.id, isActive: true } }).catch(() => 0),
    prisma.category.count({ where: { storeId: store.id } }).catch(() => 0),
    prisma.category.count({ where: { storeId: store.id, image: { not: null } } }).catch(() => 0),
  ]);
  const conversion = readConversionConfig(conversionRow?.conversionConfig);
  const now = new Date();

  const popups: StudioPopup[] = popupRows
    .filter((p) => isPopupType(p.type))
    .map((p) => {
      const config = readPopupConfig(p.config);
      return {
        id: p.id,
        name: p.name,
        isActive: p.isActive,
        startsAt: p.startsAt?.toISOString() ?? null,
        endsAt: p.endsAt?.toISOString() ?? null,
        views: p.views,
        conversions: p.conversions,
        popup: {
          id: p.id,
          type: p.type as StudioPopup["popup"]["type"],
          priority: p.priority,
          config,
          endsAt: p.endsAt?.toISOString() ?? null,
          couponExpiresAt: null,
        },
      };
    });
  const livePopups = popups.filter(
    (p) => p.isActive && (!p.startsAt || new Date(p.startsAt) <= now) && (!p.endsAt || new Date(p.endsAt) > now),
  ).length;
  const whatsappOn = conversion.whatsapp.enabled && Boolean(conversion.whatsapp.phone || store.settings?.whatsappNumber);
  const homeSections = theme.sections.home as unknown as Record<string, unknown>;
  const sectionsOn = Object.entries(homeSections).filter(([k, v]) => k.startsWith("show") && v === true).length;
  const colorsReadable = contrastRatio(theme.tokens.primary, readableOn(theme.tokens.primary)) >= 4.5;

  const readiness: ReadinessItem[] = [
    { id: "logo", label: tr("لوجو المتجر"), hint: tr("أول حاجة العميل بيشوفها — بتفرق في الثقة."), done: Boolean(working.logo), panel: "identity", weight: 3 },
    { id: "banner", label: tr("بانر في الرئيسية"), hint: tr("عرض واضح فوق الصفحة بيزوّد الضغط على المنتجات."), done: activeBanners > 0, href: "/banners/new", weight: 2 },
    { id: "colors", label: tr("ألوان علامتك"), hint: tr("استخرجها من اللوجو في ثواني."), done: Boolean(working.primaryColor) && colorsReadable, panel: "colors", weight: 2 },
    { id: "whatsapp", label: tr("زر واتساب"), hint: tr("أسهل طريق للعميل يسأل ويشتري."), done: whatsappOn, panel: "whatsapp", weight: 2 },
    { id: "description", label: tr("وصف المتجر"), hint: tr("سطرين عن متجرك بيبنوا ثقة."), done: Boolean(working.description?.trim()), panel: "identity", weight: 1 },
    { id: "cover", label: tr("صورة غلاف"), hint: tr("بتدّي المتجر شكل احترافي من أول نظرة."), done: Boolean(working.coverImage), panel: "identity", weight: 1 },
    {
      id: "categories",
      label: tr("تصنيفات بصور"),
      hint: tr("التصنيفات بالصور بتسهّل التصفح جدًا."),
      done: categories > 0 && categoriesWithImage / categories >= 0.5,
      href: "/categories",
      weight: 1,
    },
    { id: "sections", label: tr("٤ أقسام أو أكتر"), hint: tr("صفحة رئيسية غنية بتطوّل وقت الزيارة."), done: sectionsOn >= 4, panel: "sections", weight: 1 },
    { id: "popup", label: tr("نافذة ترحيب"), hint: tr("كود خصم لأول طلب بيحوّل زوار أكتر."), done: livePopups > 0, panel: "popups", weight: 1 },
    { id: "seo", label: tr("وصف لجوجل"), hint: tr("بيظهر في نتايج البحث وعند المشاركة."), done: Boolean(store.settings?.seoDescription?.trim()), href: "/seo", weight: 1 },
  ];

  // ── Panel-specific data (only for the panel that's open) ────────────────
  let socialProof: { sample: Awaited<ReturnType<typeof recentPurchases>>; recentCount: Record<number, number> } | null = null;
  if (panel === "social-proof") {
    const windows = [1, 3, 7, 14, 30];
    const [sample, ...counts] = await Promise.all([
      recentPurchases(store.id, 30),
      ...windows.map((d) =>
        prisma.order.count({ where: { storeId: store.id, source: "ONLINE", status: { not: "CANCELED" }, createdAt: { gte: daysAgo(d) } } }),
      ),
    ]);
    socialProof = { sample, recentCount: Object.fromEntries(windows.map((d, i) => [d, counts[i]])) };
  }

  // Popup editor (URL-driven: ?popup=new&template=… or ?popup=<id>).
  let editingPopup: EditorPopup | null = null;
  if (params.popup === "new") {
    const template = POPUP_TEMPLATES.find((t) => t.id === params.template) ?? POPUP_TEMPLATES[0];
    const name = params.name?.slice(0, 50);
    editingPopup = {
      id: null,
      name: name ? tr("عرض {0}", name) : template.name,
      type: template.type,
      isActive: false,
      config: name ? { ...template.config, content: { ...template.config.content, eyebrow: name.slice(0, 40) } } : template.config,
      startsAt: validDate(params.starts),
      endsAt: validDate(params.ends),
    };
  } else if (params.popup) {
    const row = popups.find((p) => p.id === params.popup);
    if (row) {
      editingPopup = {
        id: row.id,
        name: row.name,
        type: row.popup.type,
        isActive: row.isActive,
        config: row.popup.config,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
      };
    }
  }
  const coupons = editingPopup
    ? await prisma.coupon
        .findMany({
          where: { storeId: store.id },
          orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
          select: { code: true, type: true, value: true, isActive: true, expiresAt: true },
        })
        .catch(() => [])
    : [];
  // A new discount popup starts with the store's newest active coupon.
  if (editingPopup && !editingPopup.id && editingPopup.type === "discount" && !editingPopup.config.content.couponCode) {
    const first = coupons.find((c) => c.isActive);
    if (first) {
      editingPopup = { ...editingPopup, config: { ...editingPopup.config, content: { ...editingPopup.config.content, couponCode: first.code } } };
    }
  }

  const device: PreviewDevice = params.device === "mobile" || params.device === "tablet" ? params.device : "desktop";

  return (
    <>
      <link rel="stylesheet" href={font.googleUrl} />
      <BuilderProvider
        storeId={store.id}
        storeSlug={store.slug}
        storeName={store.name}
        storeHost={storeUrl.replace(/^https?:\/\//, "")}
        appearance={working}
        theme={{
          presetId: preset.id,
          presetName: preset.name,
          presetTokens: { primary: preset.tokens.primary, secondary: preset.tokens.secondary },
          tokens: theme.tokens,
          layout: { ...theme.layout, navbar: working.navbarVariant as typeof theme.layout.navbar },
          sections: theme.sections,
          sectionContent: theme.sectionContent,
          fontName: font.name,
          fontFamily: font.family,
        }}
        status={status}
        popups={popups}
        conversion={conversion}
        whatsappFallback={store.settings?.whatsappNumber ?? null}
        sampleProductSlug={sampleProduct?.slug ?? null}
        readiness={readiness}
        socialProof={socialProof}
        editingPopup={editingPopup}
        coupons={coupons.map((c) => ({
          code: c.code,
          isActive: c.isActive,
          expiresAt: c.expiresAt?.toISOString() ?? null,
          label: c.type === "PERCENTAGE" ? tr("{0}٪", c.value) : tr("{0} ج.م", c.value),
        }))}
        initialDevice={device}
      >
        <BuilderShell />
      </BuilderProvider>
    </>
  );
}
