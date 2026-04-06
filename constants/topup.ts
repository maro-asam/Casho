import { TopupMethod } from "@/lib/generated/prisma/enums";

export const TOPUP_METHODS = [
  {
    value: TopupMethod.VODAFONE_CASH,
    label: "فودافون كاش",
    instructions: "حوّل على الرقم: 01014344053",
  },
  {
    value: TopupMethod.INSTAPAY,
    label: "انستا باي",
    instructions: "حوّل على: username@instapay",
  },
  {
    value: TopupMethod.BANK_TRANSFER,
    label: "تحويل بنكي",
    instructions: "حوّل على الحساب البنكي المخصص للشحن",
  },
] as const;

export const TOPUP_PRESET_AMOUNTS = [
  10000, // 100 EGP
  20000, // 200 EGP
  50000, // 500 EGP
  100000, // 1000 EGP
];
