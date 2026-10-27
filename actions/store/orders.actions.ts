"use server";

import { randomUUID } from "crypto";
import { markCartConverted } from "@/lib/cart-recovery/abandoned";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { NotificationType, OrderConfirmationStatus, OrderOtpMode, OrderRiskLevel, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MustOwnStore, MustSession } from "@/actions/auth/auth-helpers.actions";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { calculateCouponDiscount } from "@/helpers/coupon";
import { isAvailablePaymentMethod, isOnlinePaymentMethod, type PaymentMethodKey } from "@/constants/welcome/payment-methods";
import { createPaymobCheckout, paymobCallbackBaseUrl } from "@/lib/paymob";
import { governorateName, isGovernorateCode } from "@/constants/egypt-governorates";
import { shippingPriceFor } from "@/lib/shipping/governorate-pricing";
import { decryptSecret } from "@/lib/secrets";
import { createNotification, orderStatusLabels } from "@/lib/notifications/in-app";
import { isOrderRateLimited, ORDER_RATE_LIMIT_MESSAGE } from "@/lib/store/order-rate-limit";
import { announceNewOrder } from "@/lib/store/order-announce";
import { queueOrderStatusEmail } from "@/lib/notifications/email/order-emails";
import { queueLowStockEmails } from "@/lib/notifications/email/store-alerts";
import { assessPhoneRisk } from "@/lib/fraud/reputation";
import { canonicalPhone } from "@/lib/fraud/phone";
import { isOtpConfigured, sendOrderOtp } from "@/lib/fraud/otp";
import {
  OutOfStockError,
  adjustStockForOrderStatus,
  fitCartToStock,
  takeStockForOrder,
} from "@/lib/inventory/order-stock";
import { CART_OFFER_SELECT, priceOfferLines } from "@/lib/offers/cart-offers";
import { DIGITAL_ADDRESS, stockOf } from "@/lib/products/digital";
import { isPaused } from "@/lib/store/pause";

// Retired methods (Kashier) can't be chosen any more.
const isPaymentMethodKey = isAvailablePaymentMethod;

function normalizeEnabledPaymentMethods(
  paymentMethods: string[] | null | undefined,
): PaymentMethodKey[] {
  const normalized = (paymentMethods ?? []).filter(isPaymentMethodKey);

  if (normalized.length > 0) {
    return normalized;
  }

  return ["cash_on_delivery"];
}

/** Creates the Paymob intention for a storefront order; throws a customer-facing message on failure. */
async function openPaymobCheckout(input: {
  settings: {
    paymobSecretKeyEncrypted: string | null;
    paymobPublicKey: string | null;
    paymobHmacSecretEncrypted: string | null;
    paymobCardIntegrationId: number | null;
    paymobWalletIntegrationId: number | null;
  } | null;
  orderId: string;
  total: number;
  storeId: string;
  customer: { fullName: string; phone: string; address: string; city: string };
  items: { name: string; amountCents: number; quantity: number }[];
}) {
  const s = input.settings;
  const integrationIds = [s?.paymobCardIntegrationId, s?.paymobWalletIntegrationId].filter((id): id is number => !!id);
  if (!s?.paymobSecretKeyEncrypted || !s.paymobPublicKey || !s.paymobHmacSecretEncrypted || !integrationIds.length) {
    throw new Error("الدفع الأونلاين مش متاح في المتجر دلوقتي. اختار طريقة دفع تانية.");
  }
  if (input.total <= 0) throw new Error("إجمالي الطلب صفر — اختار الدفع عند الاستلام.");

  try {
    const callbackUrl = `${paymobCallbackBaseUrl()}/api/payments/paymob/order`;
    const { url } = await createPaymobCheckout(
      { secretKey: decryptSecret(s.paymobSecretKeyEncrypted), publicKey: s.paymobPublicKey, integrationIds },
      {
        amountCents: input.total,
        items: input.items,
        billing: {
          firstName: input.customer.fullName,
          phone: input.customer.phone,
          street: input.customer.address,
          city: input.customer.city,
        },
        specialReference: input.orderId,
        notificationUrl: callbackUrl,
        redirectionUrl: callbackUrl,
        extras: { storeId: input.storeId },
      },
    );
    return url;
  } catch (error) {
    console.error("[checkout] Paymob intention failed", { orderId: input.orderId, error: error instanceof Error ? error.message : error });
    throw new Error("مقدرناش نفتح صفحة الدفع دلوقتي. جرّب تاني أو اختار طريقة دفع تانية.");
  }
}

// Control characters out (they break Telegram/WhatsApp messages and exports).
const cleanText = (value: string) => value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();

const checkoutCustomerSchema = z.object({
  fullName: z.string().transform(cleanText).pipe(z.string().min(2, "الاسم قصير جدًا").max(100, "الاسم طويل جدًا")),
  phone: z
    .string()
    .transform((value) => value.replace(/[\s\-()]/g, ""))
    .pipe(z.string().regex(/^\+?\d{8,15}$/, "رقم الموبايل غير صحيح")),
  address: z.string().transform(cleanText).pipe(z.string().min(5, "العنوان قصير جدًا").max(500, "العنوان طويل جدًا")),
  // Optional — only used for the order emails.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.union([z.literal(""), z.string().email("الإيميل غير صحيح").max(254, "الإيميل طويل جدًا")]))
    .optional(),
});

type WholesaleTier = { minQty: number; maxQty?: number; price: number };

/** Unit price in EGP for a cart line — the wholesale tier its quantity falls in, else the list price. */
function unitPriceFor(item: { quantity: number; product: { price: number; wholesaleOptions: unknown } }) {
  const tiers = item.product.wholesaleOptions as WholesaleTier[] | null;
  if (tiers && tiers.length > 0) {
    for (let i = tiers.length - 1; i >= 0; i--) {
      const t = tiers[i];
      if (item.quantity >= t.minQty && (t.maxQty === undefined || item.quantity <= t.maxQty)) return t.price;
    }
  }
  return item.product.price;
}

/** Same normalisation as checkout, so "010 1234 5678" and "01012345678" match. */
const normalizePhone = (phone: string) => phone.replace(/[\s\-()]/g, "");

/** Thrown inside the order transaction when the coupon's last use was just taken. */
class CouponUsedUpError extends Error {
  constructor() {
    super("COUPON_USED_UP");
  }
}

/** Thrown inside the order transaction when the redeemed points are no longer there. */
class LoyaltyPointsChangedError extends Error {
  constructor() {
    super("LOYALTY_POINTS_CHANGED");
  }
}

async function getClientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null;
}

/** Same alert the POS sends, now also for online sales. Never breaks the order flow. */
async function notifyLowStock(storeId: string, productIds: string[]) {
  try {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId, isDigital: false },
      select: { id: true, name: true, stock: true, lowStockThreshold: true },
    });
    const low = products.filter((product) => product.stock <= (product.lowStockThreshold ?? 5));
    queueLowStockEmails(storeId, low.map(({ id, name, stock }) => ({ id, name, stock })));
    for (const product of low) {
      await createNotification({
        storeId,
        type: NotificationType.LOW_STOCK,
        title: product.stock <= 0 ? "منتج خلص من المخزون" : "تنبيه مخزون منخفض",
        message:
          product.stock <= 0
            ? `"${product.name}" خلص وبقى يظهر للعملاء "نفد المخزون".`
            : `"${product.name}" فاضل منه ${product.stock} قطعة بس.`,
        href: `/dashboard/products/${product.id}/edit`,
        data: { productId: product.id, stock: product.stock },
      });
    }
  } catch {
    // silent — never break the main flow
  }
}

export async function CreateOrderAction(
  storeSlug: string,
  data: {
    fullName: string;
    phone: string;
    email?: string;
    address: string;
    governorate: string;
    paymentMethod: PaymentMethodKey;
  },
) {
  const { guestSessionId } = await MustSession();

  if (!storeSlug) throw new Error("storeSlug is missing");

  // A cart of only digital products ships nothing: no address, no shipping, no cash on delivery.
  const cartKinds = await prisma.cartItem.findMany({
    where: { guestSessionId, store: { slug: storeSlug } },
    select: { product: { select: { isDigital: true } } },
  });
  const digitalOnly = cartKinds.length > 0 && cartKinds.every((item) => item.product.isDigital);
  if (digitalOnly) {
    data = { ...data, address: DIGITAL_ADDRESS, governorate: "" };
    if (data.paymentMethod === "cash_on_delivery") {
      throw new Error("المنتجات الرقمية مش بتتدفع عند الاستلام — اختار طريقة دفع تانية.");
    }
  } else if (!isGovernorateCode(data.governorate)) {
    throw new Error("اختر المحافظة");
  }

  const parsedCustomer = checkoutCustomerSchema.safeParse(data);
  if (!parsedCustomer.success) {
    throw new Error(parsedCustomer.error.issues[0]?.message ?? "بيانات الطلب غير صحيحة");
  }
  data = { ...data, ...parsedCustomer.data, phone: canonicalPhone(parsedCustomer.data.phone) };

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true,
      userId: true,
      slug: true,
      name: true,
      paymentMethods: true,
      settings: {
        select: {
          shippingPrice: true,
          whatsappNumber: true,
          telegramChatId: true,
          primaryColor: true,
          pausedUntil: true,
        },
      },
      storePaymentSettings: {
        select: {
          enabledPaymentMethods: true,
          cashOnDeliveryEnabled: true,
          vodafoneCashEnabled: true,
          instapayEnabled: true,
          bankTransferEnabled: true,
          paymobSecretKeyEncrypted: true,
          paymobPublicKey: true,
          paymobHmacSecretEncrypted: true,
          paymobCardIntegrationId: true,
          paymobWalletIntegrationId: true,
        },
      },
    },
  });

  if (!store) throw new Error("Store not found");
  if (isPaused(store.settings?.pausedUntil)) {
    throw new Error("المتجر واقف مؤقتًا ومش بياخد طلبات دلوقتي.");
  }

  const enabledPaymentMethods = normalizeEnabledPaymentMethods(
    store.storePaymentSettings?.enabledPaymentMethods?.length
      ? store.storePaymentSettings.enabledPaymentMethods
      : store.paymentMethods,
  );

  if (!enabledPaymentMethods.includes(data.paymentMethod)) {
    throw new Error("This payment method is not available for this store");
  }

  const ipAddress = await getClientIp();
  if (await isOrderRateLimited({ storeId: store.id, guestSessionId, phone: data.phone, ipAddress })) {
    throw new Error(ORDER_RATE_LIMIT_MESSAGE);
  }

  // Fake-order / return protection (lib/fraud). Card payments are already
  // verified by the bank; cash and manual transfers are where fakes cost money.
  const isManualPayment = !isOnlinePaymentMethod(data.paymentMethod);
  const [risk, fraudSettings] = await Promise.all([
    assessPhoneRisk(store.id, data.phone),
    prisma.storeSettings.findUnique({
      where: { storeId: store.id },
      select: { orderOtpMode: true, blockHighRiskOrders: true },
    }),
  ]);
  if (risk.blockedByStore) {
    throw new Error("مش هنقدر نكمل طلب من الرقم ده. لو في مشكلة، تواصل مع المتجر مباشرة.");
  }
  if (isManualPayment && risk.level === OrderRiskLevel.HIGH && fraudSettings?.blockHighRiskOrders) {
    throw new Error(
      enabledPaymentMethods.includes("paymob")
        ? "مش هنقدر نكمل الطلب ده بالدفع عند الاستلام. اختار الدفع أونلاين، أو تواصل مع المتجر."
        : "مش هنقدر نكمل الطلب ده. تواصل مع المتجر مباشرة.",
    );
  }
  const otpMode = fraudSettings?.orderOtpMode ?? OrderOtpMode.OFF;
  const needsConfirmation =
    isManualPayment &&
    isOtpConfigured() &&
    (otpMode === OrderOtpMode.ALL || (otpMode === OrderOtpMode.RISKY && risk.level !== OrderRiskLevel.LOW));

  const [cartItems, appliedCoupon] = await Promise.all([
    prisma.cartItem.findMany({
      where: { guestSessionId, storeId: store.id },
      include: {
        product: {
          select: {
            id: true,
            price: true,
            name: true,
            wholesaleOptions: true,
            stock: true,
            isDigital: true,
            isActive: true,
          },
        },
        offer: { select: CART_OFFER_SELECT },
      },
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
            isActive: true,
            startsAt: true,
            expiresAt: true,
            minSubtotal: true,
            maxDiscount: true,
            usageLimit: true,
            usedCount: true,
          },
        },
      },
    }),
  ]);

  if (cartItems.length === 0) throw new Error("Cart is empty");

  // Never sell what isn't there: fit the cart to live stock and send the
  // customer back to review it (the cart page explains what changed).
  const cartQtyByProduct = new Map<string, number>();
  for (const item of cartItems) {
    cartQtyByProduct.set(item.productId, (cartQtyByProduct.get(item.productId) ?? 0) + item.quantity);
  }
  const cartHasStockProblem = cartItems.some(
    (item) => !item.product.isActive || (cartQtyByProduct.get(item.productId) ?? 0) > stockOf(item.product),
  );
  if (cartHasStockProblem) {
    await fitCartToStock(store.id, guestSessionId);
    redirect(`/store/${store.slug}/cart?stock=changed`);
  }

  // Upsell / cross-sell / downsell lines are charged their offer price while
  // the offer still holds (same rules as the cart summary).
  const offerPricing = priceOfferLines(cartItems);
  const linePrice = (item: (typeof cartItems)[number]) =>
    Math.round((offerPricing.validIds.has(item.id) ? offerPricing.unitPrice(item) : unitPriceFor(item)) * 100);

  const subtotal = cartItems.reduce((acc, item) => acc + linePrice(item) * item.quantity, 0);

  const cookieStore = await cookies();
  const selectedShippingMethodId = cookieStore.get(`ship_${store.id}`)?.value ?? null;

  const shippingMethods = await prisma.shippingMethod.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, price: true, governorateRates: { select: { governorate: true, price: true } } },
  });

  let shipping = digitalOnly ? 0 : (store.settings?.shippingPrice ?? 0) * 100;
  let resolvedShippingMethodId: string | null = null;
  if (shippingMethods.length > 0 && !digitalOnly) {
    const selected = shippingMethods.find((m) => m.id === selectedShippingMethodId);
    const method = selected ?? shippingMethods[0];
    shipping = shippingPriceFor(method, data.governorate);
    resolvedShippingMethodId = method.id;
  }
  let discount = 0;
  let couponIdToUse: string | null = null;
  let couponCodeToUse: string | null = null;
  let couponUsageLimit: number | null = null;

  if (appliedCoupon?.coupon) {
    const coupon = appliedCoupon.coupon;
    const now = new Date();
    const startsOk = !coupon.startsAt || coupon.startsAt <= now;
    const expiresOk = !coupon.expiresAt || coupon.expiresAt >= now;
    const usageOk =
      typeof coupon.usageLimit !== "number" || coupon.usedCount < coupon.usageLimit;

    if (coupon.isActive && startsOk && expiresOk && usageOk) {
      const calculatedDiscount = calculateCouponDiscount(subtotal / 100, {
        type: coupon.type,
        value: coupon.value,
        minSubtotal: coupon.minSubtotal,
        maxDiscount: coupon.maxDiscount,
      });

      discount = Math.round(calculatedDiscount * 100);

      if (discount > 0) {
        couponIdToUse = coupon.id;
        couponCodeToUse = coupon.code;
        couponUsageLimit = typeof coupon.usageLimit === "number" ? coupon.usageLimit : null;
      }
    }
  }

  // Fetch loyalty settings (all fields needed both for discount calc and post-order award)
  // and applied loyalty points in parallel — single round trip each, reused after order creation
  const [appliedLoyalty, loyaltySettings] = await Promise.all([
    prisma.appliedLoyaltyPoints.findUnique({
      where: { guestSessionId_storeId: { guestSessionId, storeId: store.id } },
      select: { points: true, customerId: true, customer: { select: { storeId: true, phone: true } } },
    }),
    prisma.storeSettings.findUnique({
      where: { storeId: store.id },
      select: {
        loyaltyEnabled: true,
        loyaltyPointsPerEGP: true,
        loyaltyPointsValuePiasters: true,
      },
    }),
  ]);
  // Points belong to a phone: they are only spent on an order placed with that
  // same phone, so knowing someone's number isn't enough to ship their points
  // to yourself. The balance itself is re-checked and deducted atomically below.
  let pointsToRedeem = 0;
  if (appliedLoyalty && loyaltySettings?.loyaltyEnabled) {
    const ownsPoints =
      appliedLoyalty.customer.storeId === store.id &&
      normalizePhone(appliedLoyalty.customer.phone) === data.phone;
    if (!ownsPoints) {
      await prisma.appliedLoyaltyPoints.deleteMany({ where: { guestSessionId, storeId: store.id } });
      throw new Error("نقاط الولاء مربوطة برقم موبايل تاني. اكتب نفس الرقم اللي عليه النقاط، أو كمّل من غير النقاط.");
    }

    // Never spend more points than the order can absorb (shipping is paid in cash).
    const pointValue = Math.max(1, loyaltySettings.loyaltyPointsValuePiasters ?? 1);
    const payable = Math.max(0, subtotal - discount);
    pointsToRedeem = Math.min(appliedLoyalty.points, Math.ceil(payable / pointValue));
    discount += Math.min(payable, pointsToRedeem * pointValue);
  }

  const total = Math.max(0, subtotal + shipping - discount);

  // Online payment: open the Paymob checkout first, under an id the order is
  // then created with — if Paymob is down the customer can still pick
  // another method, and nothing was written. An unpaid intention just expires.
  const orderId = randomUUID();
  let paymobCheckoutUrl: string | null = null;
  if (data.paymentMethod === "paymob") {
    paymobCheckoutUrl = await openPaymobCheckout({
      settings: store.storePaymentSettings,
      orderId,
      total,
      storeId: store.id,
      customer: { fullName: data.fullName, phone: data.phone, address: digitalOnly ? "" : data.address, city: (!digitalOnly && governorateName(data.governorate)) || "" },
      items: cartItems.map((item) => ({ name: item.product.name, amountCents: linePrice(item), quantity: item.quantity })),
    });
  }

  let order: { id: string };
  try {
  order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        id: orderId,
        guestSessionId,
        storeId: store.id,
        paymentMethod: data.paymentMethod,
        paymentProvider: data.paymentMethod === "paymob" ? "PAYMOB" : "MANUAL",
        paymentStatus: "PENDING",
        status: OrderStatus.PENDING,
        subtotal,
        shipping,
        discount,
        total,
        couponCode: couponCodeToUse,
        ...(resolvedShippingMethodId ? { shippingMethodId: resolvedShippingMethodId } : {}),
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        // Prefixed so every place that shows the address (notifications,
        // invoice, exports, couriers) carries the governorate too.
        address: digitalOnly ? DIGITAL_ADDRESS : `${governorateName(data.governorate)} - ${data.address}`,
        governorate: digitalOnly ? null : data.governorate,
        ipAddress,
        riskLevel: risk.level,
        riskSignals: risk.signals,
        confirmationStatus: needsConfirmation ? OrderConfirmationStatus.PENDING : OrderConfirmationStatus.NOT_REQUIRED,
        ...(pointsToRedeem > 0 && appliedLoyalty
          ? { customerId: appliedLoyalty.customerId, pointsRedeemed: pointsToRedeem }
          : {}),
        items: {
          create: cartItems.map((item) => {
            return {
              productId: item.productId,
              price: linePrice(item),
              quantity: item.quantity,
              ...(offerPricing.validIds.has(item.id) ? { offerId: item.offerId } : {}),
              ...(item.selectedFeatures
                ? { selectedFeatures: item.selectedFeatures }
                : {}),
            };
          }),
        },
      },
      select: { id: true },
    });

    // Rolls the whole order back if someone else bought the last pieces meanwhile.
    await takeStockForOrder(tx, {
      storeId: store.id,
      orderId: created.id,
      lines: cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      note: `طلب أونلاين #${created.id.slice(0, 8).toUpperCase()}`,
    });

    if (pointsToRedeem > 0 && appliedLoyalty) {
      // Spend the points only while the customer still has them (no double spend).
      const spent = await tx.customer.updateMany({
        where: { id: appliedLoyalty.customerId, storeId: store.id, points: { gte: pointsToRedeem } },
        data: { points: { decrement: pointsToRedeem } },
      });
      if (spent.count !== 1) throw new LoyaltyPointsChangedError();

      await tx.loyaltyTransaction.create({
        data: {
          customerId: appliedLoyalty.customerId,
          orderId: created.id,
          type: "REDEEMED",
          points: -pointsToRedeem,
          description: `استرداد نقاط - طلب #${created.id.slice(-6)}`,
        },
      });
    }

    await tx.appliedLoyaltyPoints.deleteMany({ where: { guestSessionId, storeId: store.id } });

    if (couponIdToUse) {
      // Count the use only while uses are left — the check above ran outside
      // this transaction, so two last-use checkouts could both pass it.
      const used = await tx.coupon.updateMany({
        where: {
          id: couponIdToUse,
          isActive: true,
          ...(couponUsageLimit !== null && { usedCount: { lt: couponUsageLimit } }),
        },
        data: { usedCount: { increment: 1 } },
      });
      if (used.count !== 1) throw new CouponUsedUpError();
    }

    await tx.appliedCoupon.deleteMany({
      where: {
        guestSessionId,
        storeId: store.id,
      },
    });

    await tx.cartItem.deleteMany({
      where: { guestSessionId, storeId: store.id },
    });

    return created;
  });
  } catch (error) {
    if (error instanceof CouponUsedUpError) {
      await prisma.appliedCoupon.deleteMany({ where: { guestSessionId, storeId: store.id } });
      throw new Error("الكوبون ده خلص عدد مرات استخدامه. ارجع للسلة وكمّل من غيره.");
    }
    if (error instanceof LoyaltyPointsChangedError) {
      await prisma.appliedLoyaltyPoints.deleteMany({ where: { guestSessionId, storeId: store.id } });
      throw new Error("رصيد نقاط الولاء اتغير. ارجع للسلة وطبّق النقاط من جديد.");
    }
    if (!(error instanceof OutOfStockError)) throw error;
    await fitCartToStock(store.id, guestSessionId);
    redirect(`/store/${store.slug}/cart?stock=changed`);
  }

  await notifyLowStock(store.id, [...cartQtyByProduct.keys()]);
  await markCartConverted(store.id, guestSessionId, { id: order.id, total, fullName: data.fullName, phone: data.phone });

  // Award loyalty points after order creation (reuse loyaltySettings + appliedLoyalty from above)
  try {
    if (loyaltySettings?.loyaltyEnabled) {
      const totalEgp = total / 100;
      const pointsEarned = Math.floor(totalEgp * (loyaltySettings.loyaltyPointsPerEGP ?? 1));

      const customer = await prisma.customer.upsert({
        where: { storeId_phone: { storeId: store.id, phone: data.phone } },
        create: { storeId: store.id, phone: data.phone, name: data.fullName, email: data.email || null, points: pointsEarned },
        // Redeemed points were already deducted inside the order transaction.
        update: {
          name: data.fullName,
          ...(data.email ? { email: data.email } : {}),
          points: { increment: pointsEarned },
        },
      });

      await prisma.order.update({ where: { id: order.id }, data: { customerId: customer.id, pointsEarned } });

      await prisma.loyaltyTransaction.create({
        data: { customerId: customer.id, orderId: order.id, type: "EARNED", points: pointsEarned, description: `طلب #${order.id.slice(-6)}` },
      });
    }
  } catch (err) {
    console.error("Loyalty points error (non-fatal):", err);
  }

  // Fake-order protection: a cash order from a number that has to confirm
  // waits for its code; the merchant hears about it only once confirmed.
  let awaitingCode = false;
  if (needsConfirmation) {
    const sent = await sendOrderOtp(data.phone);
    if (sent.ok) {
      awaitingCode = true;
      await prisma.order.update({ where: { id: order.id }, data: { otpSentCount: 1, otpLastSentAt: new Date() } });
    } else {
      // Couldn't reach the customer — never hold a real order hostage.
      await prisma.order.update({
        where: { id: order.id },
        data: {
          confirmationStatus: OrderConfirmationStatus.NOT_REQUIRED,
          riskSignals: { push: "تعذّر إرسال كود التأكيد للعميل" },
        },
      });
    }
  }
  if (!awaitingCode) await announceNewOrder(order.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/notifications");
  revalidatePath(`/store/${store.slug}`);
  revalidatePath(`/store/${store.slug}/cart`);
  revalidatePath(`/store/${store.slug}/checkout`);

  if (paymobCheckoutUrl) redirect(paymobCheckoutUrl);

  redirect(`/store/${store.slug}/order/${order.id}${awaitingCode ? "/confirm" : ""}`);
}

export async function GetOrdersAction(storeId: string) {
  const userId = await requireUserId();
  await MustOwnStore(storeId, userId);

  return prisma.order.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      address: true,
      paymentMethod: true,
      paymentProvider: true,
      paymentStatus: true,
      paymentReference: true,
      paidAt: true,
      subtotal: true,
      shipping: true,
      discount: true,
      total: true,
      couponCode: true,
      status: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          price: true,
          quantity: true,
          product: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });
}

/**
 * `returned`: with CANCELED, records that the customer refused the delivery —
 * it feeds the number's reputation (lib/fraud) without touching revenue math.
 */
export async function UpdateOrderStatusAction(
  orderId: string,
  storeId: string,
  status: OrderStatus,
  opts: { returned?: boolean } = {},
) {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    select: {
      id: true,
      status: true,
      fullName: true,
      total: true,
      returnedAt: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const returnedAt =
    status === OrderStatus.CANCELED && opts.returned ? (order.returnedAt ?? new Date()) : null;

  const wasCanceled = order.status === OrderStatus.CANCELED;
  const willBeCanceled = status === OrderStatus.CANCELED;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status, returnedAt },
    });

    // Canceled orders give their items back to stock; undoing a cancel takes them again.
    if (!wasCanceled && willBeCanceled) {
      await adjustStockForOrderStatus(tx, { storeId, orderId, direction: "restock", userId });
    } else if (wasCanceled && !willBeCanceled) {
      await adjustStockForOrderStatus(tx, { storeId, orderId, direction: "take", userId });
    }
  });

  if (order.status !== status) {
    await createNotification({
      storeId,
      userId,
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: "تم تحديث حالة الطلب",
      message: `طلب ${order.fullName} أصبح ${orderStatusLabels[status] ?? status}.`,
      href: `/dashboard/orders/${order.id}`,
      data: {
        orderId: order.id,
        previousStatus: order.status,
        status,
        total: order.total,
      },
    });
    queueOrderStatusEmail(order.id, status);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/notifications");
  revalidatePath(`/store/${store.slug}`);

  return { success: true };
}
