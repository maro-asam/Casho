"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Prisma, SegmentType } from "@prisma/client";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) throw new Error("المتجر غير موجود");
  return store.id;
}

export async function GetSegmentsAction() {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  return prisma.customerSegment.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberships: true } } },
  });
}

export async function CreateSegmentAction(data: {
  name: string;
  description?: string;
  type?: SegmentType;
  color?: string;
  rules?: Record<string, Prisma.InputJsonValue>;
}) {
  if (!data.name.trim()) return { success: false as const, message: "اسم الشريحة مطلوب" };

  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const existing = await prisma.customerSegment.findUnique({
    where: { storeId_name: { storeId, name: data.name.trim() } },
  });
  if (existing) return { success: false as const, message: "هذه الشريحة موجودة بالفعل" };

  const segment = await prisma.customerSegment.create({
    data: {
      storeId,
      name: data.name.trim(),
      description: data.description,
      type: data.type ?? "MANUAL",
      color: data.color,
      rules: data.rules as Prisma.InputJsonValue | undefined,
    },
  });

  revalidatePath("/dashboard/crm/segments");
  return { success: true as const, segment };
}

export async function UpdateSegmentAction(
  segmentId: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    rules?: Record<string, Prisma.InputJsonValue>;
  }
) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const segment = await prisma.customerSegment.findFirst({ where: { id: segmentId, storeId } });
  if (!segment) return { success: false as const, message: "الشريحة غير موجودة" };

  await prisma.customerSegment.update({
    where: { id: segmentId },
    data: {
      name: data.name?.trim(),
      description: data.description,
      color: data.color,
      rules: data.rules as Prisma.InputJsonValue | undefined,
    },
  });

  revalidatePath("/dashboard/crm/segments");
  return { success: true as const };
}

export async function DeleteSegmentAction(segmentId: string) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const segment = await prisma.customerSegment.findFirst({ where: { id: segmentId, storeId } });
  if (!segment) return { success: false as const, message: "الشريحة غير موجودة" };

  await prisma.customerSegment.delete({ where: { id: segmentId } });

  revalidatePath("/dashboard/crm/segments");
  return { success: true as const };
}

export async function AddToSegmentAction(customerId: string, segmentId: string) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const [customer, segment] = await Promise.all([
    prisma.customer.findFirst({ where: { id: customerId, storeId } }),
    prisma.customerSegment.findFirst({ where: { id: segmentId, storeId } }),
  ]);
  if (!customer || !segment) return { success: false as const, message: "بيانات غير صحيحة" };

  await prisma.customerSegmentMembership.upsert({
    where: { customerId_segmentId: { customerId, segmentId } },
    create: { customerId, segmentId },
    update: {},
  });

  revalidatePath(`/dashboard/crm/customers/${customerId}`);
  revalidatePath("/dashboard/crm/segments");
  return { success: true as const };
}

export async function RemoveFromSegmentAction(customerId: string, segmentId: string) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  await prisma.customerSegmentMembership.deleteMany({
    where: { customerId, segmentId },
  });

  revalidatePath(`/dashboard/crm/customers/${customerId}`);
  revalidatePath("/dashboard/crm/segments");
  return { success: true as const };
}

// ─── Auto-populate built-in segments ─────────────────────────────────────────

export async function RefreshAutoSegmentsAction() {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const allCustomers = await prisma.customer.findMany({
    where: { storeId },
    select: {
      id: true,
      createdAt: true,
      orders: {
        where: { status: { not: "CANCELED" } },
        select: { total: true, createdAt: true },
      },
    },
  });

  const segmentDefs = [
    {
      name: "عملاء VIP",
      color: "#F59E0B",
      filter: (c: typeof allCustomers[0]) => {
        const spend = c.orders.reduce((s, o) => s + o.total, 0);
        return spend >= 2000000; // 20,000 EGP in piasters
      },
    },
    {
      name: "عملاء نشطون",
      color: "#10B981",
      filter: (c: typeof allCustomers[0]) =>
        c.orders.some((o) => o.createdAt >= thirtyDaysAgo),
    },
    {
      name: "عملاء جدد",
      color: "#3B82F6",
      filter: (c: typeof allCustomers[0]) => c.createdAt >= thirtyDaysAgo,
    },
    {
      name: "عملاء متكررون",
      color: "#8B5CF6",
      filter: (c: typeof allCustomers[0]) => c.orders.length >= 3,
    },
    {
      name: "عملاء في خطر",
      color: "#EF4444",
      filter: (c: typeof allCustomers[0]) =>
        c.orders.length > 0 &&
        !c.orders.some((o) => o.createdAt >= ninetyDaysAgo),
    },
    {
      name: "عملاء غير نشطين",
      color: "#6B7280",
      filter: (c: typeof allCustomers[0]) =>
        c.orders.length === 0 && c.createdAt < thirtyDaysAgo,
    },
    {
      name: "مشتريات مرتفعة هذا الأسبوع",
      color: "#EC4899",
      filter: (c: typeof allCustomers[0]) =>
        c.orders.some((o) => o.createdAt >= sevenDaysAgo),
    },
  ];

  for (const def of segmentDefs) {
    // Ensure segment exists
    let segment = await prisma.customerSegment.findUnique({
      where: { storeId_name: { storeId, name: def.name } },
    });
    if (!segment) {
      segment = await prisma.customerSegment.create({
        data: {
          storeId,
          name: def.name,
          color: def.color,
          type: "AUTOMATIC",
          description: "شريحة تلقائية",
        },
      });
    }

    const qualifying = allCustomers.filter(def.filter);
    const qualifyingIds = new Set(qualifying.map((c) => c.id));

    // Remove members no longer qualifying
    await prisma.customerSegmentMembership.deleteMany({
      where: {
        segmentId: segment.id,
        customerId: { notIn: [...qualifyingIds] },
      },
    });

    // Add new qualifying members
    for (const customerId of qualifyingIds) {
      await prisma.customerSegmentMembership.upsert({
        where: { customerId_segmentId: { customerId, segmentId: segment.id } },
        create: { customerId, segmentId: segment.id },
        update: {},
      });
    }
  }

  revalidatePath("/dashboard/crm/segments");
  return { success: true as const };
}
