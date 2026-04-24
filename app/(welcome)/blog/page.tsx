import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  TrendingUp,
  Search,
  FolderOpen,
} from "lucide-react";

const BlogRoute = async () => {
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
    <main className="py-10 md:py-14 lg:py-20">
      <div className="wrapper">
        {/* Hero */}

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <BookOpen className="size-4" />
            المدونة
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            مقالات تساعدك تنجح في البيع
            <span className="mt-2 block bg-linear-to-l from-primary to-sky-500 bg-clip-text text-transparent">
              وتكبر متجرك بثقة
            </span>
          </h1>

          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            نصائح عملية، تسويق، إدارة الطلبات، وأفكار تساعدك تزود مبيعاتك.
          </p>
        </div>

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

                    <h2 className="text-lg font-bold leading-8 text-foreground transition group-hover:text-primary">
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

        {/* CTA */}

        <div className="mt-16 rounded-2xl border bg-card p-8 text-center">
          <FolderOpen className="mx-auto size-8 text-primary" />

          <h3 className="mt-4 text-2xl font-bold">ابدأ متجرك الآن</h3>

          <p className="mt-3 text-muted-foreground">
            طبّق النصائح دي مباشرة على متجرك وابدأ البيع بشكل احترافي.
          </p>

          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            ابدأ مجاناً
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </div>
    </main>
  );
};

export default BlogRoute;
