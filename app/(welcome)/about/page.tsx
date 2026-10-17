import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRightLeft, Boxes, CreditCard, Megaphone, ShieldCheck, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "عن كاشو | كاشو",
  description: "كاشو منصة تجارة إلكترونية مصرية بتساعد التجار يعملوا متجرهم أونلاين ويديروا طلباتهم ومخزونهم ومبيعاتهم من مكان واحد.",
  alternates: { canonical: "https://casho.store/about" },
};

const PILLARS = [
  {
    icon: Store,
    title: "متجر جاهز في دقايق",
    body: "اسم متجرك على رابط خاص بيك أو على دومينك، بثيمات عربية جاهزة تقدر تغيّر ألوانها وخطوطها وأقسامها من غير كود.",
  },
  {
    icon: CreditCard,
    title: "طرق دفع المصريين",
    body: "الدفع عند الاستلام، فودافون كاش، إنستاباي، التحويل البنكي، والدفع أونلاين بالكارت والمحافظ — والأسعار كلها بالجنيه.",
  },
  {
    icon: Boxes,
    title: "إدارة البيزنس كله",
    body: "الطلبات والمخزون والفروع والعملاء ونقطة البيع للمحل، والتقارير — كل ده في لوحة تحكم واحدة بالعربي.",
  },
  {
    icon: Megaphone,
    title: "أدوات تسويق",
    body: "أكواد خصم، نقاط ولاء، استرجاع السلات المتروكة، الظهور في جوجل، وربط بيكسل فيسبوك وتيك توك وسناب لقياس إعلاناتك.",
  },
  {
    icon: ShieldCheck,
    title: "حماية من الأوردرات الوهمية",
    body: "سمعة لكل رقم موبايل، حظر الأرقام اللي بترفض الاستلام، وتأكيد الطلب بكود — عشان فلوس الشحن ماتضيعش.",
  },
  {
    icon: ArrowRightLeft,
    title: "نقل متجرك بسهولة",
    body: "جاي من Shopify؟ انقل منتجاتك وتصنيفاتك وعملاءك لكاشو من غير ما تبدأ من الصفر.",
  },
];

const PRINCIPLES = [
  { title: "عربي من الأول", body: "الواجهة والمتجر والدعم بالعربي، ومعمولين للتاجر المصري مش مترجمين." },
  { title: "من غير مصاريف خفية", body: "اشتراك واضح بتدفعه من رصيدك، وتشوف كل جنيه اتخصم فين." },
  { title: "بسيط", body: "أي حد يقدر يفتح متجره ويشغّله من غير مبرمج ولا خبرة تقنية." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16" dir="rtl">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-primary">عن كاشو</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">بنساعد التاجر المصري يبيع أونلاين بشكل أبسط</h1>
        <p className="mt-4 leading-8 text-muted-foreground">
          كاشو منصة تجارة إلكترونية مصرية. معظم التجار عندنا بدأوا بالبيع على الشات — رسايل كتير، طلبات بتضيع، وحسابات على ورقة.
          عملنا كاشو عشان أي تاجر يقدر يعمل متجر أونلاين حقيقي، يستقبل طلباته منظمة، ويدير مخزونه وعملاءه ومبيعاته من مكان واحد.
        </p>
      </header>

      <section aria-labelledby="what-title" className="mt-14">
        <h2 id="what-title" className="text-xl font-semibold">
          كاشو بيقدّم إيه
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="principles-title" className="mt-14">
        <h2 id="principles-title" className="text-xl font-semibold">
          اللي بنمشي عليه
        </h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-2xl bg-muted/50 p-5">
              <dt className="font-semibold">{p.title}</dt>
              <dd className="mt-2 text-sm leading-7 text-muted-foreground">{p.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="company-title" className="mt-14 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 id="company-title" className="text-xl font-semibold">
          الشركة
        </h2>
        <dl className="mt-4 divide-y divide-border text-sm">
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
            <dt className="text-muted-foreground">الموقع</dt>
            <dd className="font-medium" dir="ltr">
              casho.store
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
            <dt className="text-muted-foreground">العنوان</dt>
            <dd className="font-medium">58 شارع الحجاز، برج أمون، مصر الجديدة، القاهرة</dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
            <dt className="text-muted-foreground">البريد الإلكتروني</dt>
            <dd>
              <a href="mailto:cashostore0@gmail.com" className="font-medium text-primary underline-offset-4 hover:underline" dir="ltr">
                cashostore0@gmail.com
              </a>
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
            <dt className="text-muted-foreground">الموبايل</dt>
            <dd>
              <a href="tel:+201014344053" className="font-medium text-primary underline-offset-4 hover:underline" dir="ltr">
                01014344053
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-14 flex flex-col items-start gap-4 rounded-2xl bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">جاهز تبدأ متجرك؟</h2>
          <p className="mt-1 text-sm text-muted-foreground">افتح متجرك النهارده، ولو عندك أي سؤال إحنا موجودين.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/register"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            ابدأ دلوقتي
            <ArrowLeft className="size-4" />
          </Link>
          <Link
            href="/contact-us"
            className="inline-flex h-10 items-center rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-muted"
          >
            تواصل معانا
          </Link>
        </div>
      </section>
    </div>
  );
}
