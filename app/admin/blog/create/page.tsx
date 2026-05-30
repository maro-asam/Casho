"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { BlogStatus } from "@prisma/client";
import { ImagePlus, Link2, Loader2, Save, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";

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

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

const CreateBlogRoute = () => {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
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
      setCoverImage(url);
      toast.success("تم رفع الصورة بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  }

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  const [featured, setFeatured] = useState(false);

  const [status, setStatus] = useState<BlogStatus>(BlogStatus.DRAFT);

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("اكتب عنوان المقال");
      return;
    }

    if (!slug.trim()) {
      alert("اكتب slug للمقال");
      return;
    }

    if (!content.trim()) {
      alert("اكتب محتوى المقال");
      return;
    }

    startTransition(async () => {
      const result = await createBlogPostAction({
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || undefined,
        content,
        coverImage: coverImage.trim() || undefined,

        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,

        seoKeywords: seoKeywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        featured,
        status,
        gallery: [],
        tags: [],
      });

      if (result.success) {
        router.push("/admin/blog");
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">إنشاء مقال جديد</h1>

          <p className="text-muted-foreground">
            أضف مقال جديد للمدونة الخاصة بـ Casho
          </p>
        </div>

        <Button onClick={handleSubmit} disabled={isPending}>
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
              <CardTitle>بيانات المقال</CardTitle>

              <CardDescription>العنوان والمحتوى الأساسي</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان المقال"
              />

              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="slug"
              />

              <Textarea
                rows={4}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="وصف مختصر"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">محتوى المقال</label>

                <div
                  data-color-mode="light"
                  className="overflow-hidden rounded-xl border"
                >
                  <MDEditor
                    value={content}
                    onChange={(value) => setContent(value || "")}
                    height={520}
                    preview="edit"
                    visibleDragbar={false}
                    textareaProps={{
                      placeholder: "اكتب محتوى المقال هنا...",
                      dir: "rtl",
                    }}
                  />
                </div>

                <p className="text-xs leading-6 text-muted-foreground">
                  تقدر تستخدم Markdown زي: ## عنوان، **نص عريض**، - نقاط،
                  وروابط.
                </p>
              </div>
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
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="SEO Title"
              />

              <Textarea
                rows={4}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="SEO Description"
              />

              <Input
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="keyword1, keyword2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}

        <div className="space-y-6">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>النشر</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as BlogStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={BlogStatus.DRAFT}>مسودة</SelectItem>

                  <SelectItem value={BlogStatus.PUBLISHED}>منشور</SelectItem>

                  <SelectItem value={BlogStatus.ARCHIVED}>مؤرشف</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-3">
                <Checkbox
                  checked={featured}
                  onCheckedChange={(value) => setFeatured(Boolean(value))}
                />

                <label className="text-sm font-medium">مقال مميز</label>
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
              {/* Mode toggle */}
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
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                />
              )}

              {coverImage && (
                <div className="relative">
                  <img
                    src={coverImage}
                    alt="preview"
                    className="h-44 w-full rounded-xl border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1 shadow hover:bg-background"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>ملاحظات</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>• يمكنك حفظه كمسودة</p>
              <p>• المقال المنشور يظهر مباشرة</p>
              <p>• استخدم صورة جذابة</p>
              <p>• اجعل العنوان قوي</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateBlogRoute;
