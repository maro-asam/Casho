"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) throw new Error("المتجر غير موجود");
  return store.id;
}

// ─── Tag CRUD ─────────────────────────────────────────────────────────────────

export async function GetTagsAction() {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  return prisma.customerTag.findMany({
    where: { storeId },
    orderBy: { name: "asc" },
    include: { _count: { select: { assignments: true } } },
  });
}

export async function CreateTagAction(name: string, color?: string) {
  if (!name.trim()) return { success: false as const, message: "اسم العلامة مطلوب" };

  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const existing = await prisma.customerTag.findUnique({
    where: { storeId_name: { storeId, name: name.trim() } },
  });
  if (existing) return { success: false as const, message: "هذه العلامة موجودة بالفعل" };

  const tag = await prisma.customerTag.create({
    data: { storeId, name: name.trim(), color },
  });

  revalidatePath("/dashboard/crm");
  revalidatePath("/dashboard/crm/tags");
  return { success: true as const, tag };
}

export async function UpdateTagAction(tagId: string, name: string, color?: string) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const tag = await prisma.customerTag.findFirst({ where: { id: tagId, storeId } });
  if (!tag) return { success: false as const, message: "العلامة غير موجودة" };

  await prisma.customerTag.update({
    where: { id: tagId },
    data: { name: name.trim(), color },
  });

  revalidatePath("/dashboard/crm/tags");
  return { success: true as const };
}

export async function DeleteTagAction(tagId: string) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const tag = await prisma.customerTag.findFirst({ where: { id: tagId, storeId } });
  if (!tag) return { success: false as const, message: "العلامة غير موجودة" };

  await prisma.customerTag.delete({ where: { id: tagId } });

  revalidatePath("/dashboard/crm/tags");
  revalidatePath("/dashboard/crm/customers");
  return { success: true as const };
}

// ─── Tag Assignments ──────────────────────────────────────────────────────────

export async function AssignTagAction(customerId: string, tagId: string) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const [customer, tag] = await Promise.all([
    prisma.customer.findFirst({ where: { id: customerId, storeId } }),
    prisma.customerTag.findFirst({ where: { id: tagId, storeId } }),
  ]);
  if (!customer || !tag) return { success: false as const, message: "بيانات غير صحيحة" };

  await prisma.customerTagAssignment.upsert({
    where: { customerId_tagId: { customerId, tagId } },
    create: { customerId, tagId },
    update: {},
  });

  await prisma.customerTimeline.create({
    data: {
      customerId,
      storeId,
      eventType: "TAG_ADDED",
      title: `إضافة علامة: ${tag.name}`,
    },
  });

  revalidatePath(`/dashboard/crm/customers/${customerId}`);
  return { success: true as const };
}

export async function RemoveTagAction(customerId: string, tagId: string) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const customer = await prisma.customer.findFirst({ where: { id: customerId, storeId } });
  if (!customer) return { success: false as const, message: "العميل غير موجود" };

  const tag = await prisma.customerTag.findFirst({ where: { id: tagId, storeId } });

  await prisma.customerTagAssignment.deleteMany({
    where: { customerId, tagId },
  });

  if (tag) {
    await prisma.customerTimeline.create({
      data: {
        customerId,
        storeId,
        eventType: "TAG_REMOVED",
        title: `إزالة علامة: ${tag.name}`,
      },
    });
  }

  revalidatePath(`/dashboard/crm/customers/${customerId}`);
  return { success: true as const };
}
