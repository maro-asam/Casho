"use server";

import { prisma } from "@/lib/prisma";
import { transliterate } from "@/lib/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function CreateProductAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const price = Number(formData.get("price"));
  const image = (formData.get("image") as string)?.trim() || null;
  const categoryId = (formData.get("categoryId") as string)?.trim();

  const userId = (await cookies()).get("sessionToken")?.value;
  if (!userId) throw new Error("Unauthorized");

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) throw new Error("Store not found");

  if (!name) throw new Error("Product name is required");
  if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid price");
  if (!categoryId) throw new Error("Category is required");

  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId: store.id },
    select: { id: true },
  });
  if (!category) throw new Error("Invalid category");

  const baseSlug = transliterate(name);
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;

  await prisma.product.create({
    data: {
      name,
      price,
      image,
      slug,
      storeId: store.id,
      categoryId: category.id,
    },
  });

  redirect("/dashboard/products");
}

export async function DeleteProductAction(productId: string) {
  await prisma.product.delete({
    where: { id: productId },
  });
}
