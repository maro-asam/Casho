import type { PillTone } from "@/components/saas-page";
import type { ImportableEntity, SkipReason } from "@/lib/integrations/import/types";
import { lazyIntl, lazyList, tr } from "@/lib/i18n/dashboard";

export const ENTITY_META: Record<ImportableEntity, { label: string; noun: string; includes: string }> = {
  COLLECTION: { get label() { return tr("التصنيفات"); }, get noun() { return tr("تصنيف"); }, get includes() { return tr("الـ Collections بصورها"); } },
  PRODUCT: {
    get label() { return tr("المنتجات"); },
    get noun() { return tr("منتج"); },
    get includes() { return tr("الأنواع (Variants)، الصور، المخزون، الأسعار وسعر التكلفة، الوسوم، المقاسات والألوان"); },
  },
  CUSTOMER: { get label() { return tr("العملاء"); }, get noun() { return tr("عميل"); }, get includes() { return tr("الاسم، الموبايل، الإيميل، العنوان، الملاحظات والوسوم"); } },
  ORDER: { get label() { return tr("الطلبات"); }, get noun() { return tr("طلب"); }, get includes() { return tr("المنتجات والكميات، الإجماليات، الشحن والخصم، الحالة وربطها بالعميل"); } },
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
  get NO_PHONE() { return tr("من غير رقم موبايل (Kasho بيعرّف العميل برقمه)"); },
  get EMPTY() { return tr("بيانات فاضية"); },
};

/** Messages for ?error= after the OAuth round trip. */
export const CONNECT_ERRORS: Record<string, string> = {
  get denied() { return tr("تم إلغاء الربط من صفحة Shopify."); },
  get invalid_shop() { return tr("اكتب رابط متجر Shopify صحيح، مثلاً my-store.myshopify.com"); },
  get invalid_state() { return tr("انتهت صلاحية محاولة الربط أو اتفتحت من متصفح تاني — جرّب تاني."); },
  get invalid_hmac() { return tr("رد Shopify مش موثّق — جرّب تاني."); },
  get invalid_request() { return tr("رد Shopify ناقص — جرّب تاني."); },
  get session_mismatch() { return tr("لازم تكمّل الربط بنفس الحساب اللي بدأت بيه."); },
  get forbidden() { return tr("صاحب المتجر بس هو اللي يقدر يربط Shopify ويستورد البيانات."); },
  get missing_scopes() { return tr("لازم توافق على كل الصلاحيات المطلوبة عشان نقدر ننقل بياناتك."); },
  get exchange_failed() { return tr("Shopify رفض إكمال الربط — جرّب تاني بعد شوية."); },
  get not_configured() { return tr("الربط مع Shopify لسه مش متفعّل على المنصة — تواصل مع الدعم."); },
  get server_error() { return tr("حصل خطأ غير متوقع أثناء الربط — جرّب تاني."); },
};

/** Not imported — shown in the preview so nothing is promised that isn't done. */
export const NOT_IMPORTED = lazyList([
  "أكواد الخصم والعروض",
  "كروت الهدايا (Gift cards)",
  "الصفحات والمدونة",
  "تصميم المتجر والثيم",
  "إعدادات الشحن والضرائب والدفع",
  "كلمات سر العملاء (Shopify مبيسمحش بنقلها)",
  "تفاصيل المرتجعات والمبالغ المستردة",
  "الحقول المخصصة (Metafields) والتطبيقات",
]);

export const nf = lazyIntl.number();
export const dateTime = lazyIntl.date({
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
