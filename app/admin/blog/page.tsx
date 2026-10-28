import type { Metadata } from "next";
import Link from "next/link";
import { Eye, FileText, Plus, SearchX, Star } from "lucide-react";
import { BlogStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  ListCard,
  Unavailable,
  Segmented,
  PageHeader,
  Pager,
  SearchInput,
  SelectFilter,
  StatusText,
  readPage,
  readParam,
  type PillTone,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { th, theadRow } from "../_components/admin-ui";
import { fmtDate, fmtNum, pickEnum } from "../_lib/format";
import BlogActions from "./_components/BlogActions";

export const metadata: Metadata = { title: "المدونة" };

const PAGE_SIZE = 20;
const BASE_PATH = "/admin/blog";
const STATUS_META: Record<BlogStatus, { label: string; tone: PillTone }> = {
  PUBLISHED: { label: "منشور", tone: "success" },
  DRAFT: { label: "مسودة", tone: "neutral" },
  ARCHIVED: { label: "مؤرشف", tone: "warning" },
};

export default async function AdminBlogPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const status = pickEnum(BlogStatus, readParam(params, "status"));
  const categoryParam = readParam(params, "category");

  const categories = await prisma.blogCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const categoryId = categories.some((c) => c.id === categoryParam) ? categoryParam : undefined;

  const baseWhere: Prisma.BlogPostWhereInput = {
    ...(categoryId && { categoryId }),
    ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] }),
  };
  const where = { ...baseWhere, ...(status && { status }) };

  const [grouped, total, views] = await Promise.all([
    prisma.blogPost.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    prisma.blogPost.count({ where }),
    prisma.blogPost.aggregate({ where: { status: "PUBLISHED" }, _sum: { views: true } }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<Record<BlogStatus, number>>;
  const page = Math.min(readPage(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: { id: true, title: true, slug: true, status: true, featured: true, views: true, createdAt: true, category: { select: { name: true } } },
  });

  const filtered = !!(q || status || categoryId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="المدونة"
        description={`مقالات مدونة كاشو العامة · ${fmtNum(views._sum.views ?? 0)} مشاهدة على المنشور.`}
        actions={
          <Button asChild size="sm">
            <Link href={`${BASE_PATH}/create`}>
              <Plus className="size-4" />
              مقال جديد
            </Link>
          </Button>
        }
      />

      <div className="space-y-4">
        <Segmented
          label="حالة المقال"
          param="status"
          basePath={BASE_PATH}
          searchParams={params}
          segments={[
            { label: "الكل", count: grouped.reduce((s, g) => s + g._count._all, 0) },
            { label: STATUS_META.PUBLISHED.label, value: "PUBLISHED", count: counts.PUBLISHED ?? 0 },
            { label: STATUS_META.DRAFT.label, value: "DRAFT", count: counts.DRAFT ?? 0 },
            { label: STATUS_META.ARCHIVED.label, value: "ARCHIVED", count: counts.ARCHIVED ?? 0 },
          ]}
        />

        <ListCard
          toolbar={
            <>
              <SearchInput placeholder="ابحث بالعنوان أو الرابط" />
              {categories.length > 0 && (
                <SelectFilter param="category" allLabel="كل التصنيفات" label="التصنيف" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
              )}
            </>
          }
          footer={total > 0 && <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun="مقال" />}
        >
          {posts.length === 0 ? (
            filtered ? (
              <Unavailable
                icon={SearchX}
                title="مفيش مقالات بالفلاتر دي"
                action={
                  <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                    مسح الفلاتر
                  </Link>
                }
              />
            ) : (
              <Unavailable
                icon={FileText}
                title="مفيش مقالات لسه"
                description="المقالات بتجيب زيارات من جوجل للموقع."
                action={
                  <Button asChild size="sm">
                    <Link href={`${BASE_PATH}/create`}>
                      <Plus className="size-4" />
                      اكتب أول مقال
                    </Link>
                  </Button>
                }
              />
            )
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={cn(th, "ps-4")}>المقال</th>
                  <th className={cn(th, "hidden md:table-cell")}>التصنيف</th>
                  <th className={th}>الحالة</th>
                  <th className={cn(th, "hidden text-left sm:table-cell")}>المشاهدات</th>
                  <th className={cn(th, "hidden text-left lg:table-cell")}>التاريخ</th>
                  <th className={cn(th, "pe-4")} />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post) => (
                  <tr key={post.id} className="relative transition-colors hover:bg-muted/40">
                    <td className="max-w-md py-3 ps-4">
                      <Link href={`${BASE_PATH}/${post.slug}/edit`} className="flex items-center gap-1.5 font-medium after:absolute after:inset-0">
                        {post.featured && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="مميز" />}
                        <span className="line-clamp-1">{post.title}</span>
                      </Link>
                      <p className="truncate font-mono text-xs text-muted-foreground" dir="ltr">
                        <span className="block text-right">/blog/{post.slug}</span>
                      </p>
                    </td>
                    <td className="hidden py-3 text-muted-foreground md:table-cell">{post.category?.name ?? "—"}</td>
                    <td className="py-3">
                      <StatusText tone={STATUS_META[post.status].tone}>{STATUS_META[post.status].label}</StatusText>
                    </td>
                    <td className="hidden py-3 text-left tabular-nums text-muted-foreground sm:table-cell">
                      <span className="inline-flex items-center gap-1">
                        {fmtNum(post.views)}
                        <Eye className="size-3.5" />
                      </span>
                    </td>
                    <td className="hidden py-3 text-left text-muted-foreground lg:table-cell">{fmtDate(post.createdAt)}</td>
                    <td className="py-3 pe-4">
                      <BlogActions blog={{ id: post.id, slug: post.slug, title: post.title, published: post.status === "PUBLISHED" }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ListCard>
      </div>
    </div>
  );
}
