import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogStatus } from "@prisma/client";
import { PageHeader } from "@/components/saas-page";
import EditBlogForm from "../../_components/EditBlogForm";
import { BackLink } from "../../../_components/admin-ui";


type EditBlogRouteProps = {
  params: Promise<{
    blogSlug: string;
  }>;
};

const EditBlogRoute = async ({ params }: EditBlogRouteProps) => {
  const { blogSlug } = await params;

  const blog = await prisma.blogPost.findUnique({
    where: {
      slug: blogSlug,
    },
    include: {
      category: true,
      tags: true,
    },
  });

  if (!blog) {
    return notFound();
  }

  const categories = await prisma.blogCategory.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const formattedBlog = {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt || "",
    content: blog.content,
    coverImage: blog.coverImage || "",
    featured: blog.featured,
    readTime: blog.readTime || 5,
    status: blog.status as BlogStatus,
    categoryId: blog.categoryId || "",
    seoTitle: blog.seoTitle || "",
    seoDescription: blog.seoDescription || "",
    seoKeywords: blog.seoKeywords || [],
  };

  return (
    <div className="space-y-6">
      <BackLink href="/admin/blog">كل المقالات</BackLink>
      <PageHeader title="تعديل المقال" description={blog.title} />

      {/* Form */}

      <EditBlogForm blog={formattedBlog} categories={categories} />
    </div>
  );
};

export default EditBlogRoute;
