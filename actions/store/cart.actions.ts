"use server";

import { stockOf } from "@/lib/products/digital";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { MustSession, ReadSession } from "../auth/auth-helpers.actions";
import { calculateCouponDiscount } from "@/helpers/coupon";
import { queueStoreServerEvent } from "@/lib/pixels/server";
import { governorateCookieKey, shippingPriceFor } from "@/lib/shipping/governorate-pricing";
import { isGovernorateCode } from "@/constants/egypt-governorates";
import { CART_OFFER_SELECT, priceOfferLines } from "@/lib/offers/cart-offers";

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
  quantity = 1,
) {
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
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
    select: { id: true, name: true, sizes: true, colors: true, stock: true, isDigital: true, price: true, wholesaleOptions: true },
  });

  if (!product) throw new Error("Product not found");
  const stock = stockOf(product);

  if (stock <= 0) {
    return { success: false, message: "المنتج ده نفد من المخزون" };
  }

  // Stock is per product, across every size/color row already in the cart.
  const inCart = await prisma.cartItem.aggregate({
    where: { guestSessionId, productId, storeId: store.id },
    _sum: { quantity: true },
  });
  const alreadyInCart = inCart._sum.quantity ?? 0;
  if (alreadyInCart + qty > stock) {
    const left = stock - alreadyInCart;
    return {
      success: false,
      message:
        left > 0
          ? `المتاح تضيفه من المنتج ده ${left} قطعة بس.`
          : `المتاح من المنتج ده ${stock} قطعة بس، وكلهم في سلتك.`,
    };
  }

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
  // (offer lines are priced by their offer — a normal add never merges into one).
  const existingItems = await prisma.cartItem.findMany({
    where: { guestSessionId, productId, storeId: store.id, offerId: null },
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
      data: { quantity: { increment: qty } },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        guestSessionId,
        storeId: store.id,
        productId,
        quantity: qty,
        ...(normalizedFeatures ? { selectedFeatures: normalizedFeatures } : {}),
      },
    });
  }

  revalidatePath(`/store/${storeSlug}`);
  revalidatePath(`/store/${storeSlug}/cart`);

  // Ad pixels: the browser event (via notifyCartUpdated) and the server event
  // share this id, so Meta/TikTok count the add once.
  const added = {
    eventId: `atc_${crypto.randomUUID()}`,
    productId: product.id,
    name: product.name,
    price: getEffectivePrice(product.price, product.wholesaleOptions, qty),
    quantity: qty,
  };
  await queueStoreServerEvent({
    storeId: store.id,
    eventName: "AddToCart",
    payload: {
      eventId: added.eventId,
      value: added.price * qty,
      currency: "EGP",
      contents: [{ id: product.id, quantity: qty, price: added.price, name: product.name }],
    },
  });

  return {
    success: true,
    message: "تم اضافة المنتج الي العربة",
    added,
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
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
      estimatedDays: true,
      governorateRates: { select: { governorate: true, price: true } },
    },
  });

  const cookieStore = await cookies();
  const selectedShippingMethodId = cookieStore.get(shippingCookieKey(store.id))?.value ?? null;
  const governorateCookie = cookieStore.get(governorateCookieKey(store.id))?.value;
  const selectedGovernorate = isGovernorateCode(governorateCookie) ? governorateCookie : null;

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
      selectedGovernorate,
      digitalOnly: false,
    };
  }

  const [rawItems, appliedCoupon, appliedLoyalty] = await Promise.all([
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
            slug: true,
            price: true,
            image: true,
            wholesaleOptions: true,
            stock: true,
            isDigital: true,
          },
        },
        offer: { select: CART_OFFER_SELECT },
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

  // Offer lines carry their offer price as `product.price` (and no wholesale
  // tiers), so every theme's cart and drawer shows the right amount as-is.
  const { validIds, unitPrice: offerPrice } = priceOfferLines(rawItems);
  const staleOfferLines = rawItems.filter((i) => i.offerId && !validIds.has(i.id)).map((i) => i.id);
  if (staleOfferLines.length) {
    await prisma.cartItem.updateMany({ where: { id: { in: staleOfferLines } }, data: { offerId: null } });
  }
  const items = rawItems.map((raw) => {
    // Themes cap quantities by `stock`; a digital product never runs out.
    const line = { ...raw, product: { ...raw.product, stock: stockOf(raw.product) } };
    const { offer, ...item } = line;
    if (!offer || !validIds.has(item.id)) return { ...item, offerId: null, offer: null };
    return {
      ...item,
      product: { ...item.product, price: offerPrice(line), wholesaleOptions: null },
      offer: { id: offer.id, type: offer.type, originalPrice: item.product.price },
    };
  });

  const subtotal = items.reduce((acc, item) => {
    const unitPrice = getEffectivePrice(
      item.product.price,
      item.product.wholesaleOptions,
      item.quantity,
    );
    return acc + unitPrice * item.quantity;
  }, 0);

  // Nothing to ship when every line is digital.
  const digitalOnly = items.length > 0 && items.every((item) => item.product.isDigital);

  let shipping = 0;
  if (items.length > 0 && !digitalOnly) {
    if (shippingMethods.length > 0) {
      const method = shippingMethods.find((m) => m.id === selectedShippingMethodId) ?? shippingMethods[0];
      // Shipping methods are stored in piasters; the cart summary is in EGP.
      shipping = shippingPriceFor(method, selectedGovernorate) / 100;
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

  // Apply loyalty points discount (point value is in piasters; summary is in EGP)
  const loyaltyPointsValue = store.settings?.loyaltyPointsValuePiasters ?? 1;
  const loyaltyDiscount =
    store.settings?.loyaltyEnabled && appliedLoyalty
      ? (appliedLoyalty.points * loyaltyPointsValue) / 100
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
    selectedGovernorate,
    digitalOnly,
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
      productId: true,
      storeId: true,
      offerId: true,
      product: { select: { stock: true, isDigital: true } },
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

  // The offer price covers the pieces the shopper accepted it for, not more.
  if (cartItem.offerId) {
    return { success: false, message: "العرض ده بالكمية دي بس — لو عايز قطع زيادة ضيفها من صفحة المنتج." };
  }

  const inCart = await prisma.cartItem.aggregate({
    where: { guestSessionId, productId: cartItem.productId, storeId: cartItem.storeId },
    _sum: { quantity: true },
  });
  if ((inCart._sum.quantity ?? 0) + 1 > stockOf(cartItem.product)) {
    return { success: false, message: `المتاح ${Math.max(0, cartItem.product.stock)} قطعة بس` };
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

/** Remembers the checkout governorate so the cart summary prices shipping for it. */
export async function SelectGovernorateAction(storeSlug: string, governorate: string) {
  if (!isGovernorateCode(governorate)) return;
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  });
  if (!store) return;

  const cookieStore = await cookies();
  cookieStore.set(governorateCookieKey(store.id), governorate, {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
  });
}
