import type { Metadata } from "next";
import { ExternalLink, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { EmptyState, PageHeader } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { metaText, storeBaseUrl } from "@/lib/seo/store-seo";
import { SeoForm } from "./_components/seo-form";
import { SeoHealth, type SeoCheck } from "./_components/seo-health";

export const metadata: Metadata = {
  title: "الظهور في جوجل",
};

const nf = new Intl.NumberFormat("ar-EG");

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`);

export default async function SeoRoute() {
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
      <EmptyState
        icon={Store}
        title="لسه معندكش متجر"
        description="أنشئ متجرك الأول وبعدها ظبّط ظهوره في جوجل."
        className="rounded-xl border border-dashed border-border"
      />
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
    cats.length ? `${store.name} | ${cats.slice(0, 2).join(" و")}` : null,
    `${store.name} — تسوّق أونلاين في مصر`,
    cats[0] ? `${cats[0]} أونلاين | ${store.name}` : null,
  ]
    .filter((t): t is string => Boolean(t))
    .map((t) => clip(t, 60));
  const descriptionSuggestions = [
    `تسوّق ${cats.length ? cats.slice(0, 3).join(" و") : "منتجاتنا"} من ${store.name}. توصيل لكل المحافظات${cod ? " والدفع عند الاستلام" : ""}.`,
    s?.description ? metaText(s.description, 158) : null,
  ]
    .filter((t): t is string => Boolean(t && t.length >= 40))
    .map((t) => clip(t, 160));

  const fallbacks = {
    title: store.name,
    description: `تصفح منتجات ${store.name} واطلب بسهولة من خلال المتجر الإلكتروني.`,
    image: s?.logo ?? null,
  };

  const descLen = (s?.seoDescription ?? "").trim().length;
  const checks: SeoCheck[] = [
    {
      id: "indexed",
      label: "المتجر ظاهر لجوجل",
      detail: "الأرشفة مقفولة — جوجل مش هيظهر أي صفحة من متجرك.",
      severity: "critical",
      done: s?.isIndexed !== false,
      weight: 3,
    },
    {
      id: "title",
      label: "عنوان للمتجر",
      detail: "اكتب عنوان فيه اسمك ونوع منتجاتك — أهم سطر في نتيجة البحث.",
      severity: "warn",
      done: (s?.seoTitle ?? "").trim().length >= 15,
      weight: 2,
    },
    {
      id: "description",
      label: "وصف بطول مناسب",
      detail: descLen ? `الوصف ${nf.format(descLen)} حرف — الأفضل بين ٧٠ و١٦٠.` : "مفيش وصف — جوجل هيختار كلام عشوائي من الصفحة.",
      severity: "warn",
      done: descLen >= 70 && descLen <= 160,
      weight: 2,
    },
    {
      id: "products-desc",
      label: "كل المنتجات ليها وصف",
      detail: `${nf.format(noDescription)} منتج من غير وصف — بيظهروا في جوجل بوصف عام وبيترتبوا أقل.`,
      severity: "warn",
      done: products > 0 && noDescription === 0,
      weight: 3,
      href: "/products",
    },
    {
      id: "products-short",
      label: "أوصاف المنتجات كفاية",
      detail: `${nf.format(shortDescription)} منتج وصفه أقل من ٨٠ حرف. اكتب الخامة والمقاسات والاستخدام.`,
      severity: "tip",
      done: products > 0 && shortDescription === 0,
      weight: 2,
      href: "/products",
    },
    {
      id: "products-image",
      label: "كل المنتجات ليها صور",
      detail: `${nf.format(noImage)} منتج من غير صورة — مش هيظهر في بحث الصور ولا بشكل حلو في المشاركة.`,
      severity: "warn",
      done: products > 0 && noImage === 0,
      weight: 2,
      href: "/products",
    },
    {
      id: "share-image",
      label: "صورة للمشاركة",
      detail: "ارفع صورة أو لوجو عشان اللينك يبان حلو على واتساب وفيسبوك.",
      severity: "tip",
      done: Boolean(s?.ogImage || s?.logo),
      weight: 1,
    },
    {
      id: "search-console",
      label: "مربوط بـ Search Console",
      detail: "اربطه عشان تبعت خريطة الموقع وتشوف الناس بتدوّر بإيه.",
      severity: "warn",
      done: Boolean(s?.googleSiteVerification),
      weight: 2,
    },
    {
      id: "categories-image",
      label: "التصنيفات ليها صور",
      detail: `${nf.format(categoriesNoImage)} تصنيف من غير صورة.`,
      severity: "tip",
      done: categories > 0 && categoriesNoImage === 0,
      weight: 1,
      href: "/categories",
    },
    {
      id: "reviews",
      label: "مراجعات على المنتجات",
      detail: "المنتجات اللي ليها مراجعات بتظهر بالنجوم في نتايج جوجل.",
      severity: "tip",
      done: reviews > 0,
      weight: 1,
      href: "/reviews",
    },
    {
      id: "domain",
      label: "دومين خاص",
      detail: "دومين باسمك بيبني ثقة وسمعة في البحث أحسن من الرابط الفرعي.",
      severity: "tip",
      done: store.customDomainStatus === "ACTIVE" && Boolean(store.customDomain),
      weight: 1,
      href: "/domain",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="الظهور في جوجل"
        description="ازاي متجرك ومنتجاته بيظهروا في البحث وفي المشاركات — وإيه اللي يخليهم يظهروا أحسن."
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={`https://www.google.com/search?q=site:${encodeURIComponent(storeUrl.replace(/^https?:\/\//, ""))}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              شوف متجرك في جوجل
            </a>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
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
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <SeoHealth checks={checks} />
        </aside>
      </div>
    </div>
  );
}
