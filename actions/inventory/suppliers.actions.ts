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

export async function GetSuppliersAction(filters: {
  page?: number;
  pageSize?: number;
  search?: string;
  includeInactive?: boolean;
} = {}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    storeId: store.id,
    ...(filters.includeInactive ? {} : { isActive: true }),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { phone: { contains: filters.search, mode: "insensitive" as const } },
            { email: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        balance: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { products: true, purchaseOrders: true },
        },
      },
    }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function GetSupplierDetailAction(supplierId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, storeId: store.id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      taxNumber: true,
      notes: true,
      balance: true,
      isActive: true,
      createdAt: true,
      products: {
        select: {
          isPrimary: true,
          costPrice: true,
          product: { select: { id: true, name: true, image: true, stock: true, sku: true } },
        },
      },
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      },
    },
  });

  if (!supplier) throw new Error("المورد غير موجود");
  return supplier;
}

export async function CreateSupplierAction(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  notes?: string;
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  if (!data.name?.trim()) throw new Error("اسم المورد مطلوب");

  const supplier = await prisma.supplier.create({
    data: {
      storeId: store.id,
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      taxNumber: data.taxNumber?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath("/dashboard/inventory/suppliers");
  return supplier;
}

export async function UpdateSupplierAction(
  supplierId: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxNumber?: string;
    notes?: string;
    isActive?: boolean;
  },
) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, storeId: store.id },
  });
  if (!supplier) throw new Error("المورد غير موجود");

  await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.email !== undefined ? { email: data.email?.trim() || null } : {}),
      ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
      ...(data.taxNumber !== undefined ? { taxNumber: data.taxNumber?.trim() || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });

  revalidatePath("/dashboard/inventory/suppliers");
  revalidatePath(`/dashboard/inventory/suppliers/${supplierId}`);
  return { success: true };
}

export async function DeleteSupplierAction(supplierId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, storeId: store.id },
    select: { _count: { select: { purchaseOrders: true } } },
  });
  if (!supplier) throw new Error("المورد غير موجود");
  if (supplier._count.purchaseOrders > 0) {
    throw new Error("لا يمكن حذف مورد مرتبط بطلبات شراء — يمكنك تعطيله بدلاً من ذلك");
  }

  await prisma.supplier.delete({ where: { id: supplierId } });
  revalidatePath("/dashboard/inventory/suppliers");
  return { success: true };
}

export async function LinkProductToSupplierAction(data: {
  productId: string;
  supplierId: string;
  isPrimary?: boolean;
  costPrice?: number;
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const [product, supplier] = await Promise.all([
    prisma.product.findFirst({ where: { id: data.productId, storeId: store.id } }),
    prisma.supplier.findFirst({ where: { id: data.supplierId, storeId: store.id } }),
  ]);
  if (!product) throw new Error("المنتج غير موجود");
  if (!supplier) throw new Error("المورد غير موجود");

  if (data.isPrimary) {
    // Remove primary from any existing primary for this product
    await prisma.productSupplier.updateMany({
      where: { productId: data.productId, storeId: store.id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  await prisma.productSupplier.upsert({
    where: { productId_supplierId: { productId: data.productId, supplierId: data.supplierId } },
    create: {
      storeId: store.id,
      productId: data.productId,
      supplierId: data.supplierId,
      isPrimary: data.isPrimary ?? false,
      costPrice: data.costPrice ?? null,
    },
    update: {
      isPrimary: data.isPrimary ?? false,
      costPrice: data.costPrice ?? null,
    },
  });

  revalidatePath(`/dashboard/inventory/suppliers/${data.supplierId}`);
  return { success: true };
}
