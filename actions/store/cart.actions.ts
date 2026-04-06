"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MustSession, ReadSession } from "../auth/auth-helpers.actions";
import { calculateCouponDiscount } from "@/helpers/coupon";

function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

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

export async function ApplyCouponAction(storeSlug: string, formData: FormData) {
  const { guestSessionId } = await MustSession();

  const rawCode = formData.get("code")?.toString() ?? "";
  const code = normalizeCouponCode(rawCode);

  if (!code) {
    return {
      success: false,
      error: "من فضلك اكتب كود الكوبون",
    };
  }

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, slug: true, name: true },
  });

  if (!store) {
    return {
      success: false,
      error: "المتجر غير موجود",
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
          price: true,
        },
      },
    },
  });

  if (!items.length) {
    return {
      success: false,
      error: "السلة فاضية",
    };
  }

  const subtotal = items.reduce((acc, item) => {
    return acc + item.product.price * item.quantity;
  }, 0);

  const now = new Date();

  const coupon = await prisma.coupon.findFirst({
    where: {
      storeId: store.id,
      code,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [
        {
          OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
        },
      ],
    },
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      usageLimit: true,
      usedCount: true,
      minSubtotal: true,
      maxDiscount: true,
    },
  });

  if (!coupon) {
    return {
      success: false,
      error: "الكوبون غير صالح أو منتهي",
    };
  }

  if (
    typeof coupon.usageLimit === "number" &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return {
      success: false,
      error: "تم استهلاك عدد مرات استخدام الكوبون",
    };
  }

  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return {
      success: false,
      error: `الحد الأدنى لتفعيل الكوبون هو ${new Intl.NumberFormat("ar-EG", {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0,
      }).format(coupon.minSubtotal)}`,
    };
  }

  const discount = calculateCouponDiscount(subtotal, coupon);

  if (discount <= 0) {
    return {
      success: false,
      error: "الكوبون لا ينطبق على الطلب الحالي",
    };
  }

  await prisma.appliedCoupon.upsert({
    where: {
      guestSessionId_storeId: {
        guestSessionId,
        storeId: store.id,
      },
    },
    update: {
      couponId: coupon.id,
    },
    create: {
      guestSessionId,
      storeId: store.id,
      couponId: coupon.id,
    },
  });

  revalidatePath(`/store/${storeSlug}/cart`);

  return {
    success: true,
    message: `تم تطبيق الكوبون ${coupon.code} بنجاح`,
  };
}

export async function RemoveCouponAction(storeSlug: string) {
  const { guestSessionId } = await MustSession();

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  });

  if (!store) throw new Error("Store not found");

  await prisma.appliedCoupon.deleteMany({
    where: {
      guestSessionId,
      storeId: store.id,
    },
  });

  revalidatePath(`/store/${storeSlug}/cart`);

  return {
    success: true,
    message: "تم إزالة الكوبون",
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
      summary: {
        subtotal: 0,
        shipping: 0,
        discount: 0,
        total: 0,
      },
      appliedCoupon: null,
    };
  }

  const [items, appliedCoupon] = await Promise.all([
    prisma.cartItem.findMany({
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
    }),
    prisma.appliedCoupon.findUnique({
      where: {
        guestSessionId_storeId: {
          guestSessionId,
          storeId: store.id,
        },
      },
      include: {
        coupon: {
          select: {
            id: true,
            code: true,
            type: true,
            value: true,
            minSubtotal: true,
            maxDiscount: true,
            isActive: true,
            startsAt: true,
            expiresAt: true,
          },
        },
      },
    }),
  ]);

  const subtotal = items.reduce((acc, item) => {
    return acc + item.product.price * item.quantity;
  }, 0);

  const shipping = items.length > 0 ? 0 : 0;

  let discount = 0;
  let validCoupon: typeof appliedCoupon = null;

  if (appliedCoupon?.coupon?.isActive) {
    const now = new Date();
    const startsOk =
      !appliedCoupon.coupon.startsAt || appliedCoupon.coupon.startsAt <= now;
    const expiresOk =
      !appliedCoupon.coupon.expiresAt || appliedCoupon.coupon.expiresAt >= now;

    if (startsOk && expiresOk) {
      discount = calculateCouponDiscount(subtotal, appliedCoupon.coupon);
      validCoupon = appliedCoupon;
    } else {
      await prisma.appliedCoupon.deleteMany({
        where: {
          guestSessionId,
          storeId: store.id,
        },
      });
    }
  }

  const total = Math.max(0, subtotal + shipping - discount);

  return {
    store,
    items,
    appliedCoupon: validCoupon,
    summary: {
      subtotal,
      shipping,
      discount,
      total,
    },
  };
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