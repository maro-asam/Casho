"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MustSession, ReadSession } from "../auth/auth-helpers.actions";

export async function AddToCartAction(storeSlug: string, productId: string) {
  const { guestSessionId } = await MustSession();

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, slug: true },
  });

  if (!store) throw new Error("Store not found");

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      storeId: store.id,
      isActive: true,
    },
    select: { id: true, name: true },
  });

  if (!product) throw new Error("Product not found");

  await prisma.cartItem.upsert({
    where: {
      guestSessionId_productId: {
        guestSessionId,
        productId,
      },
    },
    update: {
      quantity: { increment: 1 },
      storeId: store.id,
    },
    create: {
      guestSessionId,
      storeId: store.id,
      productId,
      quantity: 1,
    },
  });

  revalidatePath(`/store/${storeSlug}`);
  revalidatePath(`/store/${storeSlug}/cart`);

  return {
    success: true,
    message: "تم اضافة المنتج الي العربة",
  };
}

export async function GetCartItemsAction(storeSlug: string) {
  const { guestSessionId } = await ReadSession();

  if (!storeSlug) {
    throw new Error("Store slug is required");
  }

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!store) throw new Error("Store not found");

  if (!guestSessionId) {
    return {
      store,
      items: [],
    };
  }

  const items = await prisma.cartItem.findMany({
    where: {
      guestSessionId,
      storeId: store.id,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { store, items };
}

export async function UpdateCartItemQtyAction(
  cartItemId: string,
  storeSlug: string,
  type: "increment" | "decrement",
) {
  const { guestSessionId } = await MustSession();

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      guestSessionId,
      store: {
        slug: storeSlug,
      },
    },
    select: {
      id: true,
      quantity: true,
    },
  });

  if (!cartItem) throw new Error("Cart item not found");

  if (type === "decrement") {
    if (cartItem.quantity <= 1) {
      await prisma.cartItem.delete({
        where: { id: cartItem.id },
      });

      revalidatePath(`/store/${storeSlug}/cart`);
      revalidatePath(`/store/${storeSlug}`);
      return { deleted: true };
    }

    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: { decrement: 1 } },
    });

    revalidatePath(`/store/${storeSlug}/cart`);
    revalidatePath(`/store/${storeSlug}`);
    return { success: true };
  }

  await prisma.cartItem.update({
    where: { id: cartItem.id },
    data: { quantity: { increment: 1 } },
  });

  revalidatePath(`/store/${storeSlug}/cart`);
  revalidatePath(`/store/${storeSlug}`);
  return { success: true };
}

export async function RemoveCartItemAction(
  cartItemId: string,
  storeSlug: string,
) {
  const { guestSessionId } = await MustSession();

  await prisma.cartItem.deleteMany({
    where: {
      id: cartItemId,
      guestSessionId,
      store: {
        slug: storeSlug,
      },
    },
  });

  revalidatePath(`/store/${storeSlug}/cart`);
  revalidatePath(`/store/${storeSlug}`);
  return { success: true };
}