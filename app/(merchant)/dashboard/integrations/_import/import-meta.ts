import type { PillTone } from "@/components/saas-page";
import type { ImportableEntity, SkipReason } from "@/lib/integrations/import/types";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

export const ENTITY_META: Record<ImportableEntity, { label: string; noun: string }> = {
  COLLECTION: { get label() { return tr("التصنيفات"); }, get noun() { return tr("تصنيف"); } },
  PRODUCT: { get label() { return tr("المنتجات"); }, get noun() { return tr("منتج"); } },
  CUSTOMER: { get label() { return tr("العملاء"); }, get noun() { return tr("عميل"); } },
  ORDER: { get label() { return tr("الطلبات"); }, get noun() { return tr("طلب"); } },
};

export const ITEM_ENTITY_LABEL: Record<string, string> = {
  get COLLECTION() { return tr("تصنيف"); },
  get PRODUCT() { return tr("منتج"); },
  get VARIANT() { return tr("نوع منتج"); },
  get CUSTOMER() { return tr("عميل"); },
  get ORDER() { return tr("طلب"); },
};

export const JOB_STATUS_META: Record<string, { label: string; tone: PillTone }> = {
  QUEUED: { get label() { return tr("في الانتظار"); }, tone: "info" },
  RUNNING: { get label() { return tr("جاري الاستيراد"); }, tone: "info" },
  PAUSED: { get label() { return tr("متوقف"); }, tone: "warning" },
  COMPLETED: { get label() { return tr("اكتمل"); }, tone: "success" },
  COMPLETED_WITH_ERRORS: { get label() { return tr("اكتمل مع مشاكل"); }, tone: "warning" },
  CANCELED: { get label() { return tr("اتلغى"); }, tone: "neutral" },
};

export const SKIP_REASON_LABEL: Record<SkipReason, string> = {
  get NO_PHONE() { return tr("من غير رقم موبايل (Casho بيعرّف العميل برقمه)"); },
  get EMPTY() { return tr("بيانات فاضية"); },
};

export const nf = lazyIntl.number();
export const dateTime = lazyIntl.date({
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
