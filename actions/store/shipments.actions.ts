"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, ShipmentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { UpdateOrderStatusAction } from "@/actions/store/orders.actions";
import { dispatchWebhookEvent } from "@/lib/webhooks/events";
import { buildTrackingUrl, carrierDisplayName } from "@/lib/shipping/carriers";
import { loadStoreCarrier } from "@/lib/shipping/store-carriers";
import {
  ACTIVE_SHIPMENT_STATUSES,
  SHIPMENT_STATUS_META,
  isClosedShipment,
  mergeCarrierEvents,
  orderStatusForShipment,
  readShipmentEvents,
  type ShipmentEvent,
} from "@/lib/shipping/shipment-status";
import { governorateNameEn } from "@/constants/egypt-governorates";

type Result = { success: true; message: string } | { success: false; message: string; canCancelLocally?: boolean };

async function getStoreForUser(userId: string) {
  return prisma.store.findFirst({ where: { userId }, select: { id: true } });
}

function revalidateShipment(orderId: string | null) {
  revalidatePath("/dashboard/shipping/shipments");
  revalidatePath("/dashboard/orders");
  if (orderId) revalidatePath(`/dashboard/orders/${orderId}`);
}

function toPiasters(raw: FormDataEntryValue | null): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const egp = Number(text);
  return isNaN(egp) || egp < 0 ? NaN : Math.round(egp * 100);
}

/** Moves the order along with its shipment (stock + notifications via the order action). */
async function syncOrderStatus(orderId: string | null, storeId: string, status: ShipmentStatus) {
  if (!orderId) return;
  const target = orderStatusForShipment(status);
  if (!target) return;
  const order = await prisma.order.findFirst({ where: { id: orderId, storeId }, select: { status: true, returnedAt: true } });
  if (!order) return;
  const sameReturn = target.returned ? order.returnedAt !== null : true;
  if (order.status === target.status && sameReturn) return;
  // Never resurrect a canceled order, or walk a delivered one back, because a carrier scan arrived late.
  if (order.status === "CANCELED" && target.status !== "CANCELED") return;
  if (order.status === "DELIVERED" && target.status === "SHIPPED") return;
  await UpdateOrderStatusAction(orderId, storeId, target.status, { returned: target.returned });
}

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Ships an order with a connected carrier. API carriers book the waybill with
 * the carrier; manual carriers record the tracking number the merchant got.
 */
export async function CreateShipmentAction(orderId: string, formData: FormData): Promise<Result> {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId: store.id },
    include: { items: { include: { product: { select: { name: true } } } } },
  });
  if (!order) return { success: false, message: "الطلب غير موجود" };
  if (order.source === "POS") return { success: false, message: "طلبات الكاشير مابتتشحنش" };
  if (order.status === "CANCELED") return { success: false, message: "الطلب ملغي — رجّعه الأول لو عايز تشحنه" };

  const open = await prisma.shipment.findFirst({
    where: { orderId, storeId: store.id, status: { in: [...ACTIVE_SHIPMENT_STATUSES, "DELIVERED"] } },
    select: { id: true },
  });
  if (open) return { success: false, message: "الطلب ده عليه شحنة شغّالة بالفعل" };

  const carrierKey = String(formData.get("carrier") ?? "");
  let loaded;
  try {
    loaded = await loadStoreCarrier(store.id, carrierKey);
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "بيانات الربط غير صالحة" };
  }
  if (!loaded) return { success: false, message: "اربط شركة الشحن دي الأول من صفحة شركات الشحن" };
  if (!loaded.isActive) return { success: false, message: `${loaded.carrier.nameAr} متوقفة — فعّلها الأول` };
  const { carrier, settings, provider } = loaded;

  const codAmount = toPiasters(formData.get("codAmount"));
  const cost = toPiasters(formData.get("cost"));
  if (Number.isNaN(codAmount) || Number.isNaN(cost)) return { success: false, message: "المبالغ لازم تكون أرقام موجبة" };
  if (codAmount !== null && codAmount > 0 && !carrier.features.cod) {
    return { success: false, message: `${carrier.nameAr} مابتحصّلش عند الاستلام — خلّي مبلغ التحصيل صفر` };
  }
  const weightRaw = Number(String(formData.get("weightKg") ?? "").trim() || settings.defaultWeightKg || 1);
  const weightKg = isNaN(weightRaw) || weightRaw <= 0 ? 1 : Math.min(weightRaw, 100);
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500) || null;

  let trackingNumber = String(formData.get("trackingNumber") ?? "").trim().slice(0, 64);
  let providerShipmentId: string | null = null;
  let labelUrl: string | null = null;
  let estimatedDelivery: Date | null = null;
  let providerPayload: Prisma.InputJsonValue | undefined;
  let carrierCost = cost;

  if (provider) {
    const spaceIndex = order.fullName.indexOf(" ");
    try {
      const result = await provider.createShipment({
        orderId: order.id,
        reference: order.id.slice(0, 8).toUpperCase(),
        receiver: {
          firstName: spaceIndex > -1 ? order.fullName.slice(0, spaceIndex) : order.fullName,
          lastName: spaceIndex > -1 ? order.fullName.slice(spaceIndex + 1) : "",
          phone: order.phone,
          city: governorateNameEn(order.governorate) ?? "Cairo",
          street: order.address,
          countryCode: "EG",
        },
        parcel: {
          weightKg,
          description: order.items
            .slice(0, 3)
            .map((i) => `${i.product.name} x${i.quantity}`)
            .join(", "),
        },
        codAmountPiasters: codAmount ?? 0,
        notes: notes ?? order.notes ?? "",
      });
      trackingNumber = result.trackingNumber;
      providerShipmentId = result.providerShipmentId;
      labelUrl = result.labelUrl ?? null;
      estimatedDelivery = result.estimatedDelivery ?? null;
      providerPayload = result.rawResponse as Prisma.InputJsonValue;
      carrierCost = carrierCost ?? result.costPiasters ?? null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
      return { success: false, message: `${carrier.nameAr} رفضت الشحنة: ${msg}` };
    }
  } else if (!trackingNumber && carrier.key !== "OWN_COURIER") {
    return { success: false, message: `اكتب رقم البوليصة اللي ${carrier.nameAr} اديتهولك` };
  }

  const now = new Date().toISOString();
  const events: ShipmentEvent[] = [
    {
      at: now,
      status: "CREATED",
      source: "system",
      note: provider ? `اتعملت بوليصة على ${carrier.nameAr}` : `اتسجّلت الشحنة مع ${carrierDisplayName(carrier, settings)}`,
    },
  ];

  const shipment = await prisma.shipment.create({
    data: {
      storeId: store.id,
      orderId: order.id,
      provider: carrier.key,
      providerShipmentId,
      trackingNumber: trackingNumber || null,
      trackingUrl: buildTrackingUrl(carrier, settings, trackingNumber),
      labelUrl,
      status: "CREATED",
      courierName: carrierDisplayName(carrier, settings),
      cost: carrierCost,
      codAmount: codAmount ?? 0,
      weightKg,
      notes,
      events,
      estimatedDelivery,
      providerPayload,
      lastSyncedAt: provider ? new Date() : null,
    },
  });

  // Denormalized for the order list / invoice / exports.
  await prisma.order.update({
    where: { id: order.id },
    data: {
      trackingNumber: trackingNumber || null,
      shippingProvider: carrierDisplayName(carrier, settings),
      shippingLabelUrl: labelUrl,
    },
  });
  await syncOrderStatus(order.id, store.id, "CREATED");

  await dispatchWebhookEvent(store.id, "shipment.created", {
    shipment_id: shipment.id,
    provider: carrier.key,
    tracking_number: trackingNumber || null,
    order_id: order.id,
    status: "CREATED",
  });

  revalidateShipment(order.id);
  return { success: true, message: provider ? `تم إنشاء البوليصة على ${carrier.nameAr}` : "تم تسجيل الشحنة" };
}

// ─── Update status (manual) ───────────────────────────────────────────────────

export async function UpdateShipmentStatusAction(shipmentId: string, status: ShipmentStatus, note?: string): Promise<Result> {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };
  if (!(status in SHIPMENT_STATUS_META) || status === "CANCELED") {
    return { success: false, message: "الحالة دي مش متاحة" };
  }

  const shipment = await prisma.shipment.findFirst({ where: { id: shipmentId, storeId: store.id } });
  if (!shipment) return { success: false, message: "الشحنة غير موجودة" };
  if (shipment.status === "CANCELED") return { success: false, message: "الشحنة ملغية" };
  if (shipment.status === status && !note) return { success: true, message: "مفيش تغيير" };

  const events = [
    ...readShipmentEvents(shipment.events),
    { at: new Date().toISOString(), status, source: "merchant", ...(note?.trim() && { note: note.trim().slice(0, 300) }) } satisfies ShipmentEvent,
  ];

  await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      status,
      events,
      deliveredAt: status === "DELIVERED" ? (shipment.deliveredAt ?? new Date()) : null,
    },
  });
  await syncOrderStatus(shipment.orderId, store.id, status);

  if (status !== shipment.status) {
    await dispatchWebhookEvent(store.id, status === "DELIVERED" ? "shipment.delivered" : "shipment.updated", {
      shipment_id: shipment.id,
      tracking_number: shipment.trackingNumber,
      order_id: shipment.orderId,
      status,
      previous_status: shipment.status,
    });
  }

  revalidateShipment(shipment.orderId);
  return { success: true, message: `الشحنة بقت: ${SHIPMENT_STATUS_META[status].label}` };
}

// ─── Sync from carrier API ────────────────────────────────────────────────────

export async function SyncShipmentAction(shipmentId: string): Promise<Result> {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const shipment = await prisma.shipment.findFirst({ where: { id: shipmentId, storeId: store.id } });
  if (!shipment) return { success: false, message: "الشحنة غير موجودة" };
  if (!shipment.trackingNumber) return { success: false, message: "الشحنة مالهاش رقم تتبع" };

  let loaded;
  try {
    loaded = await loadStoreCarrier(store.id, shipment.provider);
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "بيانات الربط غير صالحة" };
  }
  if (!loaded?.provider) return { success: false, message: "الشركة دي مربوطة يدوي — حدّث الحالة بنفسك" };

  try {
    const tracking = await loaded.provider.trackShipment(shipment.trackingNumber);
    const carrierEvents: ShipmentEvent[] = tracking.events.map((e) => ({
      at: e.timestamp.toISOString(),
      status: e.status,
      note: e.description,
      location: e.location,
      source: "carrier",
    }));
    const status = shipment.status === "CANCELED" ? "CANCELED" : tracking.status;

    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status,
        events: mergeCarrierEvents(readShipmentEvents(shipment.events), carrierEvents),
        estimatedDelivery: tracking.estimatedDelivery ?? shipment.estimatedDelivery,
        deliveredAt: status === "DELIVERED" ? (shipment.deliveredAt ?? new Date()) : shipment.deliveredAt,
        lastSyncedAt: new Date(),
      },
    });
    await syncOrderStatus(shipment.orderId, store.id, status);

    if (status !== shipment.status) {
      await dispatchWebhookEvent(store.id, status === "DELIVERED" ? "shipment.delivered" : "shipment.updated", {
        shipment_id: shipment.id,
        tracking_number: shipment.trackingNumber,
        order_id: shipment.orderId,
        status,
        previous_status: shipment.status,
      });
    }

    revalidateShipment(shipment.orderId);
    return { success: true, message: `اتحدّثت من ${loaded.carrier.nameAr}: ${SHIPMENT_STATUS_META[status].label}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    return { success: false, message: `تعذّر التحديث من ${loaded.carrier.nameAr}: ${msg}` };
  }
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

/**
 * Cancels with the carrier when it has an API. If the carrier refuses (or has no
 * cancel endpoint), `localOnly` cancels in Casho after the merchant confirmed
 * they'll cancel on the carrier's side themselves.
 */
export async function CancelShipmentAction(shipmentId: string, opts: { localOnly?: boolean } = {}): Promise<Result> {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const shipment = await prisma.shipment.findFirst({ where: { id: shipmentId, storeId: store.id } });
  if (!shipment) return { success: false, message: "الشحنة غير موجودة" };
  if (isClosedShipment(shipment.status)) return { success: false, message: "الشحنة دي خلصت ومينفعش تتلغي" };

  if (!opts.localOnly) {
    let loaded;
    try {
      loaded = await loadStoreCarrier(store.id, shipment.provider);
    } catch {
      loaded = null;
    }
    if (loaded?.provider && shipment.providerShipmentId) {
      try {
        await loaded.provider.cancelShipment(shipment.providerShipmentId);
      } catch {
        return {
          success: false,
          canCancelLocally: true,
          message: `${loaded.carrier.nameAr} مالغتش الشحنة من عندها. ألغيها من حسابك عندهم، وبعدين ألغيها هنا.`,
        };
      }
    }
  }

  await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
      events: [
        ...readShipmentEvents(shipment.events),
        { at: new Date().toISOString(), status: "CANCELED", source: "merchant" } satisfies ShipmentEvent,
      ],
    },
  });
  if (shipment.orderId) {
    await prisma.order.update({
      where: { id: shipment.orderId },
      data: { trackingNumber: null, shippingProvider: null, shippingLabelUrl: null },
    });
  }

  await dispatchWebhookEvent(store.id, "shipment.updated", {
    shipment_id: shipment.id,
    tracking_number: shipment.trackingNumber,
    order_id: shipment.orderId,
    status: "CANCELED",
    previous_status: shipment.status,
  });

  revalidateShipment(shipment.orderId);
  return { success: true, message: "اتلغت الشحنة — تقدر تشحن الطلب تاني" };
}

// ─── COD reconciliation ───────────────────────────────────────────────────────

/** The merchant received (or un-received) the cash the carrier collected. */
export async function MarkCodCollectedAction(shipmentIds: string[], collected: boolean): Promise<Result> {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };
  if (shipmentIds.length === 0 || shipmentIds.length > 200) return { success: false, message: "اختار شحنات" };

  const { count } = await prisma.shipment.updateMany({
    where: { id: { in: shipmentIds }, storeId: store.id, status: "DELIVERED", codAmount: { gt: 0 } },
    data: { codCollectedAt: collected ? new Date() : null },
  });

  revalidatePath("/dashboard/shipping/shipments");
  revalidatePath("/dashboard/orders/[id]", "page");
  return {
    success: true,
    message: collected ? `اتسجّل استلام فلوس ${count} شحنة` : "اتشال تسجيل الاستلام",
  };
}
