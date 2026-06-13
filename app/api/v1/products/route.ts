import { withApiAuth } from "@/lib/api/middleware";
import { paginated } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import type { ApiContext } from "@/lib/api/types";

async function listProducts(req: Request, ctx: ApiContext) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const search = url.searchParams.get("q");
  const categoryId = url.searchParams.get("category_id");
  const inStock = url.searchParams.get("in_stock");

  const where = {
    storeId: ctx.store.id,
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { sku: { contains: search, mode: "insensitive" as const } },
        { barcode: { contains: search } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(inStock === "true" && { stock: { gt: 0 } }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        image: true,
        images: true,
        stock: true,
        sku: true,
        barcode: true,
        brand: true,
        isActive: true,
        isFeatured: true,
        weight: true,
        tags: true,
        colors: true,
        sizes: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return paginated({
    data: products,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export const GET = withApiAuth(
  (req, ctx) => listProducts(req, ctx),
  { scope: "products:read" },
);
