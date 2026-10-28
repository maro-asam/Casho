"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { encryptSecret, decryptSecret } from "@/lib/secrets";
import { getStoreCarriers, type ConnectedCarrier } from "@/lib/shipping/store-carriers";
import {
  getCarrier,
  isCarrierKey,
  isValidTrackingTemplate,
  type CarrierSettings,
} from "@/lib/shipping/carriers";
import { isGovernorateCode } from "@/constants/egypt-governorates";

// ─── Ownership helper ──────────────────────────────────────────────────────────

async function getStoreForUser(userId: string) {
  return prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
}

function revalidateShipping() {
  revalidatePath("/dashboard/shipping/integrations");
  revalidatePath("/dashboard/shipping/shipments");
}

// ─── Read ──────────────────────────────────────────────────────────────────────

/** Integrations without raw credentials — only masked hints. */
export async function GetShippingIntegrationsAction(): Promise<ConnectedCarrier[]> {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return [];
  return getStoreCarriers(store.id);
}

// ─── Connect / update ─────────────────────────────────────────────────────────

/**
 * One action for every carrier, driven by the registry: API carriers read
 * their `credentialFields` (blank secret = keep the stored one), every carrier
 * reads the shared settings (tracking link, weight, pickup, display name).
 */
export async function SaveCarrierIntegrationAction(carrierKey: string, formData: FormData) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const carrier = getCarrier(carrierKey);
  if (!carrier || !isCarrierKey(carrierKey)) return { success: false, message: "شركة الشحن غير معروفة" };

  const existing = await prisma.shippingIntegration.findUnique({
    where: { storeId_provider: { storeId: store.id, provider: carrier.key } },
    select: { credentials: true },
  });

  // Credentials (API carriers only)
  let credentials: string | null = null;
  if (carrier.integration === "api") {
    let stored: Record<string, string> = {};
    if (existing?.credentials) {
      try {
        stored = JSON.parse(decryptSecret(existing.credentials));
      } catch {
        stored = {};
      }
    }
    const creds: Record<string, string> = {};
    for (const field of carrier.credentialFields ?? []) {
      const value = String(formData.get(`cred_${field.key}`) ?? "").trim() || stored[field.key] || "";
      if (field.required && !value) return { success: false, message: `${field.label} مطلوب` };
      if (value) creds[field.key] = value;
    }
    credentials = encryptSecret(JSON.stringify(creds));
  }

  // Settings (every carrier)
  const trackingUrlTemplate = String(formData.get("trackingUrlTemplate") ?? "").trim();
  if (trackingUrlTemplate && !isValidTrackingTemplate(trackingUrlTemplate)) {
    return {
      success: false,
      message: "رابط التتبع لازم يبدأ بـ https:// ويكون فيه {tracking} مكان رقم الشحنة",
    };
  }
  const displayName = String(formData.get("displayName") ?? "").trim().slice(0, 60);
  const weightRaw = String(formData.get("defaultWeightKg") ?? "").trim();
  const defaultWeightKg = weightRaw ? Number(weightRaw) : undefined;
  if (defaultWeightKg !== undefined && (isNaN(defaultWeightKg) || defaultWeightKg <= 0 || defaultWeightKg > 100)) {
    return { success: false, message: "الوزن الافتراضي لازم يكون بين ٠٫١ و ١٠٠ كجم" };
  }
  const pickupRaw = String(formData.get("pickupGovernorate") ?? "").trim();
  const pickupGovernorate = isGovernorateCode(pickupRaw) ? pickupRaw : undefined;
  const pickupAddress = String(formData.get("pickupAddress") ?? "").trim().slice(0, 200);
  if (carrier.key === "ARAMEX" && !pickupAddress) {
    return { success: false, message: "أرامكس محتاجة عنوان الاستلام بتاعك عشان يتطبع على البوليصة" };
  }

  const settings: CarrierSettings = {
    ...(trackingUrlTemplate && { trackingUrlTemplate }),
    ...(displayName && { displayName }),
    ...(defaultWeightKg !== undefined && { defaultWeightKg }),
    ...(pickupGovernorate && { pickupGovernorate }),
    ...(pickupAddress && { pickupAddress }),
  };

  await prisma.shippingIntegration.upsert({
    where: { storeId_provider: { storeId: store.id, provider: carrier.key } },
    create: { storeId: store.id, provider: carrier.key, credentials, settings, isActive: true },
    update: { credentials, settings, isActive: true },
  });

  revalidateShipping();
  return {
    success: true,
    message: existing ? `تم تحديث إعدادات ${carrier.nameAr}` : `تم ربط ${carrier.nameAr} بمتجرك`,
  };
}

// ─── Toggle active ─────────────────────────────────────────────────────────────

export async function ToggleShippingIntegrationAction(provider: string, isActive: boolean) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  await prisma.shippingIntegration.updateMany({
    where: { storeId: store.id, provider },
    data: { isActive },
  });

  revalidateShipping();
  return { success: true, message: isActive ? "تم تفعيل شركة الشحن" : "تم إيقاف شركة الشحن" };
}

// ─── Remove ───────────────────────────────────────────────────────────────────

/** Shipments already created keep their history; only the connection goes. */
export async function RemoveShippingIntegrationAction(provider: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  await prisma.shippingIntegration.deleteMany({
    where: { storeId: store.id, provider },
  });

  revalidateShipping();
  return { success: true, message: "تم إلغاء الربط" };
}
