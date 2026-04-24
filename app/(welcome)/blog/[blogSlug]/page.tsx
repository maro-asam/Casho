import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Eye,
  BookOpen,
  ChevronLeft,
} from "lucide-react";

type BlogDetailsRouteProps = {
  params: Promise<{
    blogSlug: string;
  }>;
};

const BlogDetailsRoute = async ({ params }: BlogDetailsRouteProps) => {
  const { blogSlug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: {
      slug: blogSlug,
      status: "PUBLISHED",
    },
    include: {
      category: true,
    },
  });

  if (!post) {
    return notFound();
  }

  await prisma.blogPost.update({
    where: {
      id: post.id,
    },
    data: {
      views: {
        increment: 1,
      },
    },
  });

  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      id: {
        not: post.id,
      },
      categoryId: post.categoryId ?? undefined,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 3,
  });

  return (
    <main className="py-10 md:py-14 lg:py-20">
      <div className=" ">
        {/* Breadcrumb */}

        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            الرئيسية
          </Link>

          <ChevronLeft className="size-4" />

          <Link href="/blog" className="hover:text-primary">
            المدونة
          </Link>

          <ChevronLeft className="size-4" />

          <span className="text-foreground">{post.title}</span>
        </div>

        {/* Header */}

        <div className="mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <BookOpen className="size-4" />
            {post.category?.name || "عام"}
          </span>

          <h1 className="mt-5 text-3xl text-primary font-extrabold leading-tight tracking-tight md:text-5xl">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" />
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString(
                "ar-EG",
              )}
            </span>

            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4" />
              {post.readTime || 5} دقائق قراءة
            </span>

            <span className="inline-flex items-center gap-2">
              <Eye className="size-4" />
              {post.views + 1} مشاهدة
            </span>
          </div>
        </div>

        {/* Cover */}

        <div className="relative mt-10 h-[260px] overflow-hidden rounded-3xl border md:h-[500px]">
          <Image
            src={post.coverImage || "/login.jpg"}
            alt={post.title}
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* Content */}

        <article className="prose prose-lg mt-12 max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-8 prose-a:text-primary">
          <div
            dangerouslySetInnerHTML={{
              __html:
                post.content || "<p>لا يوجد محتوى متاح لهذا المقال حالياً.</p>",
            }}
          />
        </article>

        {/* CTA */}

        <div className="mt-14 rounded-3xl border bg-card p-8 text-center">
          <h3 className="text-2xl font-bold text-foreground">
            جاهز تبدأ متجرك؟
          </h3>

          <p className="mt-3 text-muted-foreground">
            طبّق الأفكار اللي قرأتها وابدأ البيع أونلاين بشكل احترافي.
          </p>

          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            ابدأ الآن
            <ArrowLeft className="size-4" />
          </Link>
        </div>

        {/* Related */}

        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground">
              مقالات قد تهمك
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {relatedPosts.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="group overflow-hidden rounded-2xl border bg-card"
                >
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={item.coverImage || "/login.jpg"}
                      alt={item.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-2 font-bold transition group-hover:text-primary">
                      {item.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {item.excerpt ||
                        "اقرأ المقال لمعرفة تفاصيل أكثر تساعدك في تنمية متجرك."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default BlogDetailsRoute;
