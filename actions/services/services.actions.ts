"use server";

import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { createNotification } from "@/lib/notifications/in-app";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateServiceRequestState = {
  success: boolean;
  message: string;
  errors?: {
    fullName?: string[];
    phone?: string[];
    whatsapp?: string[];
    storeLink?: string[];
    notes?: string[];
    serviceId?: string[];
    serviceTitle?: string[];
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeOptional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidPhone(value: string) {
  return /^[0-9+\-\s()]{8,20}$/.test(value);
}

// ─── Create service request ───────────────────────────────────────────────────

export async function CreateServiceRequestAction(
  _prevState: CreateServiceRequestState,
  formData: FormData,
): Promise<CreateServiceRequestState> {
  try {
    const serviceId = String(formData.get("serviceId") ?? "").trim();
    const serviceTitle = String(formData.get("serviceTitle") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const whatsapp = normalizeOptional(formData.get("whatsapp"));
    const storeLink = normalizeOptional(formData.get("storeLink"));
    const notes = normalizeOptional(formData.get("notes"));
    const storeId = normalizeOptional(formData.get("storeId"));

    const errors: CreateServiceRequestState["errors"] = {};

    if (!serviceId) errors.serviceId = ["الخدمة غير محددة"];
    if (!serviceTitle) errors.serviceTitle = ["اسم الخدمة غير محدد"];
    if (fullName.length < 2) errors.fullName = ["اكتب الاسم بشكل صحيح"];
    if (!phone || !isValidPhone(phone)) errors.phone = ["اكتب رقم موبايل صحيح"];
    if (whatsapp && !isValidPhone(whatsapp)) errors.whatsapp = ["رقم الواتساب غير صحيح"];
    if (storeLink && !isValidUrl(storeLink)) errors.storeLink = ["لينك المتجر غير صحيح"];
    if (notes && notes.length > 1000) errors.notes = ["الملاحظات طويلة جدًا"];

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "فيه بيانات محتاجة تتراجع", errors };
    }

    const request = await prisma.serviceRequest.create({
      data: { serviceId, serviceTitle, fullName, phone, whatsapp, storeLink, notes, storeId },
      select: { id: true },
    });

    if (storeId) {
      await createNotification({
        storeId,
        type: NotificationType.SERVICE_REQUEST_CREATED,
        title: "تم إرسال طلب الخدمة",
        message: `استلمنا طلب ${serviceTitle}. هنراجع التفاصيل ونتواصل معاك قريبًا.`,
        href: "/dashboard/services",
        data: { serviceRequestId: request.id, serviceId, serviceTitle },
      });
    }

    await sendTelegramMessage(`
تم استلام طلب خدمة جديد
تفاصيل الطلب:
• الخدمة: ${serviceTitle}
• الاسم: ${fullName}
• الهاتف: ${phone}
• الواتساب: ${whatsapp ?? "غير مضاف"}
• رابط المتجر: ${storeLink ?? "غير مضاف"}
• ملاحظات: ${notes ?? "لا يوجد"}
لوحة المتابعة: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"}/admin/service-requests
`);

    revalidatePath("/dashboard/services");
    revalidatePath("/dashboard/notifications");

    return { success: true, message: "تم إرسال طلب الخدمة بنجاح سيتم التواصل معك قريبًا" };
  } catch (error) {
    console.error("CreateServiceRequestAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء إرسال الطلب" };
  }
}

// ─── Remove Powered by Casho ──────────────────────────────────────────────────

export async function RequestRemovePoweredByAction(storeId: string) {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { id: storeId, userId },
    select: {
      id: true,
      name: true,
      slug: true,
      user: { select: { email: true, phone_number: true } },
    },
  });

  if (!store) throw new Error("المتجر غير موجود أو غير مصرح لك");

  const existingRequest = await prisma.serviceRequest.findFirst({
    where: {
      storeId: store.id,
      serviceId: "remove_powered_by_casho",
      status: { in: ["PENDING", "CONTACTED", "IN_PROGRESS"] },
    },
    select: { id: true },
  });

  if (existingRequest) throw new Error("تم إرسال طلب إزالة Powered by Casho بالفعل");

  const request = await prisma.serviceRequest.create({
    data: {
      serviceId: "remove_powered_by_casho",
      serviceTitle: "إزالة Powered by Casho",
      fullName: store.name,
      phone: store.user.phone_number || "غير متوفر",
      whatsapp: store.user.phone_number || undefined,
      storeLink: `/store/${store.slug}`,
      notes: `طلب إزالة عبارة Powered by Casho من المتجر: ${store.name}`,
      status: "PENDING",
      storeId: store.id,
    },
    select: { id: true },
  });

  await createNotification({
    userId,
    storeId: store.id,
    type: NotificationType.SERVICE_REQUEST_CREATED,
    title: "طلب إزالة Powered by Casho اتبعت",
    message: "استلمنا الطلب، وهنراجع تفعيل إزالة العلامة من متجرك.",
    href: "/dashboard/settings",
    data: { serviceRequestId: request.id, serviceId: "remove_powered_by_casho" },
  });

  await sendTelegramMessage(`
Hey Maro, تم استلام طلب جديد لإزالة Powered by Casho من المتجر: ${store.name}.
ادخل: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"}/admin/service-requests
`);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/admin/service-requests");

  return { success: true, message: "تم إرسال الطلب للإدارة بنجاح" };
}
