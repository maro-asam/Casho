"use server";

import { revalidatePath } from "next/cache";
import { SalesWithdrawalStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSalesRep } from "@/lib/sales/guard";
import { getPayableItems } from "@/lib/sales/queries";
import { SALES_CURRENCY } from "@/lib/sales/rules";
import { requestWithdrawalSchema } from "@/validations/sales.schema";

// The rep's side of "طلب سحب الأرباح". The rep id always comes from the
// session (requireSalesRep), never from the browser. Admin side: payouts page
// (record the transfer, which settles the request, or reject it).

export type WithdrawalActionResult = { success: boolean; message: string; fieldErrors?: Record<string, string> };

function revalidate() {
  revalidatePath("/sales", "layout");
  revalidatePath("/admin/sales", "layout");
  revalidatePath("/admin", "layout"); // sidebar badge
}

/** Asks the admins to pay the rep's whole payable to the given account. One open request at a time. */
export async function requestWithdrawalAction(input: unknown): Promise<WithdrawalActionResult> {
  const rep = await requireSalesRep();
  const parsed = requestWithdrawalSchema.safeParse(input);
  
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { success: false, message: Object.values(fieldErrors)[0] ?? "راجع البيانات", fieldErrors };
  }
  const { method, account, note } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    // Same lock as recording a payout: a request and a payout never interleave,
    // and two quick clicks can't open two requests.
    await tx.$queryRaw`SELECT "id" FROM "SalesRep" WHERE "id" = ${rep.salesRepId} FOR UPDATE`;

    const open = await tx.salesWithdrawalRequest.findFirst({
      where: { salesRepId: rep.salesRepId, status: SalesWithdrawalStatus.PENDING },
      select: { id: true },
    });
    if (open) return { error: "عندك طلب سحب مفتوح — استنى الإدارة ترد عليه أو ألغيه الأول" };

    const payable = await getPayableItems(tx, rep.salesRepId);
    if (payable.total <= 0) return { error: "مفيش مبلغ مستحق تسحبه دلوقتي" };

    const request = await tx.salesWithdrawalRequest.create({
      data: { salesRepId: rep.salesRepId, amount: payable.total, currency: SALES_CURRENCY, method, account, note: note || null },
      select: { id: true },
    });
    await tx.salesAuditLog.create({
      data: {
        actorUserId: rep.userId,
        action: "withdrawal_requested",
        entityType: "SalesWithdrawalRequest",
        entityId: request.id,
        salesRepId: rep.salesRepId,
        after: { amount: payable.total, currency: SALES_CURRENCY, method },
      },
    });
    return { error: null };
  });

  if (result.error) return { success: false, message: result.error };
  revalidate();
  return { success: true, message: "طلبك وصل للإدارة — هيوصلك إشعار أول ما يتحوّل" };
}

/** The rep withdraws their own open request. */
export async function cancelWithdrawalAction(requestId: unknown): Promise<WithdrawalActionResult> {
  const rep = await requireSalesRep();
  const id = z.string().uuid().safeParse(requestId);
  if (!id.success) return { success: false, message: "الطلب مش موجود" };

  const { count } = await prisma.salesWithdrawalRequest.updateMany({
    where: { id: id.data, salesRepId: rep.salesRepId, status: SalesWithdrawalStatus.PENDING },
    data: { status: SalesWithdrawalStatus.CANCELED, decidedAt: new Date(), decidedById: rep.userId },
  });
  if (!count) return { success: false, message: "الطلب ده اتقفل بالفعل" };

  await prisma.salesAuditLog
    .create({
      data: { actorUserId: rep.userId, action: "withdrawal_canceled", entityType: "SalesWithdrawalRequest", entityId: id.data, salesRepId: rep.salesRepId },
    })
    .catch((e) => console.error("[withdrawal] audit", e));
  revalidate();
  return { success: true, message: "اتلغى طلب السحب" };
}
