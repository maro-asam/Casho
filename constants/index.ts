import {
  CreditCard,
  LayoutDashboard,
  LinkIcon,
  Package,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
} from "lucide-react";

// HERO
export const HERO_CONTENT = {
  badge: "دلوقتي 299 جنيه بس اشتراك اول 50 تاجر مدي الحياة",

  title: {
    before: " حوّل شغفك ل",
    highlight: "بيزنس حقيقي",
    after: "واستقبل طلباتك",
  },

  description: {
    highlight: "كاشو",
    title:
      "مش مجرد منصة لعرض المنتجات، دي أداة تساعدك تبدأ البيع بشكل منظم. ضيف منتجاتك، ابعت لينك متجرك لعملاءك، وتابع الطلبات والمبيعات من موبايلك بسهولة.",
  },

  pricing:
    "من غير عمولات معقدة ولا تكاليف كبيرة من البداية، ابدأ على قد احتياجك وكبر مشروعك واحدة واحدة.",

  primaryCta: "ابدأ متجرك دلوقتي",
  secondaryCta: "ليه كاشو؟",

  offer: "🔥 عرض البداية: اشتراك مدى الحياة بـ 299 ج.م لفترة محدودة",

  socialProof: "أكتر من 1,000 تاجر بدأوا يبيعوا بشكل أرتب مع كاشو",

  dashboard: {
    brand: "كاشو | Casho",
    title: "لوحة تحكم متجرك",
    status: "المتجر نشط",

    sales: {
      label: "مبيعات اليوم",
      value: "12,450 ج",
      hint: "آخر 24 ساعة",
    },

    orders: {
      label: "الطلبات",
      value: "24 طلب",
      hint: "+18% عن امبارح",
    },

    products: {
      label: "المنتجات",
      value: "128",
      hint: "جاهزة للبيع",
    },

    topProducts: {
      title: "المنتجات الأكثر طلبًا",
      description: "المنتجات اللي محققة أعلى مبيعات الأسبوع ده",
      button: "عرض الكل",
      items: [
        { name: "سماعة بلوتوث لاسلكية", price: "850 ج", sales: "32 طلب" },
        { name: "باور بانك سريع الشحن", price: "599 ج", sales: "18 طلب" },
        {
          name: "ساعة ذكية متعددة الاستخدام",
          price: "1,250 ج",
          sales: "14 طلب",
        },
      ],
    },

    mobileCta: "اطلب الآن",
    floatingBadge: {
      title: "طلبات جديدة",
      value: "+24",
    },
  },

  avatars: {
    countText: "انضم لمجتمع تجار كاشو",
    numPeople: 500,
    avatarUrls: [
      {
        imageUrl: "https://avatars.githubusercontent.com/u/16860528",
        profileUrl: "https://github.com/dillionverma",
      },
      {
        imageUrl: "https://avatars.githubusercontent.com/u/583231",
        profileUrl: "https://github.com/octocat",
      },
      {
        imageUrl: "https://avatars.githubusercontent.com/u/9919",
        profileUrl: "https://github.com/github",
      },
      {
        imageUrl: "https://avatars.githubusercontent.com/u/2",
        profileUrl: "https://github.com/defunkt",
      },
    ],
  },
};
// PAYMENT
export const PAYMENT_LOGOS = [
  {
    name: "Vodafone Cash",
    src: "/payment/vfcash.svg",
    alt: "Vodafone Cash logo",
  },
  {
    name: "Orange Cash",
    src: "/payment/ogcash.svg",
    alt: "Orange Cash logo",
  },
  {
    name: "Etisalat Cash",
    src: "/payment/ecash.svg",
    alt: "Etisalat Cash logo",
  },
  {
    name: "WE Pay",
    src: "/payment/wepay.svg",
    alt: "WE Pay logo",
  },
  {
    name: "InstaPay",
    src: "/payment/instapay.svg",
    alt: "InstaPay logo",
  },
  {
    name: "Fawry",
    src: "/payment/fawry.svg",
    alt: "Fawry logo",
  },
  {
    name: "Cash on Delivery",
    src: "/payment/cod.svg",
    alt: "Cash on Delivery icon",
  },
  {
    name: "PayPal",
    src: "/payment/paypal.svg",
    alt: "PayPal logo",
  },
  {
    name: "Bank Transfer",
    src: "/payment/bank.svg",
    alt: "Bank Transfer icon",
  },
];

// FEATURES
export const FEATURES_SECTION = {
  badge: "المميزات",
  title: {
    before: "كل اللي تحتاجه عشان تبدأ",
    highlight: "البيع أونلاين",
  },
  description:
    "منصة مصممة للتجار وأصحاب المشاريع اللي عايزين يبدؤوا بسرعة، يديروا منتجاتهم بسهولة، ويستقبلوا الطلبات بشكل احترافي من أول يوم.",
};

export const FEATURES_LIST = [
  {
    icon: ShoppingBag,
    title: "متجر إلكتروني جاهز للبيع",
    description:
      "ابدأ فورًا بواجهة متجر احترافية تعرض منتجاتك بشكل واضح وتساعدك تستقبل الطلبات بدون أي تعقيد تقني.",
  },
  {
    icon: LinkIcon,
    title: "رابط مخصص لمتجرك",
    description:
      "احصل على لينك خاص تقدر تشاركه بسهولة مع عملائك على واتساب وفيسبوك وإنستجرام وتبدأ البيع من أي مكان.",
  },
  {
    icon: Package,
    title: "إدارة سهلة للمنتجات",
    description:
      "أضف المنتجات والصور والأسعار وعدّل عليها في أي وقت من لوحة تحكم بسيطة وسريعة تناسب شغلك اليومي.",
  },
  {
    icon: LayoutDashboard,
    title: "لوحة تحكم واضحة وسريعة",
    description:
      "تابع الطلبات ونظّم بيانات متجرك واعرف اللي بيحصل لحظة بلحظة من مكان واحد بدون لخبطة.",
  },
  {
    icon: CreditCard,
    title: "وسائل دفع متنوعة",
    description:
      "وفّر لعملائك طرق الدفع المناسبة للسوق المصري مثل فودافون كاش وإنستا باي وفوري والدفع عند الاستلام.",
  },
  {
    icon: Smartphone,
    title: "جاهز للموبايل بالكامل",
    description:
      "متجرك يظهر بشكل ممتاز على الموبايل والتابلت لأن أغلب العملاء بيتصفحوا ويشتروا مباشرة من الهاتف.",
  },
];

// HOW IT WORKS
export const HOW_IT_WORKS_CONTENT = {
  badge: "طريقة العمل",
  title: {
    before: "ابدأ البيع في",
    highlight: "3 خطوات",
    after: "بسيطة",
  },
  description:
    "من أول إنشاء المتجر لحد استقبال الطلبات، كل حاجة ماشية بشكل واضح وسهل عشان تبدأ بسرعة ومن غير تعقيد.",
};

export const HOW_IT_WORKS_STEPS = [
  {
    id: "01",
    icon: Store,
    title: "أنشئ متجرك",
    description:
      "سجل وابدأ إعداد متجرك في دقائق، ثم أضف المنتجات والصور والأسعار بشكل سهل ومنظم.",
  },
  {
    id: "02",
    icon: LinkIcon,
    title: "شارك رابط متجرك",
    description:
      "احصل على رابط مخصص لمتجرك تقدر تبعته للعملاء أو تنشره على واتساب وفيسبوك وإنستجرام بسهولة.",
  },
  {
    id: "03",
    icon: ShoppingCart,
    title: "استقبل الطلبات",
    description:
      "العملاء يطلبوا مباشرة من المتجر وتوصلك الطلبات بشكل واضح وجاهز للمتابعة والتأكيد.",
  },
];

// CTA
export const CTA_CONTENT = {
  badge: "ابدأ الآن",
  title: {
    before: "ابدأ متجرك الإلكتروني",
    highlight: "دلوقتي",
  },
  description:
    "أنشئ متجرك في دقائق، اعرض منتجاتك بشكل احترافي، وابدأ استقبال الطلبات من عملائك مباشرة بدون تعقيد أو خبرة تقنية.",
  primaryButton: {
    label: "ابدأ متجرك دلوقتي",
    href: "/register",
  },
  secondaryButton: {
    label: "شوف الأسعار",
    href: "#pricing",
  },
  note: "ابدأ بسرعة واطلق متجرك برابط جاهز تقدر تشاركه مع عملائك من أول يوم.",
};

// FAQ
export const FAQ_CONTENT = {
  badge: "الأسئلة الشائعة",
  title: {
    before: "كل اللي محتاج تعرفه قبل ما تبدأ",
    highlight: "متجرك",
  },
  description:
    "جمعنالك أهم الأسئلة اللي ممكن تدور في بالك قبل الاشتراك، عشان الصورة تبقى واضحة من أول خطوة.",
};

export const FAQ_ITEMS = [
  {
    id: "faq-1",
    question: "هل أحتاج خبرة تقنية عشان أستخدم المنصة؟",
    answer:
      "لا، المنصة مصممة لتكون سهلة جدًا في الاستخدام. تقدر تضيف منتجاتك، تدير متجرك، وتستقبل الطلبات بدون أي خبرة برمجية أو إعدادات معقدة.",
  },
  {
    id: "faq-2",
    question: "هل أقدر أشارك متجري على فيسبوك وواتساب وإنستجرام؟",
    answer:
      "أيوه، هيكون عندك رابط خاص بمتجرك تقدر تشاركه بسهولة مع العملاء على واتساب وفيسبوك وإنستجرام أو تضيفه في البايو والصفحات الخاصة بك.",
  },
  {
    id: "faq-3",
    question: "ما هي طرق الدفع المتاحة؟",
    answer:
      "المنصة تدعم وسائل دفع مناسبة للسوق المصري مثل فودافون كاش، أورنج كاش، اتصالات كاش، WE Pay، إنستا باي، فوري، التحويل البنكي، والدفع عند الاستلام حسب إعدادات متجرك.",
  },
  {
    id: "faq-4",
    question: "هل أقدر أضيف عدد كبير من المنتجات؟",
    answer:
      "أيوه، تقدر تضيف منتجاتك بسهولة وتعدل عليها في أي وقت من لوحة التحكم، بحيث تفضل دايمًا محدثة وجاهزة للعرض والبيع.",
  },
  {
    id: "faq-5",
    question: "هل المتجر بيشتغل على الموبايل؟",
    answer:
      "أيوه، المتجر متجاوب بالكامل وبيظهر بشكل ممتاز على الموبايل والتابلت والكمبيوتر، لأن أغلب العملاء بيتصفحوا ويشتروا من الهاتف.",
  },
  {
    id: "faq-6",
    question: "بكام الاشتراك؟",
    answer:
      "السعر الحالي لأول 50 متجر هو 300 جنيه شهريًا، وبعد كده هيكون السعر 499 جنيه شهريًا، فلو حابب تبدأ بدري دي فرصة مناسبة.",
  },
];
