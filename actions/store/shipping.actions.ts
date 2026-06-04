"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "../auth/require-user-id.actions";

async function getStoreForUser(userId: string) {
  return prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
}

export async function GetShippingMethodsAction() {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return [];

  return prisma.shippingMethod.findMany({
    where: { storeId: store.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function CreateShippingMethodAction(formData: FormData) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = Number(formData.get("price") ?? 0);
  const description = String(formData.get("description") ?? "").trim() || null;
  const estimatedDaysRaw = String(formData.get("estimatedDays") ?? "").trim();
  const estimatedDays = estimatedDaysRaw ? Number(estimatedDaysRaw) : null;

  if (!name) return { success: false, message: "اسم طريقة الشحن مطلوب" };
  if (isNaN(priceRaw) || priceRaw < 0) return { success: false, message: "السعر غير صالح" };

  const price = Math.round(priceRaw * 100);

  const count = await prisma.shippingMethod.count({ where: { storeId: store.id } });

  await prisma.shippingMethod.create({
    data: { storeId: store.id, name, price, description, estimatedDays, sortOrder: count },
  });

  revalidatePath("/dashboard/shipping");
  return { success: true, message: "تم إضافة طريقة الشحن" };
}

export async function UpdateShippingMethodAction(id: string, formData: FormData) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const method = await prisma.shippingMethod.findFirst({
    where: { id, storeId: store.id },
  });
  if (!method) return { success: false, message: "طريقة الشحن غير موجودة" };

  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = Number(formData.get("price") ?? 0);
  const description = String(formData.get("description") ?? "").trim() || null;
  const estimatedDaysRaw = String(formData.get("estimatedDays") ?? "").trim();
  const estimatedDays = estimatedDaysRaw ? Number(estimatedDaysRaw) : null;
  const isActive = formData.get("isActive") === "on";

  if (!name) return { success: false, message: "اسم طريقة الشحن مطلوب" };
  if (isNaN(priceRaw) || priceRaw < 0) return { success: false, message: "السعر غير صالح" };

  const price = Math.round(priceRaw * 100);

  await prisma.shippingMethod.update({
    where: { id },
    data: { name, price, description, estimatedDays, isActive },
  });

  revalidatePath("/dashboard/shipping");
  return { success: true, message: "تم تحديث طريقة الشحن" };
}

export async function DeleteShippingMethodAction(id: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const method = await prisma.shippingMethod.findFirst({
    where: { id, storeId: store.id },
  });
  if (!method) return { success: false, message: "طريقة الشحن غير موجودة" };

  await prisma.shippingMethod.delete({ where: { id } });

  revalidatePath("/dashboard/shipping");
  return { success: true, message: "تم حذف طريقة الشحن" };
}

export async function ToggleShippingMethodAction(id: string, isActive: boolean) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);
  if (!store) return;

  await prisma.shippingMethod.updateMany({
    where: { id, storeId: store.id },
    data: { isActive },
  });

  revalidatePath("/dashboard/shipping");
}
