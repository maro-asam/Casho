"use client";

import { useLang } from "../../_i18n/LanguageContext";

// Copy for /compare/shopify. A page that names a competitor has to be right
// about it: every Shopify fact here is from Shopify's own pages, listed in
// `sources` with the date they were read. Re-read them before changing a
// Shopify number (the fee rates themselves live in ./fees.ts). Every Casho
// fact maps to shipped code — see ./DESIGN.md before adding a row.

type Row = { label: string; casho: string; cashoNote?: string; shopify: string; shopifyNote?: string };
type Group = { title: string; rows: Row[] };

const SOURCES = [
  { key: "pricing", href: "https://www.shopify.com/pricing" },
  { key: "payments", href: "https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries" },
  { key: "manual", href: "https://help.shopify.com/en/manual/payments/manual-payments" },
  { key: "billing", href: "https://help.shopify.com/manual/your-account/manage-billing/your-invoice/local-currency" },
] as const;

const ar = {
  hero: {
    eyebrow: "كاشو ولا شوبيفاي؟",
    title: "شوبيفاي معمول للعالم.",
    accent: "كاشو معمول لمصر.",
    subtitle: "الاتنين منصات قوية. بس لو بتبيع في مصر، الفرق بيبان في الكاش والجنيه والشحن.",
    cta: "ابدأ مجانًا",
    move: "انقل متجرك من شوبيفاي",
    facts: ["0% عمولة على طلباتك", "اشتراكك بالجنيه", "حماية من الأوردرات الوهمية"],
  },
  fee: {
    eyebrow: "العمولة",
    title: "فلوس طلباتك ليك.",
    accent: "كاشو مش بياخد منها نسبة.",
    subtitle:
      "Shopify Payments مش متاح في مصر، فأي دفع أونلاين على شوبيفاي بيعدّي من بوابة خارجية زي Paymob، وشوبيفاي بياخد عليه نسبة فوق رسوم البوابة.",
    salesLabel: "مبيعاتك الأونلاين في الشهر",
    planLabel: "باقة شوبيفاي",
    shopifyTakes: "شوبيفاي ياخد",
    cashoTakes: "كاشو ياخد",
    perMonth: "في الشهر، يعني {amount} في السنة",
    cashoNote: "على كل طلب، في كل باقة",
    money: "{amount} ج.م",
    note:
      "الحساب على الطلبات المدفوعة أونلاين بس، بالكارت أو المحفظة. الدفع عند الاستلام مفيهوش النسبة دي في الاتنين، ورسوم بوابة الدفع نفسها بتدفعها في الحالتين.",
  },
  compare: {
    eyebrow: "جنب بعض",
    title: "الفرق بالتفصيل.",
    accent: "سطر بسطر.",
    feature: "الميزة",
    casho: "كاشو",
    shopify: "شوبيفاي",
    groups: [
      {
        title: "الفلوس",
        rows: [
          {
            label: "اشتراكك بيتدفع",
            casho: "بالجنيه",
            cashoNote: "من رصيد متجرك: فودافون كاش أو إنستاباي أو تحويل أو كارت",
            shopify: "بالدولار",
            shopifyNote: "وبيتغير مع سعر الصرف",
          },
          {
            label: "نسبة المنصة من الطلبات الأونلاين",
            casho: "0%",
            cashoNote: "الفلوس بتروح على حساب Paymob بتاعك على طول",
            shopify: "2% أو 1% أو 0.6%",
            shopifyNote: "حسب الباقة، فوق رسوم بوابة الدفع",
          },
          {
            label: "فودافون كاش وإنستاباي وفوري",
            casho: "جاهزين",
            cashoNote: "فعّلهم من الإعدادات واكتب رقمك",
            shopify: "بتضيفهم بنفسك",
            shopifyNote: "كطرق دفع يدوي، أو بتطبيق بوابة دفع",
          },
        ],
      },
      {
        title: "الدفع عند الاستلام",
        rows: [
          {
            label: "سجل رقم العميل",
            casho: "جوه كاشو",
            cashoNote: "الرقم ده استلم كام مرة ورفض كام مرة، في متجرك وفي كل متاجر كاشو",
            shopify: "تطبيق خارجي",
          },
          {
            label: "بلوك للأرقام الوهمية",
            casho: "جوه كاشو",
            cashoNote: "بلوك لأي رقم، ورفض تلقائي للأرقام عالية الخطورة",
            shopify: "تطبيق خارجي",
          },
        ],
      },
      {
        title: "الشحن",
        rows: [
          {
            label: "بوليصة بوسطة وأرامكس ومايلرز",
            casho: "من صفحة الطلب",
            cashoNote: "والتتبع بيتحدّث لوحده",
            shopify: "تطبيق لكل شركة",
          },
        ],
      },
      {
        title: "البيع على السوشيال",
        rows: [
          {
            label: "طلبات من رسايل إنستجرام",
            casho: "الـ AI بيجهّزها",
            cashoNote: "بيطلّع الطلب من المحادثة، وأنت بتوافق عليه",
            shopify: "بتعملها بنفسك",
          },
        ],
      },
    ] as Group[],
  },
  move: {
    eyebrow: "النقل",
    title: "متجرك على شوبيفاي؟",
    accent: "هاته معاك.",
    subtitle: "منتجاتك وعملاءك وطلباتك بيتنقلوا لكاشو في الخلفية، ومتجرك على شوبيفاي مش بيتلمس.",
    steps: [
      { title: "اربط شوبيفاي", body: "اكتب رابط متجرك على شوبيفاي، ووافق على صلاحية القراية بس." },
      { title: "شوف هيتنقل إيه", body: "قبل ما أي حاجة تبدأ، بتشوف عدد المنتجات والعملاء والطلبات اللي هتتنقل." },
      { title: "سيبه يشتغل", body: "النقل بيكمل لوحده حتى لو قفلت الصفحة، ولو اتعاد مش بيكرر اللي اتنقل." },
    ],
    cta: "ابدأ وانقل متجرك",
    note: "التصميم مش بيتنقل: بتختار ثيم من ثيمات كاشو. وتقفل اشتراكك على شوبيفاي لما تكون جاهز.",
  },
  honest: {
    eyebrow: "بصراحة",
    title: "ساعات شوبيفاي",
    accent: "بيكون الاختيار الأصح.",
    items: [
      { title: "بتبيع برّه مصر", body: "لو عملاءك في دول كتير وبعملات مختلفة، شوبيفاي معمول للبيع العالمي من الأول." },
      { title: "محتاج تطبيقات كتير", body: "متجر تطبيقات شوبيفاي فيه آلاف التطبيقات. كاشو فيه اللي التاجر في مصر بيحتاجه، ولسه بيكبر." },
      { title: "عندك فريق مطورين", body: "لو بتبني تجربة مخصوصة جدًا، منظومة المطورين حوالين شوبيفاي أوسع." },
    ],
    closer: "لكن لو بتبيع في مصر، بالكاش وعلى واتساب وبالجنيه، كاشو معمول عشانك.",
  },
  sources: {
    lead: "معلومات شوبيفاي من صفحاتهم الرسمية، آخر مراجعة 14 نوفمبر 2026، وممكن تتغير:",
    labels: {
      pricing: "الأسعار والعمولة",
      payments: "دول Shopify Payments",
      manual: "الدفع اليدوي",
      billing: "عملة الفواتير",
    },
    trademark: "Shopify علامة تجارية مملوكة لـ Shopify Inc.، وكاشو مش تابعة لها.",
  },
};

const en: typeof ar = {
  hero: {
    eyebrow: "Casho or Shopify?",
    title: "Shopify is built for the world.",
    accent: "Casho is built for Egypt.",
    subtitle: "Both are strong platforms. If you sell in Egypt, the difference shows in cash, pounds and shipping.",
    cta: "Start free",
    move: "Move from Shopify",
    facts: ["0% commission on your orders", "Billed in Egyptian pounds", "Fake-order protection"],
  },
  fee: {
    eyebrow: "Commission",
    title: "Your orders, your money.",
    accent: "Casho takes no cut.",
    subtitle:
      "Shopify Payments isn't available in Egypt, so every online payment on Shopify goes through an outside gateway like Paymob, and Shopify adds its own fee on top of the gateway's.",
    salesLabel: "Your online sales per month",
    planLabel: "Shopify plan",
    shopifyTakes: "Shopify takes",
    cashoTakes: "Casho takes",
    perMonth: "A month, that's {amount} a year",
    cashoNote: "On every order, on every plan",
    money: "EGP {amount}",
    note:
      "Counts orders paid online only, by card or wallet. Cash on delivery carries no such fee on either, and the payment gateway's own fees apply on both.",
  },
  compare: {
    eyebrow: "Side by side",
    title: "The difference, in detail.",
    accent: "Line by line.",
    feature: "Feature",
    casho: "Casho",
    shopify: "Shopify",
    groups: [
      {
        title: "Money",
        rows: [
          {
            label: "Your plan is billed",
            casho: "In pounds",
            cashoNote: "From your store balance: Vodafone Cash, InstaPay, transfer or card",
            shopify: "In US dollars",
            shopifyNote: "And moves with the exchange rate",
          },
          {
            label: "Platform fee on online orders",
            casho: "0%",
            cashoNote: "Money goes straight to your own Paymob account",
            shopify: "2%, 1% or 0.6%",
            shopifyNote: "By plan, on top of the gateway's fees",
          },
          {
            label: "Vodafone Cash, InstaPay and Fawry",
            casho: "Ready",
            cashoNote: "Turn them on in settings and add your number",
            shopify: "You set them up",
            shopifyNote: "As manual methods, or through a gateway app",
          },
        ],
      },
      {
        title: "Cash on delivery",
        rows: [
          {
            label: "Customer number history",
            casho: "Built in",
            cashoNote: "How often this number accepted or refused, in your store and across every Casho store",
            shopify: "Third-party app",
          },
          {
            label: "Blocking fake numbers",
            casho: "Built in",
            cashoNote: "Block any number, and refuse high-risk numbers automatically",
            shopify: "Third-party app",
          },
        ],
      },
      {
        title: "Shipping",
        rows: [
          {
            label: "Bosta, Aramex and Mylerz waybills",
            casho: "From the order page",
            cashoNote: "And tracking updates itself",
            shopify: "One app per carrier",
          },
        ],
      },
      {
        title: "Selling on social",
        rows: [
          {
            label: "Orders from Instagram messages",
            casho: "AI drafts them",
            cashoNote: "It pulls the order out of the chat, you approve it",
            shopify: "You enter them yourself",
          },
        ],
      },
    ],
  },
  move: {
    eyebrow: "Moving",
    title: "On Shopify today?",
    accent: "Bring it with you.",
    subtitle: "Your products, customers and orders move to Casho in the background, and your Shopify store is left untouched.",
    steps: [
      { title: "Connect Shopify", body: "Enter your Shopify store's address and approve read-only access." },
      { title: "See what moves", body: "Before anything starts, you see how many products, customers and orders will move." },
      { title: "Let it run", body: "It keeps going even if you close the page, and a rerun never duplicates what already moved." },
    ],
    cta: "Start and move your store",
    note: "Your design doesn't move: you pick one of Casho's themes. Cancel Shopify whenever you're ready.",
  },
  honest: {
    eyebrow: "Honestly",
    title: "Sometimes Shopify",
    accent: "is the better choice.",
    items: [
      { title: "You sell outside Egypt", body: "If your customers are in many countries and currencies, Shopify was built for selling worldwide." },
      { title: "You need lots of apps", body: "Shopify's App Store has thousands of apps. Casho has what merchants in Egypt need, and it's growing." },
      { title: "You have a dev team", body: "If you're building something very custom, the developer ecosystem around Shopify is wider." },
    ],
    closer: "But if you sell in Egypt, in cash, on WhatsApp and in pounds, Casho is built for you.",
  },
  sources: {
    lead: "Shopify facts are from Shopify's own pages, last checked November 14, 2026, and may change:",
    labels: {
      pricing: "Pricing and fees",
      payments: "Shopify Payments countries",
      manual: "Manual payments",
      billing: "Billing currency",
    },
    trademark: "Shopify is a trademark of Shopify Inc. Casho is not affiliated with Shopify.",
  },
};

const compareCopy = { ar, en };

export const COMPARE_SOURCES = SOURCES;

export function useCompareCopy() {
  const { lang } = useLang();
  return compareCopy[lang];
}
