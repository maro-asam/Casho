import type { FeatureType } from "@prisma/client";

export const FEATURE_TYPE_LABELS: Record<FeatureType, string> = {
  BOOLEAN: "تشغيل / إيقاف",
  NUMERIC_LIMIT: "حد رقمي",
  PERCENTAGE: "نسبة",
  TEXT: "نص",
  ENUM: "اختيار من قائمة",
};
