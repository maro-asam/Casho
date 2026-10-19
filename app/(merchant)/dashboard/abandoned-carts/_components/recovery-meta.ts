import type { RecoveryStatus } from "@/lib/cart-recovery/abandoned";
import { tr } from "@/lib/i18n/dashboard";

export const RECOVERY_STATUSES: { value: RecoveryStatus; label: string; tone: "warning" | "info" | "success" | "neutral" }[] = [
  { value: "new", get label() { return tr("يقدر يترجع"); }, tone: "warning" },
  { value: "contacted", get label() { return tr("اتواصلت"); }, tone: "info" },
  { value: "recovered", get label() { return tr("رجع واشترى"); }, tone: "success" },
  { value: "unreachable", get label() { return tr("من غير رقم"); }, tone: "neutral" },
];

export const recoveryMeta = (s: RecoveryStatus) => RECOVERY_STATUSES.find((x) => x.value === s)!;
