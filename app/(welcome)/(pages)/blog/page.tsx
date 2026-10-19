import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  TrendingUp,
  FolderOpen,
} from "lucide-react";
import { BlogFilters } from "./_components/blog-filters";
import { BlogPagination } from "./_components/blog-pagination";

const POSTS_PER_PAGE = 9;

type BlogRouteProps = {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
};

const BlogRoute = async ({ searchParams }: BlogRouteProps) => {
  const { q, category, page: pageParam } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const hasFilters = !!(q || category);
  const isFirstPage = page === 1;

  // Shared where clause for filters
  const filterWhere = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { excerpt: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
  };

  // Featured post — only page 1, no filters
  const featuredPost =
    !hasFilters && isFirstPage
      ? await prisma.blogPost.findFirst({
          where: { status: "PUBLISHED", featured: true },
          include: { category: true },
          orderBy: { publishedAt: "desc" },
        })
      : null;

  // Regular posts where clause: exclude featured on page 1
  const regularWhere = {
    status: "PUBLISHED" as const,
    ...(featuredPost ? { id: { not: featuredPost.id } } : {}),
    ...filterWhere,
  };

  const [regularPosts, totalCount, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where: regularWhere,
      include: { category: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.blogPost.count({ where: regularWhere }),
    prisma.blogCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
  const isEmpty = !featuredPost && regularPosts.length === 0;

  return (
    <main className="py-10 md:py-14 lg:py-20">
      <div className="wrapper">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <BookOpen className="size-4" />
            المدونة
          </span>

          <h1 className="mt-5 text-4xl font-semibold leading-snug tracking-tight text-foreground md:text-5xl">
            مقالات تساعدك تنجح في البيع
            <span className="mt-2 block font-bold bg-linear-to-l from-primary to-sky-500 bg-clip-text text-transparent">
              وتكبر متجرك بثقة
            </span>
          </h1>

          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            نصائح عملية، تسويق، إدارة الطلبات، وأفكار تساعدك تزود مبيعاتك.
          </p>
        </div>

        {/* Filters */}
        <Suspense>
          <BlogFilters
            categories={categories}
            activeCategory={category}
            searchQuery={q}
          />
        </Suspense>

        {/* Featured Post — page 1 only */}
        {featuredPost && (
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="group mt-14 block overflow-hidden rounded-3xl border bg-card transition hover:shadow-xl"
          >
            <div className="grid md:grid-cols-2">
              <div className="relative h-64 md:h-auto">
                {featuredPost.coverImage ? (
                  <Image
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full min-h-64 items-center justify-center bg-linear-to-br from-primary/20 to-sky-500/20">
                    <BookOpen className="size-20 text-primary/30" />
                  </div>
                )}
                <div className="absolute right-4 top-4 rounded-xl bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  مقال مميز ✦
                </div>
              </div>

              <div className="flex flex-col justify-center p-8">
                <span className="text-sm font-medium text-primary">
                  {featuredPost.category?.name || "عام"}
                </span>

                <h2 className="mt-3 text-2xl font-extrabold leading-snug text-foreground transition group-hover:text-primary md:text-3xl">
                  {featuredPost.title}
                </h2>

                <p className="mt-4 line-clamp-3 text-base leading-8 text-muted-foreground">
                  {featuredPost.excerpt}
                </p>

                <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="size-3.5" />
                    {featuredPost.readTime || 5} دقائق
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="size-3.5" />
                    {featuredPost.views} مشاهدة
                  </span>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  اقرأ المقال
                  <ArrowLeft className="size-4" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Posts Grid */}
        {isEmpty ? (
          <div className="mt-14 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            {q
              ? `لا توجد مقالات تطابق "${q}"`
              : "لا توجد مقالات منشورة حالياً"}
          </div>
        ) : regularPosts.length > 0 ? (
          <div
            className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 ${featuredPost ? "mt-10" : "mt-14"}`}
          >
            {regularPosts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="relative h-56 overflow-hidden">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-linear-to-br from-primary/10 to-sky-500/10">
                        <BookOpen className="size-12 text-primary/20" />
                      </div>
                    )}
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
        ) : null}

        {/* Pagination */}
        <BlogPagination
          currentPage={page}
          totalPages={totalPages}
          searchParams={{ q, category }}
        />

        {/* Counter */}
        {totalPages > 1 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            صفحة {page} من {totalPages} — {totalCount} مقال
          </p>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-2xl border bg-card p-8 text-center">
          <FolderOpen className="mx-auto size-8 text-primary" />
          <h3 className="mt-4 text-2xl font-semibold">ابدأ متجرك الآن</h3>
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
