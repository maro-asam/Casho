"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

async function getStoreForUser(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store;
}

export async function GetBranchesAction() {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  return prisma.branch.findMany({
    where: { storeId: store.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      isDefault: true,
      isActive: true,
      createdAt: true,
      _count: { select: { inventory: true } },
    },
  });
}

export async function GetOrCreateDefaultBranchAction() {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const existing = await prisma.branch.findFirst({
    where: { storeId: store.id, isDefault: true },
    select: { id: true, name: true },
  });
  if (existing) return existing;

  return prisma.branch.create({
    data: {
      storeId: store.id,
      name: "الفرع الرئيسي",
      isDefault: true,
    },
    select: { id: true, name: true },
  });
}

export async function CreateBranchAction(data: {
  name: string;
  address?: string;
  phone?: string;
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  if (!data.name?.trim()) throw new Error("اسم الفرع مطلوب");

  const branch = await prisma.branch.create({
    data: {
      storeId: store.id,
      name: data.name.trim(),
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
    },
  });

  revalidatePath("/dashboard/inventory/branches");
  return branch;
}

export async function UpdateBranchAction(
  branchId: string,
  data: { name?: string; address?: string; phone?: string; isActive?: boolean },
) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, storeId: store.id },
  });
  if (!branch) throw new Error("الفرع غير موجود");

  await prisma.branch.update({
    where: { id: branchId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });

  revalidatePath("/dashboard/inventory/branches");
  return { success: true };
}

export async function SetDefaultBranchAction(branchId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, storeId: store.id },
  });
  if (!branch) throw new Error("الفرع غير موجود");

  await prisma.$transaction([
    prisma.branch.updateMany({
      where: { storeId: store.id },
      data: { isDefault: false },
    }),
    prisma.branch.update({
      where: { id: branchId },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/dashboard/inventory/branches");
  return { success: true };
}

export async function DeleteBranchAction(branchId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, storeId: store.id },
    select: { isDefault: true, _count: { select: { inventory: true } } },
  });
  if (!branch) throw new Error("الفرع غير موجود");
  if (branch.isDefault) throw new Error("لا يمكن حذف الفرع الافتراضي");

  await prisma.branch.delete({ where: { id: branchId } });

  revalidatePath("/dashboard/inventory/branches");
  return { success: true };
}
