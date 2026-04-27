import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BlogStatus } from "@prisma/client";
import { Plus, Search, Star, FileText } from "lucide-react";

import BlogActions from "./_components/BlogActions";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const statusMap = {
  [BlogStatus.DRAFT]: {
    label: "مسودة",
    variant: "secondary",
  },
  [BlogStatus.PUBLISHED]: {
    label: "منشور",
    variant: "default",
  },
  [BlogStatus.ARCHIVED]: {
    label: "مؤرشف",
    variant: "outline",
  },
} as const;

const AdminBlogsListRoute = async () => {
  const blogs = await prisma.blogPost.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      category: true,
    },
  });

  const totalBlogs = blogs.length;

  const publishedBlogs = blogs.filter(
    (item) => item.status === BlogStatus.PUBLISHED,
  ).length;

  const featuredBlogs = blogs.filter((item) => item.featured).length;

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">إدارة المقالات</h1>

          <p className="text-muted-foreground">
            إدارة مقالات المدونة الخاصة بـ Casho
          </p>
        </div>

        <Button asChild>
          <Link href="/admin/blog/create">
            <Plus className="me-2 size-4" />
            إضافة مقال
          </Link>
        </Button>
      </div>

      {/* Stats */}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardDescription>إجمالي المقالات</CardDescription>

            <CardTitle className="text-3xl">{totalBlogs}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardDescription>المقالات المنشورة</CardDescription>

            <CardTitle className="text-3xl">{publishedBlogs}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardDescription>المقالات المميزة</CardDescription>

            <CardTitle className="text-3xl">{featuredBlogs}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}

      <Card className="rounded-xl">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input placeholder="ابحث عن مقال..." className="pr-10" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>كل المقالات</CardTitle>

          <CardDescription>
            يمكنك تعديل، حذف، أو مراجعة المقالات
          </CardDescription>
        </CardHeader>

        <CardContent>
          {blogs.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-muted p-4">
                <FileText className="size-8 text-muted-foreground" />
              </div>

              <h3 className="text-lg font-semibold">لا توجد مقالات بعد</h3>

              <p className="text-sm text-muted-foreground">
                ابدأ بإضافة أول مقال للمدونة
              </p>

              <Button asChild>
                <Link href="/admin/blog/create">
                  <Plus className="me-2 size-4" />
                  إضافة مقال
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>التصنيف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المشاهدات</TableHead>
                    <TableHead>مميز</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {blogs.map((blog) => {
                    const status = statusMap[blog.status];

                    return (
                      <TableRow key={blog.id}>
                        <TableCell className="font-medium">
                          <div className="line-clamp-1 max-w-[280px]">
                            {blog.title}
                          </div>
                        </TableCell>

                        <TableCell>{blog.category?.name || "-"}</TableCell>

                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>

                        <TableCell>{blog.views}</TableCell>

                        <TableCell>
                          {blog.featured ? (
                            <Star className="size-4 fill-current text-yellow-500" />
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        <TableCell>
                          {new Date(blog.createdAt).toLocaleDateString("ar-EG")}
                        </TableCell>

                        <TableCell>
                          <BlogActions
                            blog={{
                              id: blog.id,
                              slug: blog.slug,
                              title: blog.title,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBlogsListRoute;
