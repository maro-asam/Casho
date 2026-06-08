import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  // Upsert category
  const category = await prisma.blogCategory.upsert({
    where: { slug: "payments-and-finance" },
    update: {},
    create: {
      name: "المدفوعات والمالية",
      slug: "payments-and-finance",
      color: "#10b981",
    },
  });

  const slug = "kashier-auto-payout-casho";

  const content = `## المشكلة اللي بيعاني منها كل تاجر

لو بتشتغل في التجارة الإلكترونية، غالبًا بتعرف السيناريو ده: عملاء بيدفعوا أونلاين، وأنت بتستنى يوم أو يومين أو أكتر عشان الفلوس تتحول لحسابك يدويًا، وكل مرة محتاج تطلب التحويل أو تتواصل مع الدعم.

ده مش بس مزعج — ده بيأثر على تدفق نقدك وقدرتك على إدارة المخزون والمصاريف.

كاشو بالشراكة مع **Kashier** حلّت المشكلة دي بشكل كامل.

---

## إيه هو Kashier؟

[Kashier](https://kashier.io) بوابة دفع مصرية متخصصة في التجارة الإلكترونية. بتدعم:

- الدفع ببطاقات Visa / Mastercard
- محافظ إلكترونية (Fawry, Vodafone Cash, وغيرها)
- تقسيط بدون فوائد مع شركاء متعددين
- تأمين عالي ومطابقة لمعايير PCI-DSS

والأهم من كل ده: **نظام التسوية التلقائية (Auto Payout)**.

---

## إيه هو Auto Payout وليه مهم؟

Auto Payout يعني إن فلوس عملاءك بتتحول أوتوماتيك لمحفظتك أو حسابك البنكي من غير ما تعمل أي حاجة يدوي.

### الفرق بين Manual وAuto:

| | يدوي (Manual) | تلقائي (Auto) |
|---|---|---|
| التحويل | بتطلبه أنت | بيحصل لوحده |
| الوقت | 1-3 أيام | حسب الجدول اللي بتحدده |
| الجهد | تواصل وانتظار | صفر تدخل |
| أخطاء | ممكن تنسى | مفيش نسيان |

---

## ازاي بيشتغل مع كاشو؟

لما تربط متجرك على كاشو ببوابة Kashier، كل دفعة بيعملها عميلك بتمر بالخطوات دي:

\`\`\`
عميل يدفع ← Kashier يتحقق ← الطلب يتأكد ← الفلوس تتحول لمحفظتك
\`\`\`

**ومش محتاج تعمل أي حاجة بينهم.**

---

## خطوات تفعيل الربط في كاشو

### ١. افتح حساب على Kashier

روح [kashier.io](https://kashier.io) وسجّل حساب تاجر. هتحتاج:
- بيانات شخصية أو بيانات الشركة
- حساب بنكي لاستقبال التحويلات
- وثائق التحقق المطلوبة

### ٢. احصل على بيانات الـ API

بعد ما يتم تفعيل حسابك، هتلاقي في لوحة تحكم Kashier:
- **Merchant ID**
- **Payment API Key**

### ٣. أضفها في إعدادات متجرك على كاشو

- افتح لوحة التحكم → الإعدادات → المدفوعات
- أدخل Merchant ID وAPI Key
- اختار وضع التشغيل (Test للتجربة، Live للإنتاج)
- احفظ الإعدادات

### ٤. فعّل الـ Auto Payout من Kashier

في لوحة Kashier:
- اذهب إلى **Settlement Settings**
- اختار جدول التحويل (يومي، أسبوعي، أو بعد كل معاملة)
- حدد الحساب البنكي أو المحفظة الإلكترونية

---

## نصايح عملية

**اختار جدول التحويل المناسب لك:**
- لو بتبيع بكميات كبيرة: يومي أفضل لتدفق النقد
- لو مبيعاتك متوسطة: أسبوعي كافي ويقلل العمولات

**اتابع لوحة التحكم:**
كاشو بيعرض كل الطلبات وحالات الدفع في الوقت الفعلي، وأي مشكلة في التحويل بتيجي إشعار فوري.

**استخدم وضع Test قبل Live:**
قبل ما تفعّل الدفع الحقيقي، جرّب على بطاقات الاختبار اللي Kashier بيوفرها عشان تتأكد إن كل حاجة شغالة صح.

---

## خلاصة

ربط كاشو مع Kashier مش بس بيوفر عليك وقت — ده بيحوّل طريقة إدارتك للفلوس بشكل كامل. من يوم ما تفعّل الـ Auto Payout، مش هتفكر تاني في "امتى هتيجي الفلوس؟" — هي بتيجي لوحدها.

**ابدأ دلوقتي وخلي متجرك يشتغل وأنت نايم.**
`;

  await prisma.blogPost.upsert({
    where: { slug },
    update: {
      title: "ازاي تستخدم Kashier مع كاشو وتحول فلوسك أوتوماتيك على طول",
      excerpt:
        "مع ربط كاشو ببوابة Kashier، مش محتاج تطلب تحويل فلوسك يدوي كل مرة. تعرف على نظام Auto Payout وازاي تفعّله في دقائق.",
      content,
      categoryId: category.id,
      authorName: "فريق كاشو",
      status: "PUBLISHED",
      featured: false,
      readTime: 5,
      seoTitle: "ربط Kashier مع كاشو — تحويل تلقائي للأرباح | كاشو",
      seoDescription:
        "تعرف على طريقة ربط متجرك على كاشو ببوابة الدفع Kashier وتفعيل التحويل التلقائي للأرباح بدون تدخل يدوي.",
      seoKeywords: ["kashier", "كاشير", "بوابة دفع", "تحويل تلقائي", "auto payout", "كاشو", "متجر إلكتروني"],
      publishedAt: new Date(),
    },
    create: {
      title: "ازاي تستخدم Kashier مع كاشو وتحول فلوسك أوتوماتيك على طول",
      slug,
      excerpt:
        "مع ربط كاشو ببوابة Kashier، مش محتاج تطلب تحويل فلوسك يدوي كل مرة. تعرف على نظام Auto Payout وازاي تفعّله في دقائق.",
      content,
      categoryId: category.id,
      authorName: "فريق كاشو",
      status: "PUBLISHED",
      featured: false,
      readTime: 5,
      seoTitle: "ربط Kashier مع كاشو — تحويل تلقائي للأرباح | كاشو",
      seoDescription:
        "تعرف على طريقة ربط متجرك على كاشو ببوابة الدفع Kashier وتفعيل التحويل التلقائي للأرباح بدون تدخل يدوي.",
      seoKeywords: ["kashier", "كاشير", "بوابة دفع", "تحويل تلقائي", "auto payout", "كاشو", "متجر إلكتروني"],
      publishedAt: new Date(),
    },
  });

  console.log("✓ Blog post created: Kashier Auto Payout");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
