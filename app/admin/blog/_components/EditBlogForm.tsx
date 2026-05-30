"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BlogStatus } from "@prisma/client";
import { Loader2, Save, ArrowLeft, Upload, Link2, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { updateBlogPostAction } from "@/actions/blog/blog.actions";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Category = {
  id: string;
  name: string;
};

type BlogData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  featured: boolean;
  readTime: number;
  status: BlogStatus;
  categoryId: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
};

type EditBlogFormProps = {
  blog: BlogData;
  categories: Category[];
};

const EditBlogForm = ({
  blog,
  categories,
}: EditBlogFormProps) => {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [imageInputMode, setImageInputMode] = useState<"upload" | "link">("upload");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function uploadToCloudinary(file: File) {
    if (!cloudName || !uploadPreset) throw new Error("إعدادات Cloudinary غير مكتملة");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", uploadPreset);
    fd.append("folder", "casho/uploads/blog");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok || !data.secure_url) throw new Error(data?.error?.message || "فشل رفع الصورة");
    return data.secure_url as string;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const url = await uploadToCloudinary(file);
      setForm((prev) => ({ ...prev, coverImage: url }));
      toast.success("تم رفع الصورة بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  }

  const [form, setForm] = useState({
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    coverImage: blog.coverImage,
    featured: blog.featured,
    readTime: blog.readTime,
    status: blog.status,
    categoryId: blog.categoryId,
    seoTitle: blog.seoTitle,
    seoDescription: blog.seoDescription,
    seoKeywords:
      blog.seoKeywords.join(", "),
  });

  const onSubmit = () => {
    startTransition(async () => {
      const result =
        await updateBlogPostAction(
          blog.id,
          {
            title: form.title,
            slug: form.slug,
            excerpt:
              form.excerpt ||
              undefined,
            content:
              form.content,
            coverImage:
              form.coverImage ||
              undefined,

            gallery: [],

            featured:
              form.featured,

            status:
              form.status,

            categoryId:
              form.categoryId ||
              undefined,

            seoTitle:
              form.seoTitle ||
              undefined,

            seoDescription:
              form.seoDescription ||
              undefined,

            seoKeywords:
              form.seoKeywords
                .split(",")
                .map((item) =>
                  item.trim()
                )
                .filter(Boolean),

            tags: [],
          }
        );

      if (result.success) {
        router.push(
          "/admin/blog"
        );
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>
            البيانات الأساسية
          </CardTitle>

          <CardDescription>
            تعديل المقال
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5">
          <Input
            placeholder="عنوان المقال"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title:
                  e.target.value,
              })
            }
          />

          <Input
            placeholder="Slug"
            value={form.slug}
            onChange={(e) =>
              setForm({
                ...form,
                slug:
                  e.target.value,
              })
            }
          />

          <Textarea
            rows={4}
            placeholder="الوصف المختصر"
            value={form.excerpt}
            onChange={(e) =>
              setForm({
                ...form,
                excerpt:
                  e.target.value,
              })
            }
          />

          <Textarea
            rows={14}
            placeholder="محتوى المقال"
            value={form.content}
            onChange={(e) =>
              setForm({
                ...form,
                content:
                  e.target.value,
              })
            }
          />

          {/* Cover image upload */}
          <div className="space-y-3 rounded-xl border p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <ImagePlus className="size-4" />
              صورة المقال
            </p>

            <div className="flex rounded-lg border p-1 gap-1">
              <button
                type="button"
                onClick={() => setImageInputMode("upload")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${imageInputMode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Upload className="size-3.5" />
                رفع صورة
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode("link")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${imageInputMode === "link" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Link2 className="size-3.5" />
                رابط
              </button>
            </div>

            {imageInputMode === "upload" ? (
              <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/30 ${isUploadingImage ? "pointer-events-none opacity-60" : ""}`}>
                {isUploadingImage ? (
                  <Loader2 className="size-6 animate-spin text-primary" />
                ) : (
                  <Upload className="size-6 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isUploadingImage ? "جاري الرفع..." : "اضغط لاختيار صورة"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
              </label>
            ) : (
              <Input
                placeholder="https://..."
                dir="ltr"
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              />
            )}

            {form.coverImage && (
              <div className="relative">
                <img
                  src={form.coverImage}
                  alt="preview"
                  className="h-44 w-full rounded-xl border object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, coverImage: "" })}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-1 shadow hover:bg-background"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          <Input
            type="number"
            placeholder="وقت القراءة (عرض فقط)"
            value={
              form.readTime
            }
            onChange={(e) =>
              setForm({
                ...form,
                readTime:
                  Number(
                    e.target.value
                  ),
              })
            }
          />
        </CardContent>
      </Card>

      {/* Settings */}

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>
            الإعدادات
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">
          <Select
            value={form.status}
            onValueChange={(
              value
            ) =>
              setForm({
                ...form,
                status:
                  value as BlogStatus,
              })
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

          <Select
            value={
              form.categoryId ||
              "none"
            }
            onValueChange={(
              value
            ) =>
              setForm({
                ...form,
                categoryId:
                  value ===
                  "none"
                    ? ""
                    : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="none">
                بدون تصنيف
              </SelectItem>

              {categories.map(
                (item) => (
                  <SelectItem
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {
                      item.name
                    }
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
            <Checkbox
              checked={
                form.featured
              }
              onCheckedChange={(
                checked
              ) =>
                setForm({
                  ...form,
                  featured:
                    !!checked,
                })
              }
            />

            <span className="text-sm">
              مقال مميز
            </span>
          </div>
        </CardContent>
      </Card>

      {/* SEO */}

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>
            إعدادات SEO
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5">
          <Input
            placeholder="SEO Title"
            value={
              form.seoTitle
            }
            onChange={(e) =>
              setForm({
                ...form,
                seoTitle:
                  e.target.value,
              })
            }
          />

          <Textarea
            rows={4}
            placeholder="SEO Description"
            value={
              form.seoDescription
            }
            onChange={(e) =>
              setForm({
                ...form,
                seoDescription:
                  e.target.value,
              })
            }
          />

          <Input
            placeholder="keyword1, keyword2"
            value={
              form.seoKeywords
            }
            onChange={(e) =>
              setForm({
                ...form,
                seoKeywords:
                  e.target.value,
              })
            }
          />
        </CardContent>
      </Card>

      {/* Actions */}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={onSubmit}
          disabled={
            isPending
          }
        >
          {isPending ? (
            <>
              <Loader2 className="me-2 size-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="me-2 size-4" />
              حفظ التعديلات
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            router.push(
              "/admin/blog"
            )
          }
        >
          <ArrowLeft className="me-2 size-4" />
          رجوع
        </Button>
      </div>
    </div>
  );
};

export default EditBlogForm;