import { TopupMethod } from "@prisma/client";

export const TOPUP_METHODS = [
  {
    value: TopupMethod.VODAFONE_CASH,
    label: "فودافون كاش",
    instructions: "حوّل على الرقم: 01014344053",
  },
  {
    value: TopupMethod.INSTAPAY,
    label: "انستا باي",
    instructions: "حوّل على: 01227984868",
  },
  {
    value: TopupMethod.BANK_TRANSFER,
    label: "تحويل بنكي",
    instructions: "حوّل على الحساب البنكي : 1325001309133003032 - البنك الأهلي المصري",
  },
] as const;

export const TOPUP_PRESET_AMOUNTS = [
  10000, // 100 EGP
  20000, // 200 EGP
  50000, // 500 EGP
  100000, // 1000 EGP
];
