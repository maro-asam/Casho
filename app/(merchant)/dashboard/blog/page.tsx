import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  TrendingUp,
  Search,
  ImageIcon,
} from "lucide-react";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

const MerchantBlogRoute = async () => {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) {
    return (
      <div className="p-6" dir="rtl">
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex min-h-55 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">لم يتم العثور على متجر</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              يجب إنشاء متجر أولًا حتى تتمكن من إدارة البانرز وعرض العروض
              والإعلانات داخل متجرك.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const posts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
      category: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  const categories = await prisma.blogCategory.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="">
      <DashboardSectionHeader
        icon={BookOpen}
        title="المقالات والنصائح"
        description={<>مقالات تساعدك تنجح في البيع وتكبر متجرك بثقة</>}
      />
      <div className="">
        {/* Hero */}

        {/* Search */}

        <div className="mx-auto mt-10 max-w-xl">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              placeholder="ابحث عن مقال..."
              className="h-12 w-full rounded-xl border bg-background pr-11 pl-4 text-sm outline-none transition focus:border-primary"
            />
          </div>
        </div>

        {/* Categories */}

        {categories.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              الكل
            </span>

            {categories.map((category) => (
              <span
                key={category.id}
                className="rounded-xl border px-4 py-2 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}

        {/* Posts */}

        {posts.length === 0 ? (
          <div className="mt-14 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            لا توجد مقالات منشورة حالياً
          </div>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={post.coverImage || "/login.jpg"}
                      alt={post.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute right-4 top-4 rounded-xl bg-background/90 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
                      {post.category?.name || "عام"}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {post.readTime || 5} دقائق
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="size-3.5" />
                        {post.views} مشاهدة
                      </span>
                    </div>

                    <h2 className="text-lg font-semibold leading-8 text-foreground transition group-hover:text-primary">
                      {post.title}
                    </h2>

                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                      {post.excerpt ||
                        "اقرأ المقال لمعرفة تفاصيل أكثر تساعدك في تطوير متجرك."}
                    </p>

                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      اقرأ المقال
                      <ArrowLeft className="size-4" />
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantBlogRoute;
