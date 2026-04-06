"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

    if (!serviceId) {
      errors.serviceId = ["الخدمة غير محددة"];
    }

    if (!serviceTitle) {
      errors.serviceTitle = ["اسم الخدمة غير محدد"];
    }

    if (fullName.length < 2) {
      errors.fullName = ["اكتب الاسم بشكل صحيح"];
    }

    if (!phone || !isValidPhone(phone)) {
      errors.phone = ["اكتب رقم موبايل صحيح"];
    }

    if (whatsapp && !isValidPhone(whatsapp)) {
      errors.whatsapp = ["رقم الواتساب غير صحيح"];
    }

    if (storeLink && !isValidUrl(storeLink)) {
      errors.storeLink = ["لينك المتجر غير صحيح"];
    }

    if (notes && notes.length > 1000) {
      errors.notes = ["الملاحظات طويلة جدًا"];
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "فيه بيانات محتاجة تتراجع",
        errors,
      };
    }

    await prisma.serviceRequest.create({
      data: {
        serviceId,
        serviceTitle,
        fullName,
        phone,
        whatsapp,
        storeLink,
        notes,
        storeId,
      },
    });

    revalidatePath("/dashboard/services");

    return {
      success: true,
      message: "تم إرسال طلب الخدمة بنجاح سيتم التواصل معك قريبًا",
    };
  } catch (error) {
    console.error("CreateServiceRequestAction Error:", error);

    return {
      success: false,
      message: "حصل خطأ أثناء إرسال الطلب",
    };
  }
}