"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { MustSession, ReadSession } from "../auth/auth-helpers.actions";
import { calculateCouponDiscount } from "@/helpers/coupon";

function shippingCookieKey(storeId: string) {
  return `ship_${storeId}`;
}

function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

function getEffectivePrice(
  price: number,
  wholesaleOptions: unknown,
  quantity: number,
): number {
  const tiers = wholesaleOptions as
    | { minQty: number; maxQty?: number; price: number }[]
    | null;
  if (!tiers || tiers.length === 0) return price;
  for (let i = tiers.length - 1; i >= 0; i--) {
    const t = tiers[i];
    if (quantity >= t.minQty && (t.maxQty === undefined || quantity <= t.maxQty)) {
      return t.price;
    }
  }
  return price;
}

export async function AddToCartAction(
  storeSlug: string,
  productId: string,
  selectedFeatures?: Record<string, string>,
) {
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
    select: { id: true, name: true, sizes: true, colors: true },
  });

  if (!product) throw new Error("Product not found");

  // Server-side validation of feature values against product data
  if (selectedFeatures?.size && !product.sizes.includes(selectedFeatures.size)) {
    return { success: false, message: "المقاس المختار غير متاح" };
  }
  if (selectedFeatures?.color && !product.colors.includes(selectedFeatures.color)) {
    return { success: false, message: "اللون المختار غير متاح" };
  }

  const normalizedFeatures =
    selectedFeatures && Object.keys(selectedFeatures).length > 0
      ? selectedFeatures
      : null;

  // Find existing cart item with same product + same feature combination
  const existingItems = await prisma.cartItem.findMany({
    where: { guestSessionId, productId, storeId: store.id },
    select: { id: true, selectedFeatures: true },
  });

  const sortedKey = (f: Record<string, string> | null) =>
    f ? JSON.stringify(Object.fromEntries(Object.entries(f).sort())) : null;

  const matchingItem = existingItems.find(
    (item) =>
      sortedKey(item.selectedFeatures as Record<string, string> | null) ===
      sortedKey(normalizedFeatures),
  );

  if (matchingItem) {
    await prisma.cartItem.update({
      where: { id: matchingItem.id },
      data: { quantity: { increment: 1 } },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        guestSessionId,
        storeId: store.id,
        productId,
        quantity: 1,
        ...(normalizedFeatures ? { selectedFeatures: normalizedFeatures } : {}),
      },
    });
  }

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
      settings: {
        select: {
          shippingPrice: true,
          loyaltyEnabled: true,
          loyaltyPointsValuePiasters: true,
          loyaltyMinRedemption: true,
        },
      },
    },
  });

  if (!store) throw new Error("Store not found");

  const shippingMethods = await prisma.shippingMethod.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, price: true, description: true, estimatedDays: true },
  });

  const cookieStore = await cookies();
  const selectedShippingMethodId = cookieStore.get(shippingCookieKey(store.id))?.value ?? null;

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
      shippingMethods,
      selectedShippingMethodId,
    };
  }

  const [items, appliedCoupon, appliedLoyalty] = await Promise.all([
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
            wholesaleOptions: true,
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
    prisma.appliedLoyaltyPoints.findUnique({
      where: { guestSessionId_storeId: { guestSessionId, storeId: store.id } },
      select: { points: true, customerId: true },
    }),
  ]);

  const subtotal = items.reduce((acc, item) => {
    const unitPrice = getEffectivePrice(
      item.product.price,
      item.product.wholesaleOptions,
      item.quantity,
    );
    return acc + unitPrice * item.quantity;
  }, 0);

  let shipping = 0;
  if (items.length > 0) {
    if (shippingMethods.length > 0) {
      const selected = shippingMethods.find((m) => m.id === selectedShippingMethodId);
      shipping = selected ? selected.price : (shippingMethods[0]?.price ?? 0);
    } else {
      shipping = store.settings?.shippingPrice ?? 0;
    }
  }

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

  // Apply loyalty points discount
  const loyaltyPointsValue = store.settings?.loyaltyPointsValuePiasters ?? 1;
  const loyaltyDiscount =
    store.settings?.loyaltyEnabled && appliedLoyalty
      ? appliedLoyalty.points * loyaltyPointsValue
      : 0;
  discount += loyaltyDiscount;

  const total = Math.max(0, subtotal + shipping - discount);

  const activeMethodId =
    shippingMethods.length > 0
      ? (shippingMethods.find((m) => m.id === selectedShippingMethodId)?.id ??
        shippingMethods[0]?.id)
      : null;

  return {
    store,
    items,
    appliedCoupon: validCoupon,
    appliedLoyalty: store.settings?.loyaltyEnabled ? appliedLoyalty : null,
    loyaltyEnabled: store.settings?.loyaltyEnabled ?? false,
    loyaltyMinRedemption: store.settings?.loyaltyMinRedemption ?? 100,
    loyaltyPointsValue,
    summary: {
      subtotal,
      shipping,
      discount,
      total,
    },
    shippingMethods,
    selectedShippingMethodId: activeMethodId,
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

export async function SelectShippingMethodAction(storeSlug: string, methodId: string) {
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  });
  if (!store) return;

  const cookieStore = await cookies();
  cookieStore.set(shippingCookieKey(store.id), methodId, {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24,
  });

  revalidatePath(`/store/${storeSlug}/cart`);
}
