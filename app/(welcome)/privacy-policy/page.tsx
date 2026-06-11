import { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | كاشو",
  description: "سياسة الخصوصية لمنصة كاشو للتجارة الإلكترونية",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4" dir="rtl">
      <h1 className="text-3xl font-bold mb-2">سياسة الخصوصية</h1>
      <p className="text-muted-foreground mb-10">آخر تحديث: مايو 2026</p>

      <section className="space-y-8 text-sm leading-relaxed text-foreground/80">

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">١. مقدمة</h2>
          <p>
            كاشو (<strong>casho.store</strong>) منصة متجر إلكتروني تتيح للتجار إنشاء متاجرهم
            وإدارة طلباتهم. نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية وفقاً لهذه
            السياسة.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٢. البيانات التي نجمعها</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>بيانات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف.</li>
            <li>بيانات المتجر: اسم المتجر، المنتجات، الطلبات.</li>
            <li>بيانات الدفع: معرّفات المعاملات فقط — لا نخزّن بيانات البطاقات.</li>
            <li>بيانات التكاملات: رموز الوصول (Access Tokens) للخدمات المرتبطة مثل Instagram، وتُخزَّن مشفّرة.</li>
            <li>بيانات الاستخدام: سجلات الدخول ونشاط المتجر.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٣. كيف نستخدم البيانات</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>تشغيل المنصة وتقديم خدماتها للتجار.</li>
            <li>معالجة الطلبات وإشعار التجار بها.</li>
            <li>ربط حسابات Instagram لعرض الرسائل داخل لوحة التحكم وتحويلها لطلبات.</li>
            <li>إرسال إشعارات تتعلق بالحساب والاشتراك.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٤. مشاركة البيانات</h2>
          <p>
            لا نبيع بياناتك ولا نشاركها مع أطراف ثالثة إلا في الحالات التالية:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>مزودو الخدمات الضروريين لتشغيل المنصة (قواعد البيانات، بوابات الدفع، خدمات البريد).</li>
            <li>عند الالتزام بمتطلبات قانونية.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٥. بيانات Instagram</h2>
          <p>
            عند ربط حساب Instagram الخاص بك، نطلب الأذونات التالية:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>instagram_business_basic</strong> — للتحقق من هوية الحساب.</li>
            <li><strong>instagram_business_manage_messages</strong> — لعرض رسائل العملاء داخل لوحة التحكم.</li>
          </ul>
          <p className="mt-2">
            نخزّن رمز الوصول مشفّراً ولا نستخدمه إلا لجلب الرسائل المتعلقة بمتجرك.
            يمكنك إلغاء الربط في أي وقت من إعدادات التكاملات.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٦. حذف البيانات</h2>
          <p>
            يمكنك طلب حذف حسابك وجميع بياناتك بالتواصل معنا على:{" "}
            <a href="mailto:cashostore0@gmail.com" className="text-primary underline">
              cashostore0@gmail.com
            </a>
            . سنقوم بحذف بياناتك خلال 30 يوماً.
          </p>
          <p className="mt-2">
            لإلغاء ربط Instagram وحذف بيانات الرسائل المخزّنة، اذهب إلى لوحة التحكم ←
            التكاملات ← Instagram ← فصل الحساب.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٧. الأمان</h2>
          <p>
            نستخدم تشفير AES-256-GCM لحماية رموز الوصول، واتصالات HTTPS لجميع البيانات
            المنقولة، وقواعد بيانات محمية بكلمات مرور قوية.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٨. التواصل معنا</h2>
          <p className="mb-1">
            لأي استفسار يتعلق بالخصوصية تواصل معنا على:{" "}
            <a href="mailto:cashostore0@gmail.com" className="text-primary underline">
              cashostore0@gmail.com
            </a>
          </p>
          <p>
            العنوان القانوني: 58 شارع الحجاز، برج أمون، مصر الجديدة، القاهرة —{" "}
            58 Hegaz St., Amoun Tower, Heliopolis, Cairo
          </p>
        </div>

      </section>
    </div>
  );
}
