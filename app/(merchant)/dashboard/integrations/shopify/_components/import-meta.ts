import type { PillTone } from "@/components/saas-page";
import type { ImportableEntity, SkipReason } from "@/lib/integrations/import/types";

export const ENTITY_META: Record<ImportableEntity, { label: string; noun: string; includes: string }> = {
  COLLECTION: { label: "التصنيفات", noun: "تصنيف", includes: "الـ Collections بصورها" },
  PRODUCT: {
    label: "المنتجات",
    noun: "منتج",
    includes: "الأنواع (Variants)، الصور، المخزون، الأسعار وسعر التكلفة، الوسوم، المقاسات والألوان",
  },
  CUSTOMER: { label: "العملاء", noun: "عميل", includes: "الاسم، الموبايل، الإيميل، العنوان، الملاحظات والوسوم" },
  ORDER: { label: "الطلبات", noun: "طلب", includes: "المنتجات والكميات، الإجماليات، الشحن والخصم، الحالة وربطها بالعميل" },
};

export const ITEM_ENTITY_LABEL: Record<string, string> = {
  COLLECTION: "تصنيف",
  PRODUCT: "منتج",
  VARIANT: "نوع منتج",
  CUSTOMER: "عميل",
  ORDER: "طلب",
};

export const JOB_STATUS_META: Record<string, { label: string; tone: PillTone }> = {
  QUEUED: { label: "في الانتظار", tone: "info" },
  RUNNING: { label: "جاري الاستيراد", tone: "info" },
  PAUSED: { label: "متوقف", tone: "warning" },
  COMPLETED: { label: "اكتمل", tone: "success" },
  COMPLETED_WITH_ERRORS: { label: "اكتمل مع مشاكل", tone: "warning" },
  CANCELED: { label: "اتلغى", tone: "neutral" },
};

export const SKIP_REASON_LABEL: Record<SkipReason, string> = {
  NO_PHONE: "من غير رقم موبايل (Kasho بيعرّف العميل برقمه)",
  EMPTY: "بيانات فاضية",
};

/** Messages for ?error= after the OAuth round trip. */
export const CONNECT_ERRORS: Record<string, string> = {
  denied: "تم إلغاء الربط من صفحة Shopify.",
  invalid_shop: "اكتب رابط متجر Shopify صحيح، مثلاً my-store.myshopify.com",
  invalid_state: "انتهت صلاحية محاولة الربط أو اتفتحت من متصفح تاني — جرّب تاني.",
  invalid_hmac: "رد Shopify مش موثّق — جرّب تاني.",
  invalid_request: "رد Shopify ناقص — جرّب تاني.",
  session_mismatch: "لازم تكمّل الربط بنفس الحساب اللي بدأت بيه.",
  forbidden: "صاحب المتجر بس هو اللي يقدر يربط Shopify ويستورد البيانات.",
  missing_scopes: "لازم توافق على كل الصلاحيات المطلوبة عشان نقدر ننقل بياناتك.",
  exchange_failed: "Shopify رفض إكمال الربط — جرّب تاني بعد شوية.",
  not_configured: "الربط مع Shopify لسه مش متفعّل على المنصة — تواصل مع الدعم.",
  server_error: "حصل خطأ غير متوقع أثناء الربط — جرّب تاني.",
};

/** Not imported — shown in the preview so nothing is promised that isn't done. */
export const NOT_IMPORTED = [
  "أكواد الخصم والعروض",
  "كروت الهدايا (Gift cards)",
  "الصفحات والمدونة",
  "تصميم المتجر والثيم",
  "إعدادات الشحن والضرائب والدفع",
  "كلمات سر العملاء (Shopify مبيسمحش بنقلها)",
  "تفاصيل المرتجعات والمبالغ المستردة",
  "الحقول المخصصة (Metafields) والتطبيقات",
];

export const nf = new Intl.NumberFormat("ar-EG");
export const dateTime = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
