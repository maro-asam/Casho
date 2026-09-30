const TIME_ZONE = "Africa/Cairo";

// One line per day, same for everyone that day (picked by Cairo date).
const QUOTES = [
  "كل طلب صغير النهارده هو خطوة في براند كبير بكرة.",
  "العميل اللي بيرجع تاني أغلى من عشرة جداد — اهتم بيه.",
  "صورة منتج حلوة بتبيع أكتر من ألف كلمة.",
  "مش لازم تبقى مثالي عشان تبدأ، لازم تبدأ عشان تبقى أحسن.",
  "رد سريع على العميل = ثقة، والثقة = بيع.",
  "المخزون المظبوط بيوفر عليك طلبات ملغية وعملاء زعلانين.",
  "كل يوم بتنزل فيه منتج جديد هو فرصة جديدة للبيع.",
  "التاجر الشاطر بيقيس أرقامه، مش بيخمّنها.",
  "عرض واحد مدروس أحسن من عشر خصومات عشوائية.",
  "الشحن في معاده بيخلي العميل يحكي عنك لصحابه.",
  "المحل والأونلاين إيد واحدة — خلّي الاتنين يكبّروا بعض.",
  "النهارده يوم كويس تشارك فيه لينك متجرك مع ناس جديدة.",
  "كل رفض بيقرّبك من العميل الصح.",
  "وصف المنتج الواضح بيقلل الأسئلة وبيزود الطلبات.",
  "البيزنس الكبير بيتبني بعادات صغيرة كل يوم.",
  "اسأل عملائك عن رأيهم — هيدوك أفكار ببلاش.",
  "متقارنش بدايتك بنص طريق حد تاني.",
  "كود خصم لعميل قديم ممكن يرجّعه يشتري تاني.",
  "كل زيارة لمتجرك هي فرصة، خلّي أول انطباع يستاهل.",
  "الاستمرار بيغلب الموهبة لما الموهبة متستمرش.",
  "ركّز على المنتج اللي بيبيع، وطوّر اللي مش بيبيع.",
];

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const hourFormat = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" });

export function getDailyQuote(now = new Date()) {
  const dayNumber = Math.floor(Date.parse(dayKey.format(now)) / 86_400_000);
  return QUOTES[dayNumber % QUOTES.length];
}

export function getGreeting(now = new Date()) {
  const hour = Number(hourFormat.format(now));
  if (hour < 12) return "صباح الخير";
  if (hour < 17) return "نهارك سعيد";
  return "مساء الخير";
}
