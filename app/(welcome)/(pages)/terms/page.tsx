import { Metadata } from "next";

export const metadata: Metadata = {
  title: "الشروط والأحكام | كاشو",
  description: "الشروط والأحكام لاستخدام منصة كاشو للتجارة الإلكترونية",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4" dir="rtl">
      <h1 className="text-3xl font-bold mb-2">الشروط والأحكام</h1>
      <p className="text-muted-foreground mb-10">آخر تحديث: يونيو 2026</p>

      <section className="space-y-8 text-sm leading-relaxed text-foreground/80">

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">١. القبول بالشروط</h2>
          <p>
            باستخدامك لمنصة كاشو (<strong>casho.store</strong>) فأنت توافق على الالتزام
            بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يُرجى عدم استخدام
            المنصة.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٢. وصف الخدمة</h2>
          <p>
            كاشو منصة SaaS تتيح للتجار إنشاء متاجر إلكترونية، عرض المنتجات، واستقبال
            الطلبات. تعمل المنصة بنظام اشتراك شهري يُخصم من رصيد التاجر المدفوع مسبقًا.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٣. الحساب والتسجيل</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>يجب أن تكون بالغًا (18 سنة أو أكثر) لإنشاء حساب.</li>
            <li>أنت مسؤول عن الحفاظ على سرية بيانات دخولك.</li>
            <li>يجب أن تكون المعلومات المُدخلة عند التسجيل صحيحة ومحدّثة.</li>
            <li>يحق لنا إيقاف أو حذف أي حساب يخالف هذه الشروط.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٤. الرصيد والاشتراك</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>تعمل المنصة بنظام رصيد مدفوع مسبقًا يُشحن عبر بوابة الدفع Kashier.</li>
            <li>يُخصم رسم الاشتراك الشهري تلقائيًا من رصيدك عند تجديد الاشتراك.</li>
            <li>في حال نفاد الرصيد، يدخل المتجر فترة سماح مدتها 3 أيام قبل التعليق.</li>
            <li>تخضع عمليات الاسترداد لسياسة الاسترداد المنفصلة المتاحة على المنصة.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٥. الاستخدام المقبول</h2>
          <p className="mb-2">يُحظر استخدام المنصة في:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>بيع منتجات مخالفة للقانون المصري أو الآداب العامة.</li>
            <li>نشر محتوى مضلل أو احتيالي.</li>
            <li>انتهاك حقوق الملكية الفكرية للآخرين.</li>
            <li>أي نشاط يضر بالمنصة أو مستخدميها الآخرين.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٦. مسؤولية التاجر</h2>
          <p>
            التاجر مسؤول مسؤولية كاملة عن منتجاته، أسعاره، وصف المنتجات، وتنفيذ
            الطلبات، وسياسة الاسترداد الخاصة بمتجره. كاشو وسيط تقني فقط ولا تتحمل
            أي مسؤولية تجاه عملاء المتاجر.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٧. الملكية الفكرية</h2>
          <p>
            جميع حقوق منصة كاشو — بما فيها التصميم والكود والعلامة التجارية — محفوظة
            لأصحابها. المحتوى الذي ترفعه على متجرك (صور، نصوص، منتجات) يبقى ملكك أنت.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٨. إيقاف الخدمة</h2>
          <p>
            يحق لنا إيقاف أو إنهاء حسابك فورًا في حال مخالفة هذه الشروط، مع إشعارك
            عبر البريد الإلكتروني. كما يمكنك إنهاء حسابك في أي وقت بالتواصل معنا.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">٩. تحديد المسؤولية</h2>
          <p>
            لا تتحمل كاشو المسؤولية عن أي خسائر غير مباشرة أو أرباح فائتة ناتجة عن
            استخدام أو عدم القدرة على استخدام المنصة. الحد الأقصى لمسؤوليتنا لا يتجاوز
            المبلغ المدفوع فعليًا خلال الشهر السابق للحادثة.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">١٠. تعديل الشروط</h2>
          <p>
            نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات
            جوهرية عبر البريد الإلكتروني قبل 7 أيام من تطبيقها. استمرارك في استخدام
            المنصة بعد ذلك يعني موافقتك على الشروط المحدّثة.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">١١. القانون المطبّق</h2>
          <p>
            تخضع هذه الشروط للقانون المصري، وتختص المحاكم المصرية بالفصل في أي نزاع
            ينشأ عنها.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">١٢. التواصل معنا</h2>
          <p className="mb-1">
            لأي استفسار يتعلق بهذه الشروط تواصل معنا على:{" "}
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
