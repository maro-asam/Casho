"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BlogStatus } from "@prisma/client";
import {
  ImagePlus,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";

import { createBlogPostAction } from "@/actions/blog/blog.actions";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateBlogRoute = () => {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [title, setTitle] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [excerpt, setExcerpt] =
    useState("");

  const [content, setContent] =
    useState("");

  const [coverImage, setCoverImage] =
    useState("");

  const [seoTitle, setSeoTitle] =
    useState("");

  const [
    seoDescription,
    setSeoDescription,
  ] = useState("");

  const [seoKeywords, setSeoKeywords] =
    useState("");

  const [featured, setFeatured] =
    useState(false);

  const [status, setStatus] =
    useState<BlogStatus>(
      BlogStatus.DRAFT
    );

  const handleSubmit = () => {
    startTransition(async () => {
      const result =
        await createBlogPostAction({
          title,
          slug,
          excerpt:
            excerpt || undefined,
          content,
          coverImage:
            coverImage ||
            undefined,

          seoTitle:
            seoTitle ||
            undefined,

          seoDescription:
            seoDescription ||
            undefined,

          seoKeywords:
            seoKeywords
              .split(",")
              .map((item) =>
                item.trim()
              )
              .filter(Boolean),

          featured,
          status,
          gallery: [],
          tags: [],
        });

      if (result.success) {
        router.push(
          "/admin/blog"
        );
        router.refresh();
      } else {
        alert(
          result.message
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            إنشاء مقال جديد
          </h1>

          <p className="text-muted-foreground">
            أضف مقال جديد
            للمدونة الخاصة
            بـ Casho
          </p>
        </div>

        <Button
          onClick={
            handleSubmit
          }
          disabled={
            isPending
          }
        >
          {isPending ? (
            <Loader2 className="me-2 size-4 animate-spin" />
          ) : (
            <Save className="me-2 size-4" />
          )}

          حفظ المقال
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}

        <div className="space-y-6 lg:col-span-2">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>
                بيانات المقال
              </CardTitle>

              <CardDescription>
                العنوان
                والمحتوى
                الأساسي
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <Input
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                placeholder="عنوان المقال"
              />

              <Input
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                  )
                }
                placeholder="slug"
              />

              <Textarea
                rows={4}
                value={excerpt}
                onChange={(e) =>
                  setExcerpt(
                    e.target.value
                  )
                }
                placeholder="وصف مختصر"
              />

              <Textarea
                rows={18}
                value={content}
                onChange={(e) =>
                  setContent(
                    e.target.value
                  )
                }
                placeholder="محتوى المقال"
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4" />
                إعدادات SEO
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <Input
                value={seoTitle}
                onChange={(e) =>
                  setSeoTitle(
                    e.target.value
                  )
                }
                placeholder="SEO Title"
              />

              <Textarea
                rows={4}
                value={
                  seoDescription
                }
                onChange={(e) =>
                  setSeoDescription(
                    e.target.value
                  )
                }
                placeholder="SEO Description"
              />

              <Input
                value={
                  seoKeywords
                }
                onChange={(e) =>
                  setSeoKeywords(
                    e.target.value
                  )
                }
                placeholder="keyword1, keyword2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}

        <div className="space-y-6">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>
                النشر
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <Select
                value={status}
                onValueChange={(
                  value
                ) =>
                  setStatus(
                    value as BlogStatus
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="DRAFT">
                    مسودة
                  </SelectItem>

                  <SelectItem value="PUBLISHED">
                    منشور
                  </SelectItem>

                  <SelectItem value="ARCHIVED">
                    مؤرشف
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-3">
                <Checkbox
                  checked={
                    featured
                  }
                  onCheckedChange={(
                    value
                  ) =>
                    setFeatured(
                      Boolean(
                        value
                      )
                    )
                  }
                />

                <label className="text-sm font-medium">
                  مقال مميز
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImagePlus className="size-4" />
                صورة المقال
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input
                value={
                  coverImage
                }
                onChange={(e) =>
                  setCoverImage(
                    e.target.value
                  )
                }
                placeholder="رابط الصورة"
              />

              {coverImage ? (
                <img
                  src={
                    coverImage
                  }
                  alt="preview"
                  className="h-44 w-full rounded-xl border object-cover"
                />
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>
                ملاحظات
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>
                • يمكنك حفظه
                كمسودة
              </p>
              <p>
                • المقال
                المنشور يظهر
                مباشرة
              </p>
              <p>
                • استخدم صورة
                جذابة
              </p>
              <p>
                • اجعل العنوان
                قوي
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateBlogRoute;