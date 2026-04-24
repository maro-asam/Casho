"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { BlogStatus } from "@prisma/client";
import { requireAdmin } from "../admin/admin-guard.actions";

type ActionResult = {
  success: boolean;
  message: string;
};

type CreateBlogInput = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;

  coverImage?: string;
  gallery?: string[];

  categoryId?: string;
  tags?: string[];

  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];

  featured?: boolean;
  status?: BlogStatus;
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0621-\u064Aa-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

export async function createBlogPostAction(
  input: CreateBlogInput,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const title = input.title?.trim();
    const content = input.content?.trim();

    if (!title || !content) {
      return {
        success: false,
        message: "العنوان والمحتوى مطلوبين",
      };
    }

    const slug = normalizeSlug(input.slug || title);

    const exists = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (exists) {
      return {
        success: false,
        message: "هذا الرابط مستخدم بالفعل",
      };
    }

    await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: input.excerpt?.trim() || null,
        content,

        coverImage: input.coverImage?.trim() || null,
        gallery: input.gallery || [],

        featured: input.featured || false,

        status: input.status || BlogStatus.DRAFT,

        publishedAt: input.status === BlogStatus.PUBLISHED ? new Date() : null,

        categoryId: input.categoryId || null,

        seoTitle: input.seoTitle?.trim() || null,
        seoDescription: input.seoDescription?.trim() || null,
        seoKeywords: input.seoKeywords || [],

        tags: input.tags?.length
          ? {
              create: input.tags.map((tagId) => ({
                tag: {
                  connect: { id: tagId },
                },
              })),
            }
          : undefined,
      },
    });

    revalidatePath("/blog");
    revalidatePath("/admin/blog");

    return {
      success: true,
      message: "تم إنشاء المقال بنجاح",
    };
  } catch (error) {
    console.error("createBlogPostAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء إنشاء المقال",
    };
  }
}

export async function updateBlogPostAction(
  blogId: string,
  input: CreateBlogInput,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const blog = await prisma.blogPost.findUnique({
      where: { id: blogId },
      select: { id: true, slug: true },
    });

    if (!blog) {
      return {
        success: false,
        message: "المقال غير موجود",
      };
    }

    const slug = normalizeSlug(input.slug || input.title);

    const duplicated = await prisma.blogPost.findFirst({
      where: {
        slug,
        NOT: {
          id: blogId,
        },
      },
      select: { id: true },
    });

    if (duplicated) {
      return {
        success: false,
        message: "الرابط مستخدم في مقال آخر",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.blogPostTag.deleteMany({
        where: { postId: blogId },
      });

      await tx.blogPost.update({
        where: { id: blogId },
        data: {
          title: input.title.trim(),
          slug,
          excerpt: input.excerpt?.trim() || null,
          content: input.content.trim(),

          coverImage: input.coverImage?.trim() || null,
          gallery: input.gallery || [],

          featured: input.featured || false,
          status: input.status || BlogStatus.DRAFT,

          publishedAt:
            input.status === BlogStatus.PUBLISHED ? new Date() : null,

          categoryId: input.categoryId || null,

          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          seoKeywords: input.seoKeywords || [],

          tags: input.tags?.length
            ? {
                create: input.tags.map((tagId) => ({
                  tag: {
                    connect: { id: tagId },
                  },
                })),
              }
            : undefined,
        },
      });
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${blog.slug}`);
    revalidatePath("/admin/blog");

    return {
      success: true,
      message: "تم تحديث المقال",
    };
  } catch (error) {
    console.error("updateBlogPostAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تحديث المقال",
    };
  }
}

export async function deleteBlogPostAction(
  blogId: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const blog = await prisma.blogPost.findUnique({
      where: { id: blogId },
      select: { slug: true },
    });

    if (!blog) {
      return {
        success: false,
        message: "المقال غير موجود",
      };
    }

    await prisma.blogPost.delete({
      where: { id: blogId },
    });

    revalidatePath("/blog");
    revalidatePath("/admin/blog");

    return {
      success: true,
      message: "تم حذف المقال",
    };
  } catch (error) {
    console.error("deleteBlogPostAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء حذف المقال",
    };
  }
}

export async function publishBlogPostAction(
  blogId: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await prisma.blogPost.update({
      where: { id: blogId },
      data: {
        status: BlogStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    revalidatePath("/blog");
    revalidatePath("/admin/blog");

    return {
      success: true,
      message: "تم نشر المقال",
    };
  } catch (error) {
    console.error("publishBlogPostAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء نشر المقال",
    };
  }
}
