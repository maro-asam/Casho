import type { Metadata } from "next";
import { ExternalLink, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { LargeTitle, Unavailable, appleButton } from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { metaText, storeBaseUrl } from "@/lib/seo/store-seo";
import { SeoForm } from "./_components/seo-form";
import { SeoHealth, type SeoCheck } from "./_components/seo-health";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("الظهور في جوجل"),
};
}

const nf = lazyIntl.number();

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`);

export default async function SeoRoute() {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      paymentMethods: true,
      settings: {
        select: {
          seoTitle: true,
          seoDescription: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true,
          isIndexed: true,
          googleSiteVerification: true,
          logo: true,
          description: true,
        },
      },
    },
  });

  if (!store) {
    return (
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول وبعدها ظبّط ظهوره في جوجل.")} />
      </div>
    );
  }

  const s = store.settings;
  const storeUrl = storeBaseUrl(store);

  const [products, noDescription, shortDescription, noImage, categories, categoriesNoImage, reviews, topCategories] = await Promise.all([
    prisma.product.count({ where: { storeId: store.id, isActive: true } }),
    prisma.product.count({ where: { storeId: store.id, isActive: true, OR: [{ description: null }, { description: "" }] } }),
    prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*) AS n FROM "Product"
      WHERE "storeId" = ${store.id} AND "isActive" = true
        AND "description" IS NOT NULL AND length(trim("description")) BETWEEN 1 AND 79`.then((r) => Number(r[0]?.n ?? 0)),
    prisma.product.count({
      where: { storeId: store.id, isActive: true, image: { contains: "product-placeholder" }, images: { isEmpty: true } },
    }),
    prisma.category.count({ where: { storeId: store.id } }),
    prisma.category.count({ where: { storeId: store.id, image: null } }),
    prisma.productReview.count({ where: { storeId: store.id } }),
    prisma.category.findMany({
      where: { storeId: store.id, products: { some: { isActive: true } } },
      orderBy: { products: { _count: "desc" } },
      take: 3,
      select: { name: true },
    }),
  ]);

  // ── Suggestions built from the store's own data ───────────────────────
  const cats = topCategories.map((c) => c.name);
  const cod = store.paymentMethods.includes("cash_on_delivery");
  const titleSuggestions = [
    cats.length ? `${store.name} | ${cats.slice(0, 2).join(tr(" و"))}` : null,
    tr("{0} — تسوّق أونلاين في مصر", store.name),
    cats[0] ? tr("{0} أونلاين | {1}", cats[0], store.name) : null,
  ]
    .filter((t): t is string => Boolean(t))
    .map((t) => clip(t, 60));
  const descriptionSuggestions = [
    tr("تسوّق {0} من {1}. توصيل لكل المحافظات{2}.", cats.length ? cats.slice(0, 3).join(tr(" و")) : tr("منتجاتنا"), store.name, cod ? tr(" والدفع عند الاستلام") : ""),
    s?.description ? metaText(s.description, 158) : null,
  ]
    .filter((t): t is string => Boolean(t && t.length >= 40))
    .map((t) => clip(t, 160));

  const fallbacks = {
    title: store.name,
    description: tr("تصفح منتجات {0} واطلب بسهولة من خلال المتجر الإلكتروني.", store.name),
    image: s?.logo ?? null,
  };

  const descLen = (s?.seoDescription ?? "").trim().length;
  const checks: SeoCheck[] = [
    {
      id: "indexed",
      label: tr("المتجر ظاهر لجوجل"),
      detail: tr("الأرشفة مقفولة — جوجل مش هيظهر أي صفحة من متجرك."),
      severity: "critical",
      done: s?.isIndexed !== false,
      weight: 3,
    },
    {
      id: "title",
      label: tr("عنوان للمتجر"),
      detail: tr("اكتب عنوان فيه اسمك ونوع منتجاتك — أهم سطر في نتيجة البحث."),
      severity: "warn",
      done: (s?.seoTitle ?? "").trim().length >= 15,
      weight: 2,
    },
    {
      id: "description",
      label: tr("وصف بطول مناسب"),
      detail: descLen ? tr("الوصف {0} حرف — الأفضل بين ٧٠ و١٦٠.", nf.format(descLen)) : tr("مفيش وصف — جوجل هيختار كلام عشوائي من الصفحة."),
      severity: "warn",
      done: descLen >= 70 && descLen <= 160,
      weight: 2,
    },
    {
      id: "products-desc",
      label: tr("كل المنتجات ليها وصف"),
      detail: tr("{0} منتج من غير وصف — بيظهروا في جوجل بوصف عام وبيترتبوا أقل.", nf.format(noDescription)),
      severity: "warn",
      done: products > 0 && noDescription === 0,
      weight: 3,
      href: "/products",
    },
    {
      id: "products-short",
      label: tr("أوصاف المنتجات كفاية"),
      detail: tr("{0} منتج وصفه أقل من ٨٠ حرف. اكتب الخامة والمقاسات والاستخدام.", nf.format(shortDescription)),
      severity: "tip",
      done: products > 0 && shortDescription === 0,
      weight: 2,
      href: "/products",
    },
    {
      id: "products-image",
      label: tr("كل المنتجات ليها صور"),
      detail: tr("{0} منتج من غير صورة — مش هيظهر في بحث الصور ولا بشكل حلو في المشاركة.", nf.format(noImage)),
      severity: "warn",
      done: products > 0 && noImage === 0,
      weight: 2,
      href: "/products",
    },
    {
      id: "share-image",
      label: tr("صورة للمشاركة"),
      detail: tr("ارفع صورة أو لوجو عشان اللينك يبان حلو على واتساب وفيسبوك."),
      severity: "tip",
      done: Boolean(s?.ogImage || s?.logo),
      weight: 1,
    },
    {
      id: "search-console",
      label: tr("مربوط بـ Search Console"),
      detail: tr("اربطه عشان تبعت خريطة الموقع وتشوف الناس بتدوّر بإيه."),
      severity: "warn",
      done: Boolean(s?.googleSiteVerification),
      weight: 2,
    },
    {
      id: "categories-image",
      label: tr("التصنيفات ليها صور"),
      detail: tr("{0} تصنيف من غير صورة.", nf.format(categoriesNoImage)),
      severity: "tip",
      done: categories > 0 && categoriesNoImage === 0,
      weight: 1,
      href: "/categories",
    },
    {
      id: "reviews",
      label: tr("مراجعات على المنتجات"),
      detail: tr("المنتجات اللي ليها مراجعات بتظهر بالنجوم في نتايج جوجل."),
      severity: "tip",
      done: reviews > 0,
      weight: 1,
      href: "/reviews",
    },
    {
      id: "domain",
      label: tr("دومين خاص"),
      detail: tr("دومين باسمك بيبني ثقة وسمعة في البحث أحسن من الرابط الفرعي."),
      severity: "tip",
      done: store.customDomainStatus === "ACTIVE" && Boolean(store.customDomain),
      weight: 1,
      href: "/domain",
    },
  ];

  return (
    <div className="space-y-10" dir={tdir()}>
      <div className="space-y-6">
        <LargeTitle
          title={tr("الظهور في جوجل")}
          subtitle={tr("ازاي متجرك ومنتجاته بيظهروا في البحث وفي المشاركات — وإيه اللي يخليهم يظهروا أحسن.")}
          actions={
            <a
              href={`https://www.google.com/search?q=site:${encodeURIComponent(storeUrl.replace(/^https?:\/\//, ""))}`}
              target="_blank"
              rel="noreferrer"
              className={appleButton.gray}
            >
              <ExternalLink className="size-4" />
              {tr("شوف متجرك في جوجل")}
            </a>
          }
        />
        <SeoHealth checks={checks} />
      </div>

      <SeoForm
        storeId={store.id}
        storeName={store.name}
        storeUrl={storeUrl}
        logo={s?.logo ?? null}
        initial={{
          seoTitle: s?.seoTitle ?? "",
          seoDescription: s?.seoDescription ?? "",
          ogTitle: s?.ogTitle ?? "",
          ogDescription: s?.ogDescription ?? "",
          ogImage: s?.ogImage ?? "",
          googleSiteVerification: s?.googleSiteVerification ?? "",
          isIndexed: s?.isIndexed ?? true,
        }}
        fallbacks={fallbacks}
        suggestions={{ titles: titleSuggestions, descriptions: descriptionSuggestions }}
      />
    </div>
  );
}
