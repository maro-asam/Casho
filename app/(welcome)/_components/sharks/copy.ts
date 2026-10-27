"use client";

import { useLang } from "../../_i18n/LanguageContext";

// Copy for Casho Sharks. Honest by construction: no funding offer, no promise
// of selection, nothing published without consent. Short declarative lines.

const ar = {
  mark: "Casho Sharks",
  hero: {
    title1: "في مشاريع",
    title2: "تستاهل أكتر من فرصة.",
    subtitle: "برنامج بيختار مشاريع واعدة من تجار كاشو، ويساعدها تاخد خطوتها الجاية.",
    apply: "قدّم على Casho Sharks",
    meet: "قابل المشاريع المختارة",
    closed: "التقديم مقفول دلوقتي",
    closer1: "كل طلب بنبص عليه عن قرب.",
    closer2: "عشان نلاقي المشاريع الجاهزة لخطوتها الجاية.",
  },
  manifesto:
    "مش برنامج تمويل، ومش مسابقة. Casho\u00a0Sharks طريقتنا نقرّب من المشاريع اللي بتبني على كاشو، نفهم إيه اللي واقف قدامها، ونساعد باللي نقدر نقدّمه فعلًا: منصتنا، وفريقنا، وشركاء بنثق فيهم. ولما المشروع يكبر، نحكي حكايته. بموافقته.",
  meet: {
    eyebrow: "المشاريع المختارة",
    title: "قابل الـ Sharks.",
    subtitle: "مشاريع حقيقية بتبني على كاشو، وحكاياتها زي ما حصلت.",
    read: "اقرا الحكاية",
    watch: "فيديو",
    more: "حكايات تانية",
    prev: "السابق",
    next: "التالي",
    emptyTitle: "أول المشاريع المختارة هتتعلن هنا.",
    emptyBody: "بنراجع الطلبات دلوقتي. لما نختار وصاحب المشروع يوافق، حكايته هتنزل هنا.",
    emptyCta: "قدّم مشروعك",
  },
  tracks: {
    eyebrow: "المسارات",
    title1: "تلات مسارات.",
    title2: "وكل واحد بوضوح.",
    open: "متاح",
    closed: "مقفول حاليًا",
    future: "مش متاح دلوقتي",
    mayInclude: "ممكن يشمل",
    benefits: "دعم تشغيلي من جوه كاشو نفسه: الاشتراك، والتجهيز، وتجربة الشراء.",
    growth: "توجيه للنمو بخبرة فريقنا والشركاء المتاحين، من غير وعود بخدمات مش موجودة.",
    investment:
      "كاشو مفيهاش ميزانية تمويل أو استثمار دلوقتي. ده مسار بنبنيه للمستقبل: نجهّز المشاريع إنها تتعرض على مستثمرين، ونعرّفها بمستثمرين أو شركاء مناسبين لما الفرص دي تتوفر.",
    investmentPoints: ["مفيش تقديم على تمويل.", "مفيش وعد باستثمار.", "أي تفعيل مستقبلي هيتعلن بشروطه بوضوح."],
    footnote: "كل مشروع بيتختار بياخد خطة متفق عليها بالظبط. مش كل المزايا لكل المشاريع.",
  },
  how: {
    eyebrow: "إزاي بيشتغل",
    title: "من الطلب للحكاية.",
    steps: [
      { title: "قدّم", body: "من لوحة تحكم متجرك في دقايق. قولنا بتبني إيه، وإيه اللي واقف قدامك." },
      { title: "مراجعة", body: "فريق كاشو بيقرا كل طلب بنفسه، وممكن يسألك أسئلة أو يطلب مكالمة." },
      { title: "اختيار", body: "المشاريع المناسبة بتتختار لمسار يناسبها. مش كل طلب بيتقبل." },
      { title: "نمو", body: "بنتفق على خطة واضحة: هنقدّم إيه، لإمتى، وحدوده إيه." },
      { title: "الحكاية", body: "لو حابب، نحكي رحلتك في قصة وفيديو قصير. بموافقتك وبس." },
    ],
  },
  plainly: {
    title: "بصراحة.",
    items: [
      { title: "مفيش تمويل مضمون.", body: "Casho Sharks مش بيقدّم فلوس أو استثمار دلوقتي. الدعم بالأدوات والخبرة والشركاء." },
      { title: "التقديم مجاني.", body: "ومش بيضمن الاختيار. بنراجع كل طلب بعناية وبنرد عليك." },
      { title: "حكايتك ملكك.", body: "مفيش نشر لاسمك أو صورتك أو أرقامك من غير موافقة صريحة ومنفصلة." },
      { title: "أرقام حقيقية بس.", body: "لو نشرنا نتايج، بتكون حقيقية وإنت موافق عليها. مفيش أرقام متألفة." },
    ],
  },
  cta: {
    title1: "فصلك الجاي",
    title2: "ممكن يبدأ من هنا.",
    subtitle: "بتبني على كاشو بالفعل؟ قولنا بتبني إيه، وعايز توصل لفين.",
    apply: "قدّم على Casho Sharks",
    eligibility: "التقديم متاح لأصحاب المتاجر على كاشو. التقديم مش بيضمن الاختيار أو الدعم.",
    closed: "التقديم مقفول دلوقتي. هنعلن هنا لما يفتح تاني.",
    notYet: "لسه مش على كاشو؟ ابدأ متجرك",
  },
  teaser: {
    body: "برنامج جديد بيختار مشاريع واعدة من تجار كاشو ويساعدها تكبر.",
    link: "اكتشف Casho Sharks",
  },
  story: {
    back: "Casho Sharks",
    intro: "البداية",
    challenge: "التحدي",
    whySelected: "ليه اخترناهم",
    supportProvided: "عملنا إيه سوا",
    outcomes: "لحد دلوقتي",
    play: "شغّل الفيديو",
    consent: "الحكاية دي اتنشرت بموافقة {name}.",
    ctaTitle1: "بتبني حاجة",
    ctaTitle2: "زي دي؟",
    ctaBody: "لو متجرك على كاشو، قدّم وقولنا إنت فين وعايز توصل لفين.",
    track: "المسار",
  },
};

type SharksCopy = typeof ar;

const en: SharksCopy = {
  mark: "Casho Sharks",
  hero: {
    title1: "Some businesses",
    title2: "deserve more than a chance.",
    subtitle: "A program that selects promising businesses from Casho's merchants and helps them take their next step.",
    apply: "Apply to Casho Sharks",
    meet: "Meet the selected businesses",
    closed: "Applications are closed right now",
    closer1: "Every application gets a closer look.",
    closer2: "So we can find the businesses ready for their next step.",
  },
  manifesto:
    "Not a funding program. Not a contest. Casho\u00a0Sharks is how we get close to the businesses building on Casho, understand what's in their way, and help with what we can genuinely offer: our platform, our team, and partners we trust. And when a business grows, we tell its story. With its permission.",
  meet: {
    eyebrow: "Selected businesses",
    title: "Meet the Sharks.",
    subtitle: "Real businesses building on Casho, and their stories as they happened.",
    read: "Read the story",
    watch: "Video",
    more: "More stories",
    prev: "Previous",
    next: "Next",
    emptyTitle: "The first selected businesses will be announced here.",
    emptyBody: "We're reviewing applications now. Once a business is selected and agrees, its story appears here.",
    emptyCta: "Apply with your business",
  },
  tracks: {
    eyebrow: "Tracks",
    title1: "Three tracks.",
    title2: "Each one, plainly.",
    open: "Open",
    closed: "Closed for now",
    future: "Not available now",
    mayInclude: "May include",
    benefits: "Operational support from inside Casho itself: your subscription, your setup, your shopping experience.",
    growth: "Growth guidance from our team and the partners available to us, with no promises of services that don't exist.",
    investment:
      "Casho has no funding or investment budget today. This is a pathway we're building for the future: preparing businesses to meet investors, and introducing them to suitable investors or partners when those opportunities exist.",
    investmentPoints: ["No funding applications.", "No promise of investment.", "Any future launch will be announced with its terms."],
    footnote: "Every selected business gets a specific, agreed plan. Not every benefit goes to every business.",
  },
  how: {
    eyebrow: "How it works",
    title: "From application to story.",
    steps: [
      { title: "Apply", body: "From your store dashboard in minutes. Tell us what you're building and what's in the way." },
      { title: "Review", body: "The Casho team reads every application and may ask questions or set up a call." },
      { title: "Select", body: "Businesses that fit are selected for a suitable track. Not every application is accepted." },
      { title: "Grow", body: "We agree on a clear plan: what we'll provide, for how long, and its limits." },
      { title: "Share the story", body: "If you'd like, we tell your journey in a story and a short video. Only with your consent." },
    ],
  },
  plainly: {
    title: "Plainly.",
    items: [
      { title: "No guaranteed funding.", body: "Casho Sharks doesn't offer cash or investment today. Support comes as tools, expertise and partners." },
      { title: "Applying is free.", body: "It doesn't guarantee selection. We review every application carefully and get back to you." },
      { title: "Your story is yours.", body: "Nothing about your name, image or numbers is published without separate, explicit consent." },
      { title: "Only real numbers.", body: "If we share results, they're real and approved by you. No invented metrics." },
    ],
  },
  cta: {
    title1: "Your next chapter",
    title2: "could start here.",
    subtitle: "Already building with Casho? Tell us what you're building and where you want to go.",
    apply: "Apply to Casho Sharks",
    eligibility: "Applications are open to Casho store owners. Applying doesn't guarantee selection or support.",
    closed: "Applications are closed right now. We'll announce it here when they reopen.",
    notYet: "Not on Casho yet? Start your store",
  },
  teaser: {
    body: "A new program that selects promising Casho merchants and helps them grow.",
    link: "Discover Casho Sharks",
  },
  story: {
    back: "Casho Sharks",
    intro: "The beginning",
    challenge: "The challenge",
    whySelected: "Why we chose them",
    supportProvided: "What we did together",
    outcomes: "So far",
    play: "Play video",
    consent: "Published with {name}'s consent.",
    ctaTitle1: "Building something",
    ctaTitle2: "like this?",
    ctaBody: "If your store is on Casho, apply and tell us where you are and where you want to go.",
    track: "Track",
  },
};

const sharksCopy = { ar, en };

export function useSharksCopy() {
  const { lang } = useLang();
  return sharksCopy[lang];
}
