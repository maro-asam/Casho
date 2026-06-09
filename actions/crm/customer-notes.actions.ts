"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) throw new Error("المتجر غير موجود");
  return store.id;
}

export async function AddCustomerNoteAction(
  customerId: string,
  content: string
) {
  if (!content.trim()) return { success: false as const, message: "محتوى الملاحظة مطلوب" };

  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, storeId },
  });
  if (!customer) return { success: false as const, message: "العميل غير موجود" };

  const note = await prisma.customerNote.create({
    data: {
      customerId,
      storeId,
      content: content.trim(),
      authorId: userId,
      authorName: user?.name ?? "موظف",
    },
  });

  await prisma.customerTimeline.create({
    data: {
      customerId,
      storeId,
      eventType: "NOTE_ADDED",
      title: "إضافة ملاحظة",
      description: content.length > 80 ? content.slice(0, 80) + "…" : content,
    },
  });

  revalidatePath(`/dashboard/crm/customers/${customerId}`);
  return { success: true as const, note };
}

export async function DeleteCustomerNoteAction(noteId: string) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const note = await prisma.customerNote.findFirst({
    where: { id: noteId, storeId },
  });
  if (!note) return { success: false as const, message: "الملاحظة غير موجودة" };

  await prisma.customerNote.delete({ where: { id: noteId } });

  revalidatePath(`/dashboard/crm/customers/${note.customerId}`);
  return { success: true as const };
}
