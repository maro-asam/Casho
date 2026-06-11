import { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الاسترداد | كاشو",
  description: "سياسة الاسترداد واسترجاع المبالغ لمنصة كاشو للتجارة الإلكترونية",
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4" dir="rtl">
      <h1 className="text-3xl font-bold mb-2">سياسة الاسترداد</h1>
      <p className="text-muted-foreground mb-10">آخر تحديث: يونيو 2026</p>

      <section className="space-y-8 text-sm leading-relaxed text-foreground/80">

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">١. مقدمة</h2>
          <p>
            تصف هذه السياسة الشروط التي يمكن بموجبها استرداد المبالغ المدفوعة على منصة
            كاشو (<strong>casho.store</strong>). نحرص على الشفافية الكاملة مع تجارنا وعملائهم
            فيما يخص عمليات الاسترداد.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٢. رسوم الاشتراك وشحن الرصيد</h2>
          <p className="mb-2">
            تعمل منصة كاشو بنظام الرصيد المدفوع مسبقًا، حيث يقوم التجار بشحن رصيدهم
            لتجديد اشتراكاتهم. فيما يخص هذه المدفوعات:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>الرصيد الذي تم شحنه ولم يُستخدم قابل للاسترداد خلال <strong>14 يومًا</strong> من تاريخ الشحن.</li>
            <li>رسوم الاشتراك المخصومة من الرصيد مقابل خدمة مفعّلة غير قابلة للاسترداد.</li>
            <li>في حال حدوث خصم مزدوج أو خطأ تقني، يتم استرداد المبلغ كاملًا فور التحقق.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٣. حالات الاسترداد المضمونة</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>تم الخصم من حسابك البنكي ولم يُضف الرصيد للمنصة.</li>
            <li>تم تكرار الدفع لنفس العملية أكثر من مرة.</li>
            <li>حدث خطأ تقني من جانبنا أدى إلى خصم غير صحيح.</li>
            <li>تم إلغاء الخدمة من طرفنا قبل انتهاء فترة الاشتراك المدفوعة.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٤. الحالات غير المشمولة بالاسترداد</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>رسوم الاشتراك بعد تفعيل الخدمة والاستخدام الفعلي.</li>
            <li>الرصيد الذي مضى على شحنه أكثر من 14 يومًا.</li>
            <li>طلبات الاسترداد الناتجة عن عدم استخدام المنصة مع بقاء الاشتراك مفعّلًا.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٥. سياسة استرداد المتاجر</h2>
          <p>
            كاشو منصة تمكّن التجار من إنشاء متاجرهم الإلكترونية. كل متجر مسؤول عن
            تحديد سياسة الاسترداد الخاصة به لمنتجاته وطلباته. إذا اشتريت منتجًا من
            أحد المتاجر العاملة على كاشو، يُرجى التواصل مع صاحب المتجر مباشرةً بشأن
            أي طلب استرداد.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٦. كيفية طلب الاسترداد</h2>
          <p className="mb-2">لتقديم طلب استرداد، يُرجى التواصل معنا خلال 14 يومًا من تاريخ الدفع:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              البريد الإلكتروني:{" "}
              <a href="mailto:cashostore0@gmail.com" className="text-primary underline">
                cashostore0@gmail.com
              </a>
            </li>
            <li>
              العنوان القانوني: 58 شارع الحجاز، برج أمون، مصر الجديدة، القاهرة —{" "}
              58 Hegaz St., Amoun Tower, Heliopolis, Cairo
            </li>
            <li>أذكر في رسالتك: اسم الحساب، تاريخ العملية، والمبلغ، ورقم المعاملة إن وُجد.</li>
          </ul>
          <p className="mt-2">
            سيتم الرد على طلبك خلال <strong>3 أيام عمل</strong>، وفي حال الموافقة يُعاد
            المبلغ إلى نفس وسيلة الدفع الأصلية خلال <strong>7–14 يوم عمل</strong> وفقًا
            لسياسة البنك أو بوابة الدفع.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٧. بوابة الدفع</h2>
          <p>
            تتم جميع عمليات الدفع وإعادة الأموال عبر بوابة الدفع <strong>Kashier</strong>.
            قد تخضع عمليات الاسترداد لسياسات وإجراءات Kashier الخاصة فيما يتعلق
            بالتوقيت والتنفيذ.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٨. تعديل السياسة</h2>
          <p>
            نحتفظ بالحق في تعديل هذه السياسة في أي وقت. سيتم إخطارك بأي تغييرات
            جوهرية عبر البريد الإلكتروني المسجّل لحسابك.
          </p>
        </div>

      </section>
    </div>
  );
}
