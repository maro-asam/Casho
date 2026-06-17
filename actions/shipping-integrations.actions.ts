"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/secrets";
import { getShippingProvider } from "@/lib/shipping/factory";
import type { ShippingProviderKey } from "@/lib/shipping/factory";
import type { BostaCredentials, AramexCredentials } from "@/lib/shipping/factory";

// ─── Ownership helper ──────────────────────────────────────────────────────────

async function getStoreForUser(userId: string) {
  return prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
}

// ─── Read ──────────────────────────────────────────────────────────────────────

/** Returns integrations without raw credentials — only masked hints. */
export async function GetShippingIntegrationsAction() {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return [];

  const integrations = await prisma.shippingIntegration.findMany({
    where: { storeId: store.id },
    select: {
      id: true,
      provider: true,
      isActive: true,
      credentials: true, // needed to build hints; never returned raw
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return integrations.map((i) => {
    let hint = "";
    try {
      const creds = JSON.parse(decryptSecret(i.credentials)) as Record<string, string>;
      // Return a masked hint per provider so the UI can show "connected" state
      if (i.provider === "BOSTA") {
        hint = maskSecret(creds.apiKey ?? "");
      } else if (i.provider === "ARAMEX") {
        hint = maskSecret(creds.accountNumber ?? "");
      }
    } catch {
      hint = "••••";
    }
    return {
      id: i.id,
      provider: i.provider,
      isActive: i.isActive,
      hint,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  });
}

// ─── Save / Upsert ────────────────────────────────────────────────────────────

export async function SaveBostaCredentialsAction(formData: FormData) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const apiKey = String(formData.get("apiKey") ?? "").trim();
  const pickupCity = String(formData.get("pickupCity") ?? "Cairo").trim();

  if (!apiKey) return { success: false, message: "API Key مطلوب" };

  const creds: BostaCredentials = { apiKey, pickupCity: pickupCity || "Cairo" };
  const encrypted = encryptSecret(JSON.stringify(creds));

  await prisma.shippingIntegration.upsert({
    where: { storeId_provider: { storeId: store.id, provider: "BOSTA" } },
    create: { storeId: store.id, provider: "BOSTA", credentials: encrypted, isActive: true },
    update: { credentials: encrypted, isActive: true },
  });

  revalidatePath("/dashboard/shipping/integrations");
  return { success: true, message: "تم حفظ إعدادات Bosta بنجاح" };
}

export async function SaveAramexCredentialsAction(formData: FormData) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const accountPin = String(formData.get("accountPin") ?? "").trim();
  const accountEntity = String(formData.get("accountEntity") ?? "").trim();
  const accountCountryCode = String(formData.get("accountCountryCode") ?? "EG").trim();

  if (!username) return { success: false, message: "اسم المستخدم مطلوب" };
  if (!password) return { success: false, message: "كلمة المرور مطلوبة" };
  if (!accountNumber) return { success: false, message: "رقم الحساب مطلوب" };
  if (!accountPin) return { success: false, message: "PIN الحساب مطلوب" };
  if (!accountEntity) return { success: false, message: "كيان الحساب مطلوب" };

  const creds: AramexCredentials = {
    username,
    password,
    accountNumber,
    accountPin,
    accountEntity,
    accountCountryCode: accountCountryCode || "EG",
  };
  const encrypted = encryptSecret(JSON.stringify(creds));

  await prisma.shippingIntegration.upsert({
    where: { storeId_provider: { storeId: store.id, provider: "ARAMEX" } },
    create: { storeId: store.id, provider: "ARAMEX", credentials: encrypted, isActive: true },
    update: { credentials: encrypted, isActive: true },
  });

  revalidatePath("/dashboard/shipping/integrations");
  return { success: true, message: "تم حفظ إعدادات Aramex بنجاح" };
}

// ─── Toggle active ─────────────────────────────────────────────────────────────

export async function ToggleShippingIntegrationAction(
  provider: ShippingProviderKey,
  isActive: boolean,
) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  await prisma.shippingIntegration.updateMany({
    where: { storeId: store.id, provider },
    data: { isActive },
  });

  revalidatePath("/dashboard/shipping/integrations");
  return { success: true, message: isActive ? "تم تفعيل مزود الشحن" : "تم إيقاف مزود الشحن" };
}

// ─── Remove ───────────────────────────────────────────────────────────────────

export async function RemoveShippingIntegrationAction(provider: ShippingProviderKey) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  await prisma.shippingIntegration.deleteMany({
    where: { storeId: store.id, provider },
  });

  revalidatePath("/dashboard/shipping/integrations");
  return { success: true, message: "تم إزالة الربط بنجاح" };
}

// ─── Generate Waybill ─────────────────────────────────────────────────────────

export async function GenerateWaybillAction(orderId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  // Ownership check baked into the where clause
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId: store.id },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
  });
  if (!order) return { success: false, message: "الطلب غير موجود" };

  if (order.trackingNumber) {
    return {
      success: false,
      message: `هذا الطلب لديه رقم تتبع بالفعل: ${order.trackingNumber}`,
    };
  }

  // Find the most recently updated active integration
  const integration = await prisma.shippingIntegration.findFirst({
    where: { storeId: store.id, isActive: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!integration) {
    return {
      success: false,
      message: "لا يوجد مزود شحن مفعّل. اذهب إلى إعدادات الشحن وقم بربط شركة شحن أولاً",
    };
  }

  // Decrypt credentials
  let credentials: Record<string, string>;
  try {
    credentials = JSON.parse(decryptSecret(integration.credentials));
  } catch {
    return { success: false, message: "بيانات الاعتماد المخزنة غير صالحة — أعد إدخالها" };
  }

  // Build the typed provider instance via the factory
  const provider = getShippingProvider(
    integration.provider as ShippingProviderKey,
    credentials,
  );

  // Parse receiver name (split on first space)
  const spaceIndex = order.fullName.indexOf(" ");
  const firstName =
    spaceIndex > -1 ? order.fullName.slice(0, spaceIndex) : order.fullName;
  const lastName = spaceIndex > -1 ? order.fullName.slice(spaceIndex + 1) : "";

  const isCOD =
    order.paymentMethod?.toLowerCase().includes("cod") ||
    order.paymentMethod?.toLowerCase().includes("cash") ||
    order.paymentStatus !== "paid";

  const params = {
    orderId: order.id,
    reference: order.id.slice(0, 8).toUpperCase(),
    receiver: {
      firstName,
      lastName,
      phone: order.phone,
      city: "Cairo", // TODO: store city separately on Order for accurate routing
      street: order.address,
      countryCode: "EG" as const,
    },
    parcel: {
      weightKg: 1,
      lengthCm: 20,
      widthCm: 20,
      heightCm: 10,
      description: order.items
        .slice(0, 3)
        .map((i) => `${i.product.name} x${i.quantity}`)
        .join(", "),
    },
    codAmountPiasters: isCOD ? order.total : 0,
    notes: order.notes ?? "",
  };

  try {
    const result = await provider.createShipment(params);

    // Persist Shipment record
    await prisma.shipment.create({
      data: {
        storeId: store.id,
        orderId: order.id,
        provider: integration.provider,
        providerShipmentId: result.providerShipmentId,
        trackingNumber: result.trackingNumber,
        status: "CREATED",
        courierName: integration.provider === "BOSTA" ? "Bosta" : "Aramex",
        cost: result.costPiasters,
        estimatedDelivery: result.estimatedDelivery,
        providerPayload: result.rawResponse as object,
      },
    });

    // Denormalize onto Order for fast access
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: result.trackingNumber,
        shippingProvider: integration.provider,
        shippingLabelUrl: result.labelUrl ?? null,
        status: "SHIPPED",
      },
    });

    revalidatePath(`/dashboard/orders`);
    revalidatePath(`/dashboard/orders/${orderId}`);

    return {
      success: true,
      message: "تم إنشاء بوليصة الشحن بنجاح",
      trackingNumber: result.trackingNumber,
      labelUrl: result.labelUrl ?? null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
    return { success: false, message: `فشل إنشاء البوليصة: ${msg}` };
  }
}

/** Live tracking — fetches from provider API and syncs DB status. */
export async function TrackShipmentAction(orderId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false as const, message: "المتجر غير موجود" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId: store.id },
    select: { trackingNumber: true, shippingProvider: true },
  });
  if (!order?.trackingNumber || !order.shippingProvider) {
    return { success: false as const, message: "لا يوجد رقم تتبع لهذا الطلب" };
  }

  const integration = await prisma.shippingIntegration.findUnique({
    where: {
      storeId_provider: {
        storeId: store.id,
        provider: order.shippingProvider as ShippingProviderKey,
      },
    },
  });
  if (!integration) {
    return { success: false as const, message: "مزود الشحن غير مُربوط بعد" };
  }

  let credentials: Record<string, string>;
  try {
    credentials = JSON.parse(decryptSecret(integration.credentials));
  } catch {
    return { success: false as const, message: "بيانات الاعتماد غير صالحة" };
  }

  const provider = getShippingProvider(
    integration.provider as ShippingProviderKey,
    credentials,
  );

  try {
    const tracking = await provider.trackShipment(order.trackingNumber);

    // Sync Shipment record
    await prisma.shipment.updateMany({
      where: { orderId, storeId: store.id },
      data: {
        status: tracking.status,
        deliveredAt: tracking.status === "DELIVERED" ? new Date() : undefined,
      },
    });

    return { success: true as const, tracking };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
    return { success: false as const, message: `فشل التتبع: ${msg}` };
  }
}
