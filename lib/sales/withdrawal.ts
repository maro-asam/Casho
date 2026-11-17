import type { SalesWithdrawalStatus } from "@prisma/client";
import type { PillTone } from "@/components/saas-page";

// "طلب سحب الأرباح": a rep asks to be paid what they're owed. The request only
// tells the admins where to send it; money moves outside Casho and the admin
// records a SalesPayout as usual, which settles the open request
// (recordSalesPayoutAction). Client-safe: no DB here.

/** Where a rep can be paid. Stored as the label, so the payout form can reuse it as-is. */
export const WITHDRAWAL_METHODS = ["إنستا باي", "فودافون كاش", "محفظة موبايل تانية", "تحويل بنكي"] as const;
export type WithdrawalMethod = (typeof WITHDRAWAL_METHODS)[number];

/** What to type in "account" for each method. */
export const WITHDRAWAL_ACCOUNT_HINT: Record<WithdrawalMethod, { label: string; placeholder: string }> = {
  "إنستا باي": { label: "عنوان إنستا باي أو رقم الموبايل", placeholder: "name@instapay" },
  "فودافون كاش": { label: "رقم المحفظة", placeholder: "01xxxxxxxxx" },
  "محفظة موبايل تانية": { label: "اسم المحفظة ورقمها", placeholder: "اتصالات كاش — 011xxxxxxxx" },
  "تحويل بنكي": { label: "البنك + IBAN أو رقم الحساب + اسم صاحب الحساب", placeholder: "EG00 0000 …" },
};

export const WITHDRAWAL_STATUS_META: Record<SalesWithdrawalStatus, { label: string; tone: PillTone }> = {
  PENDING: { label: "مستني الإدارة", tone: "warning" },
  PAID: { label: "اتصرف", tone: "success" },
  REJECTED: { label: "اترفض", tone: "danger" },
  CANCELED: { label: "ألغيته", tone: "neutral" },
};
