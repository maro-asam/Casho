// Egyptian retail calendar. Lunar dates are approximate (marked `approx`).
export type Season = {
  id: string;
  name: string;
  /** First day of the peak (YYYY-MM-DD, Cairo). */
  date: string;
  /** Days the sale usually runs, ending on/after `date`. */
  days: number;
  approx?: boolean;
  tip: string;
};

export const SEASONS: Season[] = [
  { id: "11-11", name: "عروض ١١.١١", date: "2026-11-11", days: 1, tip: "يوم واحد بخصم كبير — جهّز الكود من بدري." },
  { id: "white-friday-26", name: "الجمعة البيضاء", date: "2026-11-27", days: 4, tip: "أكبر موسم شرا أونلاين في مصر. ابدأ قبلها بأسبوع." },
  { id: "new-year-27", name: "رأس السنة", date: "2027-01-01", days: 3, tip: "هدايا وتغليف — اعرض باقات." },
  { id: "ramadan-27", name: "رمضان", date: "2027-02-08", days: 30, approx: true, tip: "الزيارات بتعلى بعد الفطار — خلّي النافذة تظهر بالليل." },
  { id: "valentine-27", name: "عيد الحب", date: "2027-02-14", days: 2, tip: "هدايا جاهزة وتوصيل في نفس اليوم." },
  { id: "eid-fitr-27", name: "عيد الفطر", date: "2027-03-10", days: 3, approx: true, tip: "لبس العيد — الطلبات بتبدأ قبلها بأسبوعين." },
  { id: "mothers-27", name: "عيد الأم", date: "2027-03-21", days: 1, tip: "اعمل كولكشن هدايا تحت سعر معين." },
  { id: "eid-adha-27", name: "عيد الأضحى", date: "2027-05-16", days: 4, approx: true, tip: "موسم لبس وهدايا تاني بعد الفطر." },
  { id: "school-27", name: "الدخول المدرسي", date: "2027-09-20", days: 21, approx: true, tip: "شنط وأدوات ولبس مدارس." },
];

/** Seasons whose sale hasn't ended yet, within the next `horizonDays`. */
export function upcomingSeasons(now: Date, horizonDays = 150, limit = 3) {
  return SEASONS.map((s) => {
    const start = new Date(`${s.date}T00:00:00+02:00`);
    const end = new Date(start.getTime() + s.days * 86400_000);
    const daysLeft = Math.ceil((start.getTime() - now.getTime()) / 86400_000);
    return { ...s, start, end, daysLeft };
  })
    .filter((s) => s.end > now && s.daysLeft <= horizonDays)
    .slice(0, limit);
}
