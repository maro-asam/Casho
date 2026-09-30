export type Lang = "ar" | "en";

export const translations = {
  ar: {
    dir: "rtl" as const,
    nav: {
      home: "الرئيسية",
      features: "المميزات",
      why: "ليه كاشو",
      pricing: "الأسعار",
      faq: "الأسئلة",
      faqFull: "الأسئلة الشائعة",
      blog: "المدونة",
    },
    navbar: {
      myAccount: "حسابي",
      dashboard: "لوحة التحكم",
      viewStore: "عرض المتجر",
      logout: "تسجيل الخروج",
      login: "تسجيل دخول",
      startFree: "ابدأ مجانًا",
      openMenu: "فتح القائمة",
    },
    heroMain: {
      newTag: "كاشو",
      eyebrow: "متجر أونلاين + كاشير لمحلك في سيستم واحد",
      titleBefore: "بيع أونلاين وفي محلك",
      titleHighlight: "بمخزون واحد",
      titleAfter: "ولوحة تحكم واحدة",
      subtitle:
        "كاشو منصة مصرية بتجمع تجارتك كلها في مكان واحد: متجر إلكتروني على لينك باسمك، وكاشير (POS) لمحلك بالباركود والشيفتات والإيصالات. كل بيعة — أونلاين أو في المحل — بتتخصم من نفس المخزون وبتظهر في نفس التقارير لحظتها.",
      ctaPrimary: "ابدأ مجانًا",
      ctaSecondary: "شوف الباقات والأسعار",
      trust: ["المخزون متزامن لحظيًا", "كاشير بالباركود والإيصالات", "من غير بطاقة ائتمان"],
      mockup: {
        url: "mmc.casho.store",
        storeName: "MMC",
        greeting: "أهلًا بيك، يومك ماشي حلو",
        live: "مباشر",
        salesLabel: "مبيعات النهارده",
        salesTrend: "+٢٤٪ عن امبارح",
        onlineLabel: "أونلاين",
        posLabel: "المحل (POS)",
        channelSplit: "المبيعات حسب القناة",
        sharedStock: "مخزون مشترك",
        stockProduct: "فستان سهرة أسود",
        stockLeft: "{count} قطعة متاحة",
        synced: "متزامن",
        posSale: "بيعة من الكاشير",
        onlineSale: "طلب أونلاين جديد",
        stockUpdated: "المخزون اتحدث في المتجر والمحل",
        currency: "ج.م",
        ordersLabel: "الطلبات",
        conversionLabel: "معدل التحويل",
        chartLabel: "المبيعات — آخر ٧ أيام",
        liveOrders: "طلبات بتوصل دلوقتي",
        paid: "مدفوع",
        cod: "عند الاستلام",
        newOrder: "طلب جديد وصل!",
        justNow: "دلوقتي",
        paymentTitle: "تم استلام الدفع",
        themesTitle: "ثيمات احترافية",
        themesSub: "غيّر شكل متجرك بضغطة",
        orders: [
          { name: "سارة محمود", product: "فستان سهرة أسود", city: "القاهرة", amount: 1450, method: "فودافون كاش", paid: true, channel: "online" },
          { name: "مريم علي", product: "بلوزة حرير", city: "فرع مدينة نصر", amount: 680, method: "كاش", paid: true, channel: "pos" },
          { name: "نور أحمد", product: "شنطة جلد طبيعي", city: "الجيزة", amount: 2100, method: "بطاقة بنكية", paid: true, channel: "online" },
          { name: "هنا خالد", product: "فستان سهرة أسود", city: "فرع مدينة نصر", amount: 1450, method: "فيزا", paid: true, channel: "pos" },
          { name: "ياسمين حسن", product: "جاكيت جينز", city: "طنطا", amount: 1200, method: "الدفع عند الاستلام", paid: false, channel: "online" },
        ],
      },
    },
    hero: {
      badge: "+500 متجر نشط على كاشو",
      headline1: "سيبك من زحمة الشات",
      headline2: "وابدأ بيزنس حقيقي دلوقتي...",
      subtitle:
        "منصة تجارة إلكترونية مصرية بتخليك تبني متجرك الإلكتروني وتشغله بسهولة، من غير تعقيدات ولا مصاريف خفية. انضم لآلاف التجار اللي بيحققوا مبيعات يومية وبيكبروا البيزنس بتاعهم مع",
      subtitleSuffix: "في 3 دقايق بس ...",
      pills: ["تصميم فاخر", "طلبات لحظية", "تحليلات ذكية"],
      ctaPrimary: "ابدأ مجاناً دلوقتي",
      ctaSecondary: "شوف المميزات أكتر",
      socialProof: "تاجر بيثقوا في كاشو",
      cardRevenue: { today: "اليوم", label: "إجمالي المبيعات" },
      cardOrders: { badge: "طلب جديد" },
      cardAnalytics: { label: "الزيارات", period: "هذا الشهر" },
      activeCustomers: "٢٣ عميل أونلاين دلوقتي",
      liveOrders: [
        { product: "فستان ليلى الأسود", price: "٤٥٠", city: "القاهرة" },
        { product: "بلوزة حرير ناعمة", price: "٢٨٠", city: "الإسكندرية" },
        { product: "جاكيت جلد بيمي", price: "٨٩٠", city: "الجيزة" },
      ],
      dash: {
        title: "لوحة التحكم",
        revenueLabel: "إجمالي المبيعات",
        revenueValue: "٢٤٫٥ ألف",
        revenueTrend: "+١٨٪ هذا الشهر",
        ordersLabel: "الطلبات",
        ordersCount: "١٢٣",
        ordersNew: "١٢ جديد",
        productsLabel: "المنتجات",
        productsCount: "٤٨",
        chartLabel: "المبيعات — ٣٠ يوم",
        chartTrend: "↑ ١٨٪",
        recentOrders: "آخر الطلبات",
        paid: "مدفوع",
        newStatus: "جديد",
        delivered: "تسليم",
        notifs: [
          { title: "طلب جديد وصل!", sub: "+٤٥٠ ج.م • القاهرة" },
          { title: "تم الدفع بنجاح", sub: "فودافون كاش" },
          { title: "مخزون تحدّث", sub: "٤٨ قطعة متاحة" },
          { title: "عميل جديد انضم", sub: "سارة أحمد" },
        ] as { title: string; sub: string }[],
      },
      journey: {
        sectionLabel: "رحلة البيزنس",
        poweredBy: "مدعوم بكاشو",
        cards: [
          { title: "المنتج", status: "١٢ منتج متاح", meta: "المخزون: ٤٨ قطعة", price: "٤٥٠ ج.م" },
          { title: "السلة", status: "٣ عناصر", meta: "الإجمالي", price: "١٬٣٢٠ ج.م" },
          { title: "الطلب", status: "تم الإنشاء", meta: "العميل: أحمد م.", orderId: "#٢٠٤١" },
          { title: "الدفع", status: "تم الدفع", meta: "فودافون كاش", price: "١٬٣٢٠ ج.م" },
          { title: "الشحن", status: "قيد التوصيل", meta: "القاهرة — بكرة", step: 2 },
          { title: "الربح", status: "نمو مستمر", meta: "هذا الشهر", growth: "+١٨٪" },
        ],
        events: [
          "طلب جديد وصل!",
          "+٤٥٠ ج.م",
          "تم الدفع بنجاح",
          "شركة الشحن استلمت",
          "تم تحديث المخزون",
          "ربح جديد +١٢٠ ج.م",
          "عميل جديد انضم",
          "+٨٩٠ ج.م مبيعات",
        ],
      },
    },
    features: {
      badge: "المميزات",
      title: "كل اللي محتاجه عشان تبيع أونلاين",
      titleAccent: "من غير لخبطة ولا تعقيد",
      subtitle:
        "كاشو بيسهّل عليك عرض المنتجات، استقبال الطلبات، ومتابعة شغلك كله من مكان واحد.",
      orderCard: {
        subtitle: "إدارة الطلبات",
        title: "شوف الطلبات بشكل واضح",
        desc: "بدل اللخبطة بين الشات والمكالمات، كل طلب بيظهرلك ببياناته كاملة عشان تراجع وتتابع بسرعة.",
        newOrder: "طلب جديد",
        orderNum: "أوردر #1024",
        badge: "جديد",
        product1: { name: "تيشيرت أسود", qty: "الكمية: 2", price: "450 ج.م" },
        product2: { name: "شنطة بيج", qty: "الكمية: 1", price: "320 ج.م" },
        customer: "العميل",
        customerName: "أحمد محمود",
        payment: "الدفع",
        paymentMethod: "فودافون كاش",
      },
      analyticsCard: {
        title: "نظرة سريعة على شغلك",
        desc: "أرقام واضحة قدامك تخليك فاهم الدنيا ماشية إزاي بدون dashboard معقدة.",
        newOrders: "طلبات جديدة",
        products: "منتجات",
        paymentMethods: "طرق دفع",
      },
      items: [
        {
          title: "الطلبات بتوصلك جاهزة",
          description:
            "اسم العميل، رقمه، العنوان والطلب كامل… كله قدامك بشكل واضح ومنظم.",
        },
        {
          title: "الدفع بالطريقة اللي تناسبك",
          description:
            "فودافون كاش، إنستا باي، فوري أو الدفع عند الاستلام حسب شغلك.",
        },
        {
          title: "تابع شغلك بسهولة",
          description:
            "اعرف عدد الطلبات والمنتجات وحالة النشاط من غير تعقيد ولا زحمة.",
        },
        {
          title: "تابع حالة كل طلب",
          description:
            "من أول ما الطلب ييجي لحد ما يتسلم، كل خطوة واضحة قدامك من غير لخبطة.",
        },
      ],
    },
    faq: {
      badge: "الأسئلة الشائعة",
      title: "كل اللي ممكن تسأل عنه",
      titleAccent: "قبل ما تبدأ على كاشو",
      subtitle:
        "جمعنالك أهم الأسئلة اللي ممكن تيجي في بالك عشان تبقى الصورة واضحة من البداية.",
      items: [
        {
          question: "يعني إيه كاشو؟",
          answer:
            "كاشو منصة بتخليك تعمل متجرك أونلاين بسرعة، تعرض منتجاتك، وتستقبل الطلبات بشكل منظم من غير ما تدخل في تعقيدات كبيرة.",
        },
        {
          question: "هل العميل لازم يعمل حساب عشان يطلب؟",
          answer:
            "لا، العميل يقدر يطلب بسهولة من غير ما يعمل حساب، وده بيخلي عملية الشراء أسرع وأسهل.",
        },
        {
          question: "أقدر أضيف منتجات وأقسام بنفسي؟",
          answer:
            "أيوه، تقدر تضيف منتجاتك وأقسامك وتعدل عليهم بسهولة من لوحة التحكم.",
        },
        {
          question: "إيه طرق الدفع اللي أقدر أوفرها؟",
          answer:
            "تقدر توفر طرق دفع مناسبة للسوق المصري زي فودافون كاش، إنستا باي، فوري، وكمان الدفع عند الاستلام.",
        },
        {
          question: "أتابع الطلبات منين؟",
          answer:
            "من لوحة التحكم هتلاقي الطلبات وحالتها بشكل واضح، من أول ما العميل يطلب لحد ما الطلب يخلص.",
        },
        {
          question: "فيه كام باقة، وهي إيه؟",
          answer:
            "عندنا 3 باقات: سيلفر للبداية، جولد للمتاجر النامية، وبلاتينيوم لكل المميزات من غير حدود. تقدر تشوف الفرق بينهم وتترقّي في أي وقت من لوحة التحكم.",
        },
        {
          question: "هل كاشو مناسب لو أنا لسه ببدأ؟",
          answer:
            "أيوه، كاشو معمول أصلًا عشان يساعد أي حد يبدأ البيع أونلاين بشكل بسيط ومنظم من غير تكلفة كبيرة أو تعقيد.",
        },
      ],
    },
    pricing: {
      badge: "التسعير",
      title: "باقات تناسب",
      titleAccent: "كل مرحلة من متجرك",
      subtitle:
        "من أول متجرك لحد ما يكبر — اختار الباقة المناسبة دلوقتي وترقّي في أي وقت من غير تعقيد.",
      currency: "ج.م",
      startNow: "ابدأ تجربتك المجانية",
      monthly: "شهري",
      yearly: "سنوي",
      mostPopular: "الأكثر طلبًا",
      currentFeatures: "غير محدود",
      save: "وفّر",
      perMonthEquivalent: "يعني حوالي {amount} ج.م في الشهر",
      billedMonthly: "بيتجدد كل شهر",
      whatsIncluded: "اللي في الباقة",
      billingLabel: "دورة الدفع",
      footnote: "الأسعار شاملة الضريبة. تقدر تلغي أو توقف باقتك في أي وقت من لوحة التحكم.",
      trust: ["تجربة مجانية 3 أيام", "تقدر تلغي في أي وقت", "من غير بطاقة ائتمان دلوقتي"],
    },
    stats: {
      badge: "أداء حقيقي، مش وعود",
      title: "الأرقام اللي بتشتغل",
      titleAccent: "مش الأرقام اللي بنحبّ نقولها",
      subtitle:
        "من ثانية ما تفتح متجرك، كاشو بيبقى معاك خطوة بخطوة — وكل رقم هنا طالع من تجار بيبيعوا فعليًا دلوقتي على المنصة.",
      items: [
        {
          value: "24/7",
          title: "دعم فوري",
          description:
            "فريق كاشو على طول جنبك، من غير ما تستنى ساعات علشان حد يرد عليك",
        },
        {
          value: "55K+",
          title: "طلب اتنفّذ بنجاح",
          description:
            "تجار كاشو بيستقبلوا ويشحنوا آلاف الطلبات كل شهر من غير أي تعقيد",
        },
        {
          value: "5+",
          title: "طرق دفع جاهزة",
          description:
            "فودافون كاش، إنستاباي، تحويل بنكي، الدفع عند الاستلام، وكاشير أونلاين — شغالين من أول يوم",
        },
        {
          value: "3",
          title: "دقايق لإطلاق متجرك",
          description:
            "من التسجيل لحد أول لينك تبعته لعملائك، من غير خبرة تقنية ولا تعقيد",
        },
      ],
    },
    beforeAfter: {
      badge: "التحول اللي بيحصل مع كاشو",
      title: "من رسايل متلخبطة",
      titleAccent: "لطلبات منظمة في ثواني",
      subtitle:
        "نفس التاجر، نفس المنتجات — بس تجربة مختلفة تمامًا. كاشو بياخدك من الفوضى اليومية لنظام بيشتغل لوحده.",
      before: {
        label: "قبل كاشو",
        tag: "شات متلخبط",
        delayHint: "اتأخر الرد 20 دقيقة",
        chat: [
          "عايز أطلب التيشيرت الأسود، متوفر مقاس L؟",
          "لحظة هدور على المخزون 🙏",
          "لسه؟ وبرضو محتاج أعرف السعر والشحن",
        ],
        points: [
          {
            title: "طلبات ضايعة بين الشات",
            description:
              "كل أوردر بيجيلك رسالة لوحده، وبتفضل تدور على تفاصيله وسط باقي الرسايل",
          },
          {
            title: "وقت بيروح في المتابعة",
            description:
              "رد، تأكيد، سؤال عن العنوان، سؤال عن الدفع — وكل ده يدوي ومرهق",
          },
          {
            title: "تجربة مالهاش شكل ثابت",
            description:
              "مفيش مكان واحد يشوف فيه العميل منتجاتك بشكل مرتب ومريح",
          },
        ],
      },
      after: {
        label: "بعد كاشو",
        tag: "لوحة تحكم واحدة",
        live: "طلب جديد",
        order: {
          title: "طلب جديد #1024",
          product: "تيشيرت أسود — مقاس L",
          qty: "الكمية: 2",
          price: "450 ج.م",
          customerLabel: "العميل",
          customerName: "أحمد محمود",
          paymentLabel: "طريقة الدفع",
          paymentMethod: "فودافون كاش",
          paidTag: "متأكد الدفع",
        },
        points: [
          {
            title: "كل الطلبات في مكان واحد",
            description:
              "بيانات العميل، المنتج، والدفع بتوصلك جاهزة ومرتبة من غير ما تسأل",
          },
          {
            title: "متابعة في ثواني مش ساعات",
            description:
              "تشوف كل طلب جديد وتتصرف فيه فورًا من لوحة تحكم واضحة",
          },
          {
            title: "متجر برابط واحد بس",
            description:
              "تشارك منتجاتك على واتساب والسوشيال ميديا بلينك واحد أنيق",
          },
        ],
      },
    },
    cta: {
      badge: "عرض الإطلاق شغال الآن",
      title: "ابدأ متجرك النهارده",
      titleAccent: "قبل ما سعر البداية يخلص",
      subtitle:
        "كاشو بيساعدك تعرض منتجاتك، تستقبل طلباتك، وتدير شغلك بشكل منظم من غير تعقيد. ابدأ دلوقتي بسعر الإطلاق قبل ما الأماكن المتاحة تخلص.",
      ctaPrimary: "ابدأ دلوقتي",
      ctaSecondary: "شوف الأسعار",
      checks: ["تسجيل سريع", "إعداد بسيط", "مناسب للتجار في مصر"],
      offerCard: {
        remaining: "متبقي من عرض البداية",
        merchantsLeft: "تاجر فقط",
        specialPrice: "سعر خاص",
        bookingRate: "نسبة الحجز",
        note: "بعد انتهاء الأماكن المتاحة، السعر هيرجع للخطة الأساسية.",
        tagline:
          "مناسب لو أنت بتبيع من إنستجرام، واتساب، أو صفحات السوشيال وعايز طريقة أرتب وأسهل لاستقبال الطلبات.",
      },
    },
    payments: {
      badge: "وسائل الدفع",
      title: "ادفع بالطريقة اللي تناسب عميلك",
      subtitle:
        "وفر في متجرك وسائل دفع عالمية، مصرية، وسعودية — مع دعم بيانات التحويل اليدوي لكل وسيلة بشكل واضح وسهل.",
      methodsCount: "وسائل دفع",
      miniFeatures: [
        "لوجوهات واضحة",
        "تقسيم حسب السوق",
        "تحويلات يدوية",
        "جاهز للـ Checkout",
      ],
    },
    footer: {
      tagline: "بيع أونلاين بشكل أبسط",
      description:
        "كاشو بيساعدك تعمل متجرك أونلاين، تعرض منتجاتك، وتستقبل طلباتك بشكل سهل ومنظم من غير تعقيد.",
      sections: {
        product: "المنتج",
        company: "الشركة",
        legal: "القانوني",
        contact: "تواصل معانا",
      },
      links: {
        product: [
          { name: "المميزات", href: "#features" },
          { name: "الأسعار", href: "#pricing" },
          { name: "الأسئلة الشائعة", href: "#faq" },
        ],
        company: [
          { name: "عن كاشو", href: "#" },
          { name: "ابدأ دلوقتي", href: "/signup" },
          { name: "تسجيل الدخول", href: "/login" },
        ],
        legal: [
          { name: "سياسة الخصوصية", href: "/privacy-policy" },
          { name: "سياسة الاسترداد", href: "/refund-policy" },
          { name: "الشروط والأحكام", href: "/terms" },
        ],
      },
      address: "58 شارع الحجاز، برج أمون، مصر الجديدة، القاهرة",
      copyright: "© 2026 كاشو. كل الحقوق محفوظة.",
      madeWith: "مصنوع بحب للتجار في مصر 🇪🇬",
    },
  },

  en: {
    dir: "ltr" as const,
    nav: {
      home: "Home",
      features: "Features",
      why: "Why Casho",
      pricing: "Pricing",
      faq: "FAQ",
      faqFull: "FAQ",
      blog: "Blog",
    },
    navbar: {
      myAccount: "My Account",
      dashboard: "Dashboard",
      viewStore: "View Store",
      logout: "Sign Out",
      login: "Sign In",
      startFree: "Start Free",
      openMenu: "Open menu",
    },
    heroMain: {
      newTag: "New",
      eyebrow: "Online store + in-store POS, one system",
      titleBefore: "Sell online and in your shop",
      titleHighlight: "from one inventory",
      titleAfter: "and one dashboard",
      subtitle:
        "Casho is an Egyptian commerce platform that brings your whole business together: an online store on your own link, and a point of sale for your shop with barcodes, shifts and receipts. Every sale — online or at the counter — comes out of the same stock and shows up in the same reports instantly.",
      ctaPrimary: "Start free",
      ctaSecondary: "See plans & pricing",
      trust: ["Real-time stock sync", "Barcode POS & receipts", "No credit card"],
      mockup: {
        url: "mmc.casho.store",
        storeName: "MMC",
        greeting: "Welcome back, have a great day",
        live: "Live",
        salesLabel: "Today's sales",
        salesTrend: "+24% vs yesterday",
        onlineLabel: "Online",
        posLabel: "Shop (POS)",
        channelSplit: "Sales by channel",
        sharedStock: "Shared stock",
        stockProduct: "Black evening dress",
        stockLeft: "{count} in stock",
        synced: "Synced",
        posSale: "Sale at the counter",
        onlineSale: "New online order",
        stockUpdated: "Stock updated online & in-store",
        currency: "EGP",
        ordersLabel: "Orders",
        conversionLabel: "Conversion",
        chartLabel: "Sales — last 7 days",
        liveOrders: "Orders coming in",
        paid: "Paid",
        cod: "Cash on delivery",
        newOrder: "New order!",
        justNow: "just now",
        paymentTitle: "Payment received",
        themesTitle: "pro themes",
        themesSub: "Restyle your store in a click",
        orders: [
          { name: "Sara Mahmoud", product: "Black evening dress", city: "Cairo", amount: 1450, method: "Vodafone Cash", paid: true, channel: "online" },
          { name: "Mariam Ali", product: "Silk blouse", city: "Nasr City branch", amount: 680, method: "Cash", paid: true, channel: "pos" },
          { name: "Nour Ahmed", product: "Leather handbag", city: "Giza", amount: 2100, method: "Card", paid: true, channel: "online" },
          { name: "Hana Khaled", product: "Black evening dress", city: "Nasr City branch", amount: 1450, method: "Visa", paid: true, channel: "pos" },
          { name: "Yasmin Hassan", product: "Denim jacket", city: "Tanta", amount: 1200, method: "Cash on delivery", paid: false, channel: "online" },
        ],
      },
    },
    hero: {
      badge: "+500 active stores on Casho",
      headline1: "Stop juggling chat messages",
      headline2: "Start a real business today...",
      subtitle:
        "An Egyptian e-commerce platform that lets you build and run your online store with ease — no hidden costs, no complexity. Join thousands of merchants making daily sales with",
      subtitleSuffix: "in just 3 minutes...",
      pills: ["Premium Design", "Instant Orders", "Smart Analytics"],
      ctaPrimary: "Start Free Now",
      ctaSecondary: "See Features",
      socialProof: "merchants trust Casho",
      cardRevenue: { today: "Today", label: "Total Sales" },
      cardOrders: { badge: "New Order" },
      cardAnalytics: { label: "Visits", period: "This Month" },
      activeCustomers: "23 customers online now",
      liveOrders: [
        { product: "Layla Black Dress", price: "450", city: "Cairo" },
        { product: "Soft Silk Blouse", price: "280", city: "Alexandria" },
        { product: "Leather Jacket", price: "890", city: "Giza" },
      ],
      dash: {
        title: "Dashboard",
        revenueLabel: "Total Revenue",
        revenueValue: "24.5K",
        revenueTrend: "+18% this month",
        ordersLabel: "Orders",
        ordersCount: "123",
        ordersNew: "12 new",
        productsLabel: "Products",
        productsCount: "48",
        chartLabel: "Revenue — 30 days",
        chartTrend: "↑ 18%",
        recentOrders: "Recent Orders",
        paid: "Paid",
        newStatus: "New",
        delivered: "Delivered",
        notifs: [
          { title: "New order arrived!", sub: "+450 EGP • Cairo" },
          { title: "Payment confirmed", sub: "Vodafone Cash" },
          { title: "Stock updated", sub: "48 units available" },
          { title: "New customer joined", sub: "Sara Ahmed" },
        ] as { title: string; sub: string }[],
      },
      journey: {
        sectionLabel: "Business Journey",
        poweredBy: "Powered by Casho",
        cards: [
          { title: "Product", status: "12 products live", meta: "Stock: 48 units", price: "450 EGP" },
          { title: "Cart", status: "3 items", meta: "Total", price: "1,320 EGP" },
          { title: "Order", status: "Created", meta: "Customer: Ahmed M.", orderId: "#2041" },
          { title: "Payment", status: "Paid", meta: "Vodafone Cash", price: "1,320 EGP" },
          { title: "Shipping", status: "In transit", meta: "Cairo — tomorrow", step: 2 },
          { title: "Profit", status: "Growing", meta: "This month", growth: "+18%" },
        ],
        events: [
          "New order arrived!",
          "+450 EGP",
          "Payment confirmed",
          "Courier picked up",
          "Inventory updated",
          "New profit +120 EGP",
          "New customer joined",
          "+890 EGP in sales",
        ],
      },
    },
    features: {
      badge: "Features",
      title: "Everything you need to sell online",
      titleAccent: "No hassle, no complexity",
      subtitle:
        "Casho makes it easy to list products, receive orders, and manage your business all in one place.",
      orderCard: {
        subtitle: "Order Management",
        title: "See your orders clearly",
        desc: "No more chasing messages. Every order shows up with full details so you can review and follow up fast.",
        newOrder: "New Order",
        orderNum: "Order #1024",
        badge: "New",
        product1: { name: "Black T-Shirt", qty: "Qty: 2", price: "450 EGP" },
        product2: { name: "Beige Bag", qty: "Qty: 1", price: "320 EGP" },
        customer: "Customer",
        customerName: "Ahmed Mahmoud",
        payment: "Payment",
        paymentMethod: "Vodafone Cash",
      },
      analyticsCard: {
        title: "A quick look at your business",
        desc: "Clear numbers at a glance — no complicated dashboards needed.",
        newOrders: "New Orders",
        products: "Products",
        paymentMethods: "Payment Methods",
      },
      items: [
        {
          title: "Orders arrive ready",
          description:
            "Customer name, phone, address, and full order — all organized and clear.",
        },
        {
          title: "Payment your way",
          description:
            "Vodafone Cash, InstaPay, Fawry, or cash on delivery — whatever works for you.",
        },
        {
          title: "Track your business easily",
          description:
            "Know your order count, products, and activity status without complexity.",
        },
        {
          title: "Follow every order",
          description:
            "From the moment an order comes in to delivery — every step is clear and organized.",
        },
      ],
    },
    faq: {
      badge: "FAQ",
      title: "Everything you might ask",
      titleAccent: "before starting on Casho",
      subtitle:
        "We've collected the most common questions so you have a clear picture from day one.",
      items: [
        {
          question: "What is Casho?",
          answer:
            "Casho is a platform that lets you launch your online store quickly, list your products, and receive orders in an organized way — without complicated setup.",
        },
        {
          question: "Does a customer need an account to order?",
          answer:
            "No, customers can order easily without creating an account, making the purchase process faster and smoother.",
        },
        {
          question: "Can I add products and categories myself?",
          answer:
            "Yes, you can add and edit your products and categories anytime from the dashboard.",
        },
        {
          question: "What payment methods can I offer?",
          answer:
            "You can offer payment methods suited to the Egyptian market like Vodafone Cash, InstaPay, Fawry, and cash on delivery.",
        },
        {
          question: "Where do I track orders?",
          answer:
            "From the dashboard you can see all orders and their status clearly — from the moment a customer orders to completion.",
        },
        {
          question: "How many plans are there, and what's the difference?",
          answer:
            "We have 3 plans: Silver to get started, Gold for growing stores, and Platinum for every feature with no limits. Compare them anytime and upgrade whenever you're ready, right from the dashboard.",
        },
        {
          question: "Is Casho good for beginners?",
          answer:
            "Absolutely. Casho is built to help anyone start selling online simply and organized without high costs or technical complexity.",
        },
      ],
    },
    pricing: {
      badge: "Pricing",
      title: "Plans for",
      titleAccent: "every stage of your store",
      subtitle:
        "Start with what you need today, and upgrade anytime as your store grows — no complexity, no surprises.",
      currency: "EGP",
      startNow: "Start your free trial",
      monthly: "Monthly",
      yearly: "Yearly",
      mostPopular: "Most popular",
      currentFeatures: "Unlimited",
      save: "Save",
      perMonthEquivalent: "About {amount} EGP per month",
      billedMonthly: "Renews every month",
      whatsIncluded: "What's included",
      billingLabel: "Billing cycle",
      footnote: "Prices include tax. Cancel or pause your plan anytime from the dashboard.",
      trust: ["3-day free trial", "Cancel anytime", "No credit card required now"],
    },
    stats: {
      badge: "Real performance, not promises",
      title: "Numbers that actually work",
      titleAccent: "not just numbers we like to say",
      subtitle:
        "From the second your store goes live, Casho is with you every step — every number here comes from merchants actually selling on the platform right now.",
      items: [
        {
          value: "24/7",
          title: "Instant Support",
          description:
            "The Casho team is always a message away — no waiting hours for a reply",
        },
        {
          value: "55K+",
          title: "Orders Fulfilled",
          description:
            "Casho merchants receive and ship thousands of orders every month, hassle-free",
        },
        {
          value: "5+",
          title: "Payment Methods",
          description:
            "Vodafone Cash, InstaPay, bank transfer, cash on delivery, and online checkout — live from day one",
        },
        {
          value: "3",
          title: "Minutes to Launch",
          description:
            "From sign-up to your first shareable link, no technical experience required",
        },
      ],
    },
    beforeAfter: {
      badge: "The shift that happens with Casho",
      title: "From scattered messages",
      titleAccent: "to organized orders in seconds",
      subtitle:
        "Same merchant, same products — a completely different experience. Casho takes you from daily chaos to a system that runs itself.",
      before: {
        label: "Before Casho",
        tag: "Messy chat",
        delayHint: "Reply took 20 minutes",
        chat: [
          "Hey, is the black t-shirt available in L?",
          "One sec, let me check stock 🙏",
          "Still there? Also need the price and shipping",
        ],
        points: [
          {
            title: "Orders lost in chat",
            description:
              "Every order lands as a separate message, and you're stuck digging for details in the thread",
          },
          {
            title: "Time drained on follow-ups",
            description:
              "Replies, confirmations, address, payment — all manual, all exhausting",
          },
          {
            title: "No consistent experience",
            description:
              "No single place for customers to browse your products in an organized way",
          },
        ],
      },
      after: {
        label: "After Casho",
        tag: "One dashboard",
        live: "New order",
        order: {
          title: "New Order #1024",
          product: "Black T-Shirt — Size L",
          qty: "Qty: 2",
          price: "450 EGP",
          customerLabel: "Customer",
          customerName: "Ahmed Mahmoud",
          paymentLabel: "Payment method",
          paymentMethod: "Vodafone Cash",
          paidTag: "Payment confirmed",
        },
        points: [
          {
            title: "Every order in one place",
            description:
              "Customer, product, and payment details arrive ready and organized — no asking",
          },
          {
            title: "Follow-up in seconds, not hours",
            description:
              "See every new order and act on it instantly from a clear dashboard",
          },
          {
            title: "One link, one store",
            description:
              "Share your products across WhatsApp and social with a single clean link",
          },
        ],
      },
    },
    cta: {
      badge: "Launch offer active now",
      title: "Start your store today",
      titleAccent: "before the launch price runs out",
      subtitle:
        "Casho helps you display your products, receive orders, and manage your business in an organized way — no complexity. Start now at the launch price before spots run out.",
      ctaPrimary: "Start Now",
      ctaSecondary: "See Pricing",
      checks: ["Quick registration", "Simple setup", "Built for Egyptian merchants"],
      offerCard: {
        remaining: "Remaining from the launch offer",
        merchantsLeft: "merchants only",
        specialPrice: "Special Price",
        bookingRate: "Booking rate",
        note: "Once all spots are taken, the price reverts to the standard plan.",
        tagline:
          "Perfect if you're selling on Instagram, WhatsApp, or social pages and want an easier, more organized way to receive orders.",
      },
    },
    payments: {
      badge: "Payment Methods",
      title: "Pay the way that suits your customer",
      subtitle:
        "Offer global, Egyptian, and Saudi payment methods in your store — with clear manual transfer support for each method.",
      methodsCount: "payment methods",
      miniFeatures: [
        "Clear logos",
        "Split by market",
        "Manual transfers",
        "Checkout ready",
      ],
    },
    footer: {
      tagline: "Sell online, simplified",
      description:
        "Casho helps you create your online store, display your products, and receive orders easily and organized — no complexity.",
      sections: {
        product: "Product",
        company: "Company",
        legal: "Legal",
        contact: "Contact Us",
      },
      links: {
        product: [
          { name: "Features", href: "#features" },
          { name: "Pricing", href: "#pricing" },
          { name: "FAQ", href: "#faq" },
        ],
        company: [
          { name: "About Casho", href: "#" },
          { name: "Get Started", href: "/signup" },
          { name: "Sign In", href: "/login" },
        ],
        legal: [
          { name: "Privacy Policy", href: "/privacy-policy" },
          { name: "Refund Policy", href: "/refund-policy" },
          { name: "Terms & Conditions", href: "/terms" },
        ],
      },
      address: "58 Hegaz St., Amoun Tower, Heliopolis, Cairo",
      copyright: "© 2026 Casho. All rights reserved.",
      madeWith: "Made with love for merchants in Egypt 🇪🇬",
    },
  },
};

export type Translations = (typeof translations)[Lang];
