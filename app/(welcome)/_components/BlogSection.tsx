import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, BookOpen, Clock3, TrendingUp } from "lucide-react";

export default async function BlogSection() {
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
    take: 3,
  });

  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="wrapper">
        {/* Header */}

        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <BookOpen className="size-4" />
            المدونة
          </span>

          <h2 className="mt-5 text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
            مقالات تساعدك تكبر شغلك
            <span className="mt-4 font-semibold block bg-linear-to-l from-primary to-sky-500 bg-clip-text text-transparent">
              وتبيع أذكى أونلاين
            </span>
          </h2>

          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            نصائح عملية، أفكار تسويق، واستراتيجيات بيع مخصوص للتجار في مصر.
          </p>
        </div>

        {/* Posts */}

        {posts.length === 0 ? (
          <div className="mt-14 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            لا توجد مقالات منشورة حالياً
          </div>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group overflow-hidden rounded-xl border border-border bg-card"
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="relative h-64 overflow-hidden">
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

                    <h3 className="text-lg font-semibold leading-8 text-foreground transition group-hover:text-primary">
                      {post.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                      {post.excerpt || "اقرأ المقال الكامل لمعرفة التفاصيل."}
                    </p>

                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      اقرأ المقال
                      <ArrowLeft className="size-4" />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}

        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-6 py-3 text-sm font-medium text-primary transition hover:bg-primary/10"
          >
            شوف كل المقالات
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}