import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BlogStatus } from "@prisma/client";
import { Plus, Star, FileText, Eye, BookOpen } from "lucide-react";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import BlogActions from "./_components/BlogActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<BlogStatus, { label: string; cls: string }> = {
  DRAFT:     { label: "مسودة",  cls: "bg-zinc-500/10   text-zinc-600   border-zinc-500/20"   },
  PUBLISHED: { label: "منشور",  cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  ARCHIVED:  { label: "مؤرشف", cls: "bg-muted          text-muted-foreground border-border"   },
};

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(d);
}

export default async function AdminBlogsListRoute() {
  await requireAdmin();

  const blogs = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  const published = blogs.filter((b) => b.status === "PUBLISHED").length;
  const featured  = blogs.filter((b) => b.featured).length;
  const drafts    = blogs.filter((b) => b.status === "DRAFT").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">المقالات</h1>
          <p className="mt-1 text-sm text-muted-foreground">إدارة مقالات مدونة كاشو</p>
        </div>
        <Button asChild size="sm" className="rounded-lg">
          <Link href="/admin/blog/create">
            <Plus className="me-1.5 size-4" />
            مقال جديد
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "إجمالي المقالات", value: blogs.length, icon: FileText, cls: "text-primary      bg-primary/10"      },
          { label: "منشورة",           value: published,    icon: BookOpen, cls: "text-emerald-600  bg-emerald-500/10"  },
          { label: "مميزة",            value: featured,     icon: Star,     cls: "text-amber-600    bg-amber-500/10"    },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold">{s.value}</p>
              </div>
              <div className={cn("flex size-10 items-center justify-center rounded-lg", s.cls)}>
                <s.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">كل المقالات</h2>
          <p className="text-sm text-muted-foreground">{drafts} مسودة · {published} منشور</p>
        </div>

        {blogs.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">لا توجد مقالات بعد</p>
            <Button asChild size="sm" className="mt-4 rounded-lg">
              <Link href="/admin/blog/create"><Plus className="me-1.5 size-4" />أضف أول مقال</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-right text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">المقال</th>
                  <th className="px-6 py-3 font-medium">التصنيف</th>
                  <th className="px-6 py-3 font-medium">الحالة</th>
                  <th className="px-6 py-3 font-medium">المشاهدات</th>
                  <th className="px-6 py-3 font-medium">التاريخ</th>
                  <th className="px-6 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {blogs.map((blog) => {
                  const cfg = STATUS_CONFIG[blog.status];
                  return (
                    <tr key={blog.id} className="transition hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {blog.featured && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                          <span className="line-clamp-1 max-w-xs font-medium">{blog.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{blog.category?.name || "—"}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn("rounded-full border text-xs", cfg.cls)}>
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Eye className="size-3.5" />{blog.views}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{fmtDate(blog.createdAt)}</td>
                      <td className="px-6 py-4">
                        <BlogActions blog={{ id: blog.id, slug: blog.slug, title: blog.title }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
