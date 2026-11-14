/**
 * Everything on the import page that depends on the source platform: copy,
 * brand mark, connect form, warnings and what isn't imported. Shared panels
 * read it through `providerCopy(provider)` at render time (so text follows the
 * dashboard locale). Shopify's text is unchanged from the original page.
 */
import { KeyRound, Lock, ShoppingBag, ShoppingBasket, Undo2, type LucideIcon } from "lucide-react";
import type { ImportProvider } from "@prisma/client";
import type { ImportableEntity } from "@/lib/integrations/import/types";
import type { ConnectionView } from "@/lib/integrations/import/views";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

export type ProviderCopy = {
  label: string;
  pageTitle: string;
  pageSubtitle: string;
  connect: {
    action: string;
    field: string;
    inputLabel: string;
    placeholder: string;
    hint: string | null;
    title: string;
    reconnectTitle: string;
    subtitle: string;
    reconnectSubtitle: string;
    button: string;
    reconnectButton: string;
    redirecting: string;
    notConfigured: string;
    trust: { icon: LucideIcon; tint: string; text: string }[];
  };
  stepConnectHint: string;
  connectedHint: string;
  counting: string;
  moving: string;
  historyTitle: string;
  shopCardTitle: string;
  disconnectTitle: string;
  disconnectDescription: string;
  disconnected: string;
  entityIncludes: Record<ImportableEntity, string>;
  notImported: string[];
  connectErrors: Record<string, string>;
  previewNotes(connection: ConnectionView, selected: ImportableEntity[]): string[];
};

function commonNotes(selected: ImportableEntity[]) {
  const notes: string[] = [];
  if (selected.includes("ORDER") && !selected.includes("PRODUCT")) {
    notes.push(tr("الطلبات من غير المنتجات هتترتبط بمنتج «غير متاح» عام. الأفضل تنقل المنتجات معاها."));
  }
  if (selected.includes("CUSTOMER")) {
    notes.push(tr("العملاء اللي مالهمش رقم موبايل مش هيتنقلوا، لأن Casho بيعرّف العميل برقمه. هتلاقي عددهم في النتيجة."));
  }
  return notes;
}

function shopifyCopy(): ProviderCopy {
  return {
    label: "Shopify",
    pageTitle: tr("استيراد من Shopify"),
    pageSubtitle: tr("انقل منتجاتك وعملاءك وطلباتك من Shopify لمتجرك على Casho — من غير تكرار ومن غير ما تقعد جنب الصفحة."),
    connect: {
      action: "/api/integrations/shopify/oauth/initiate",
      field: "shop",
      inputLabel: tr("رابط متجر Shopify"),
      placeholder: "my-store.myshopify.com",
      hint: null,
      title: tr("اربط متجرك على Shopify"),
      reconnectTitle: tr("أعد ربط متجر Shopify"),
      subtitle: tr("انقل منتجاتك وعملائك وطلباتك من Shopify لـ Casho في خطوات بسيطة."),
      reconnectSubtitle: tr("صلاحية الربط انتهت أو اتلغت من Shopify. أعد الربط وكمّل الاستيراد من مكانه — مفيش حاجة هتتكرر."),
      button: tr("اربط مع Shopify"),
      reconnectButton: tr("أعد الربط"),
      redirecting: tr("بنحوّلك لـ Shopify…"),
      notConfigured: tr("الربط مع Shopify لسه مش متفعّل على المنصة. تواصل مع الدعم وهنفعّله لك."),
      trust: [
        { icon: KeyRound, tint: "bg-(--sys-gray)", text: tr("مش هنطلب منك كلمة سر Shopify — الربط بيتم من صفحة Shopify الرسمية") },
        { icon: Lock, tint: "bg-(--sys-green)", text: tr("صلاحيات قراءة فقط: مش هنعدّل أو نمسح أي حاجة في متجرك على Shopify") },
        { icon: Undo2, tint: "bg-primary", text: tr("تقدر تلغي الربط في أي وقت") },
      ],
    },
    stepConnectHint: tr("من صفحة Shopify الرسمية"),
    connectedHint: tr("هنعدّ اللي في متجرك على Shopify ونوريك هينقل إيه قبل ما نبدأ أي حاجة."),
    counting: tr("بنعدّ البيانات في متجرك على Shopify…"),
    moving: tr("بننقل بيانات متجرك من Shopify…"),
    historyTitle: tr("استيراد من Shopify"),
    shopCardTitle: tr("متجرك على Shopify"),
    disconnectTitle: tr("إلغاء الربط مع Shopify؟"),
    disconnectDescription: tr("البيانات اللي اتنقلت بالفعل هتفضل في متجرك على Casho. هنمسح مفاتيح الوصول لـ Shopify من عندنا."),
    disconnected: tr("تم إلغاء الربط مع Shopify"),
    entityIncludes: {
      COLLECTION: tr("الـ Collections بصورها"),
      PRODUCT: tr("الأنواع (Variants)، الصور، المخزون، الأسعار وسعر التكلفة، الوسوم، المقاسات والألوان"),
      CUSTOMER: tr("الاسم، الموبايل، الإيميل، العنوان، الملاحظات والوسوم"),
      ORDER: tr("المنتجات والكميات، الإجماليات، الشحن والخصم، الحالة وربطها بالعميل"),
    },
    notImported: [
      tr("أكواد الخصم والعروض"),
      tr("كروت الهدايا (Gift cards)"),
      tr("الصفحات والمدونة"),
      tr("تصميم المتجر والثيم"),
      tr("إعدادات الشحن والضرائب والدفع"),
      tr("كلمات سر العملاء (Shopify مبيسمحش بنقلها)"),
      tr("تفاصيل المرتجعات والمبالغ المستردة"),
      tr("الحقول المخصصة (Metafields) والتطبيقات"),
    ],
    connectErrors: {
      denied: tr("تم إلغاء الربط من صفحة Shopify."),
      invalid_shop: tr("اكتب رابط متجر Shopify صحيح، مثلاً my-store.myshopify.com"),
      invalid_state: tr("انتهت صلاحية محاولة الربط أو اتفتحت من متصفح تاني — جرّب تاني."),
      invalid_hmac: tr("رد Shopify مش موثّق — جرّب تاني."),
      invalid_request: tr("رد Shopify ناقص — جرّب تاني."),
      session_mismatch: tr("لازم تكمّل الربط بنفس الحساب اللي بدأت بيه."),
      forbidden: tr("صاحب المتجر بس هو اللي يقدر يربط Shopify ويستورد البيانات."),
      missing_scopes: tr("لازم توافق على كل الصلاحيات المطلوبة عشان نقدر ننقل بياناتك."),
      exchange_failed: tr("Shopify رفض إكمال الربط — جرّب تاني بعد شوية."),
      not_configured: tr("الربط مع Shopify لسه مش متفعّل على المنصة — تواصل مع الدعم."),
      server_error: tr("حصل خطأ غير متوقع أثناء الربط — جرّب تاني."),
    },
    previewNotes(connection, selected) {
      const notes: string[] = [];
      if (connection.currencyCode && connection.currencyCode !== "EGP") {
        notes.push(tr("عملة متجرك على Shopify {0}. الأسعار هتتنقل بنفس الأرقام من غير تحويل لعملة الجنيه — راجعها بعد الاستيراد.", connection.currencyCode));
      }
      if (!connection.hasAllOrders && selected.includes("ORDER")) {
        notes.push(tr("Shopify بيسمح لنا بقراءة طلبات آخر 60 يوم بس. الرقم اللي فوق هو عدد الطلبات اللي هتتنقل."));
      }
      notes.push(...commonNotes(selected));
      if (selected.includes("PRODUCT")) {
        notes.push(tr("المنتجات اللي مش متتبع مخزونها في Shopify هتتنقل بمخزون 999. والصور هتفضل على سيرفرات Shopify، يعني لو قفلت متجر Shopify نهائياً لازم ترفعها تاني."));
      }
      return notes;
    },
  };
}

function wooCommerceCopy(): ProviderCopy {
  return {
    label: "WooCommerce",
    pageTitle: tr("استيراد من WooCommerce"),
    pageSubtitle: tr("انقل منتجاتك وعملاءك وطلباتك من موقعك على WooCommerce لمتجرك على Casho — من غير تكرار ومن غير ما تقعد جنب الصفحة."),
    connect: {
      action: "/api/integrations/woocommerce/oauth/initiate",
      field: "site",
      inputLabel: tr("رابط موقعك على WooCommerce"),
      placeholder: "mystore.com",
      hint: tr("لازم الموقع يكون شغال بـ HTTPS، وهتحتاج تدخل لوحة ووردبريس بحساب أدمن عشان توافق."),
      title: tr("اربط موقعك على WooCommerce"),
      reconnectTitle: tr("أعد ربط موقع WooCommerce"),
      subtitle: tr("اكتب رابط موقعك وهتوافق على الربط من لوحة ووردبريس بتاعتك. بعدها منتجاتك وعملائك وطلباتك هيتنقلوا لـ Casho في الخلفية."),
      reconnectSubtitle: tr("مفتاح الربط اتلغى من WooCommerce أو موقعك بقى يرفضه. أعد الربط وكمّل الاستيراد من مكانه — مفيش حاجة هتتكرر."),
      button: tr("اربط مع WooCommerce"),
      reconnectButton: tr("أعد الربط"),
      redirecting: tr("بنتأكد من موقعك…"),
      notConfigured: tr("الربط مع WooCommerce لسه مش متفعّل على المنصة. تواصل مع الدعم وهنفعّله لك."),
      trust: [
        { icon: KeyRound, tint: "bg-(--sys-gray)", text: tr("مش هنطلب منك كلمة سر ووردبريس — بتوافق على الربط من لوحة موقعك نفسه") },
        { icon: Lock, tint: "bg-(--sys-green)", text: tr("صلاحيات قراءة فقط: مش هنعدّل أو نمسح أي حاجة في موقعك") },
        { icon: Undo2, tint: "bg-primary", text: tr("تقدر تلغي الربط في أي وقت، وتمسح المفتاح من إعدادات WooCommerce") },
      ],
    },
    stepConnectHint: tr("من لوحة ووردبريس بتاعتك"),
    connectedHint: tr("هنعدّ اللي في موقعك على WooCommerce ونوريك هينقل إيه قبل ما نبدأ أي حاجة."),
    counting: tr("بنعدّ البيانات في موقعك على WooCommerce…"),
    moving: tr("بننقل بيانات موقعك من WooCommerce…"),
    historyTitle: tr("استيراد من WooCommerce"),
    shopCardTitle: tr("موقعك على WooCommerce"),
    disconnectTitle: tr("إلغاء الربط مع WooCommerce؟"),
    disconnectDescription: tr("البيانات اللي اتنقلت بالفعل هتفضل في متجرك على Casho. هنمسح مفتاح الربط من عندنا — ولو عايز تقفله نهائياً امسحه من WooCommerce ← الإعدادات ← متقدم ← REST API."),
    disconnected: tr("تم إلغاء الربط مع WooCommerce"),
    entityIncludes: {
      COLLECTION: tr("تصنيفات المنتجات بصورها"),
      PRODUCT: tr("الأنواع (Variations)، الصور، المخزون، الأسعار والتخفيضات، الوسوم، الماركة، المقاسات والألوان"),
      CUSTOMER: tr("الاسم، الموبايل، الإيميل والعنوان"),
      ORDER: tr("المنتجات والكميات، الإجماليات، الشحن والخصم، الحالة وربطها بالعميل"),
    },
    notImported: [
      tr("أكواد الخصم (Coupons)"),
      tr("التقييمات (Reviews)"),
      tr("الصفحات والمقالات"),
      tr("تصميم الموقع والثيم والإضافات"),
      tr("إعدادات الشحن والضرائب والدفع"),
      tr("كلمات سر العملاء (مش متاح نقلها)"),
      tr("تفاصيل المرتجعات والمبالغ المستردة"),
      tr("الحقول المخصصة وبيانات الإضافات"),
    ],
    connectErrors: {
      denied: tr("تم إلغاء الربط من لوحة ووردبريس."),
      invalid_site: tr("اكتب رابط موقعك صحيح، مثلاً mystore.com"),
      unreachable: tr("مقدرناش نوصل لموقعك — اتأكد إن الرابط صح وإن الموقع شغال بـ HTTPS."),
      not_wordpress: tr("الرابط ده مش موقع ووردبريس، أو الـ REST API مقفول فيه."),
      no_woocommerce: tr("لقينا موقع ووردبريس بس WooCommerce مش متفعّل عليه."),
      plain_permalinks: tr("فعّل الروابط الدائمة في ووردبريس الأول: الإعدادات ← الروابط الدائمة ← «اسم المقالة»، وبعدين جرّب تاني."),
      rest_blocked: tr("موقعك رافض طلباتنا — غالباً إضافة حماية أو Cloudflare. اسمح بالـ REST API (wp-json) وجرّب تاني."),
      invalid_state: tr("انتهت صلاحية محاولة الربط أو اتفتحت من متصفح تاني — جرّب تاني."),
      session_mismatch: tr("لازم تكمّل الربط بنفس الحساب اللي بدأت بيه."),
      forbidden: tr("صاحب المتجر بس هو اللي يقدر يربط WooCommerce ويستورد البيانات."),
      callback_failed: tr("وافقت على الربط بس موقعك موصّلناش المفتاح — غالباً إضافة حماية بتمنع الاتصالات الخارجة من موقعك. جرّب تاني أو كلّم الدعم."),
      not_configured: tr("الربط مع WooCommerce لسه مش متفعّل على المنصة — تواصل مع الدعم."),
      server_error: tr("حصل خطأ غير متوقع أثناء الربط — جرّب تاني."),
    },
    previewNotes(connection, selected) {
      const notes: string[] = [];
      if (connection.currencyCode && connection.currencyCode !== "EGP") {
        notes.push(tr("عملة موقعك على WooCommerce {0}. الأسعار هتتنقل بنفس الأرقام من غير تحويل لعملة الجنيه — راجعها بعد الاستيراد.", connection.currencyCode));
      }
      notes.push(...commonNotes(selected));
      if (selected.includes("CUSTOMER")) {
        notes.push(tr("اللي طلبوا من غير ما يعملوا حساب على موقعك مش هيظهروا في قائمة العملاء، بس طلباتهم هتتنقل عادي بالاسم والموبايل."));
      }
      if (selected.includes("PRODUCT")) {
        notes.push(tr("المنتجات اللي مش متتبع مخزونها في WooCommerce هتتنقل بمخزون 999. والصور هتفضل على موقعك، يعني لو قفلت الموقع نهائياً لازم ترفعها تاني."));
        notes.push(tr("المنتجات المجمّعة (Grouped) مش هتتنقل كمنتج لوحدها — المنتجات اللي جواها هتتنقل عادي."));
      }
      return notes;
    },
  };
}

export function providerCopy(provider: ImportProvider): ProviderCopy {
  return provider === "WOOCOMMERCE" ? wooCommerceCopy() : shopifyCopy();
}

const MARKS: Record<ImportProvider, { icon: LucideIcon; gradient: string }> = {
  SHOPIFY: { icon: ShoppingBag, gradient: "from-[#95bf47] to-[#5e8e3e]" },
  WOOCOMMERCE: { icon: ShoppingBasket, gradient: "from-[#9b6dd1] to-[#6b3fa0]" },
};

/** The source platform's brand-colored squircle. */
export function ProviderMark({ provider, size = "md" }: { provider: ImportProvider; size?: "sm" | "md" | "lg" }) {
  const { icon: Icon, gradient } = MARKS[provider];
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center bg-linear-to-br text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
        gradient,
        size === "sm" && "size-[29px] rounded-[7px]",
        size === "md" && "size-11 rounded-[12px]",
        size === "lg" && "size-16 rounded-[18px]",
      )}
    >
      <Icon className={size === "sm" ? "size-[17px]" : size === "md" ? "size-5.5" : "size-8"} strokeWidth={2} />
    </span>
  );
}
