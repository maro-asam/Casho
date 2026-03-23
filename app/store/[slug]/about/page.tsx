import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Store,
  Package,
  Star,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

type AboutStoreRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function AboutStoreRoute({
  params,
}: AboutStoreRouteProps) {
  const { slug } = await params;

  if (!slug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      products: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!store) return notFound();

  if (store.subscriptionStatus !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="border rounded-22xl p-10 text-center">
          <h1 className="text-2xl font-bold mb-4">
            المتجر غير مفعل
          </h1>
          <p className="text-gray-500">
            لازم صاحب المتجر يفعل الاشتراك الأول
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper py-12 space-y-10" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            عن متجر {store.name}
          </h1>
          <p className="text-muted-foreground">
            تعرف أكتر على المتجر والخدمات اللي بيقدمها
          </p>
        </div>

        <Link
          href={`/store/${store.slug}`}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          الرجوع للمتجر
          <ArrowRight />
        </Link>
      </div>

      {/* Description */}
      <div className="border rounded-22xl p-6 bg-background">
        <div className="flex items-center gap-3 mb-4">
          <Store className="text-primary" />
          <h2 className="text-xl font-semibold">نبذة عن المتجر</h2>
        </div>

        <p className="text-muted-foreground leading-7">
          {store.description ||
            "متجرنا بيقدملك أفضل المنتجات بجودة عالية وأسعار مناسبة، هدفنا دايمًا رضا العميل وتقديم تجربة شراء سهلة وسريعة."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-22xl border flex items-center gap-3">
          <Package className="text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">
              عدد المنتجات
            </p>
            <p className="font-bold">
              {store._count.products}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-22xl border flex items-center gap-3">
          <Users className="text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">
              العملاء
            </p>
            <p className="font-bold">+120</p>
          </div>
        </div>

        <div className="p-5 rounded-22xl border flex items-center gap-3">
          <Star className="text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">
              التقييم
            </p>
            <p className="font-bold">4.8 ⭐</p>
          </div>
        </div>

        <div className="p-5 rounded-22xl border flex items-center gap-3">
          <Store className="text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">
              اسم المتجر
            </p>
            <p className="font-bold">{store.name}</p>
          </div>
        </div>
      </div>

      {/* Extra Section (Features) */}
      <div className="border rounded-22xl p-6 bg-background space-y-4">
        <h2 className="text-xl font-semibold">
          ليه تختار المتجر ده؟
        </h2>

        <ul className="space-y-2 text-muted-foreground">
          <li>✔️ منتجات بجودة عالية</li>
          <li>✔️ أسعار منافسة</li>
          <li>✔️ شحن سريع لكل المحافظات</li>
          <li>✔️ دعم سريع للعملاء</li>
        </ul>
      </div>
    </div>
  );
}