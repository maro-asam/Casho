import type { RecoveryStatus } from "@/lib/cart-recovery/abandoned";

export const RECOVERY_STATUSES: { value: RecoveryStatus; label: string; tone: "warning" | "info" | "success" | "neutral" }[] = [
  { value: "new", label: "يقدر يترجع", tone: "warning" },
  { value: "contacted", label: "اتواصلت", tone: "info" },
  { value: "recovered", label: "رجع واشترى", tone: "success" },
  { value: "unreachable", label: "من غير رقم", tone: "neutral" },
];

export const recoveryMeta = (s: RecoveryStatus) => RECOVERY_STATUSES.find((x) => x.value === s)!;
