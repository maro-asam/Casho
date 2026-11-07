/**
 * Pure helpers behind the rep's overview page — no DB access, unit-tested in
 * insights.test.ts. Months are calendar months in Africa/Cairo, like cohorts.
 */
import { cairoMonthStart, cohortMonthOf, tierForPosition, type CommissionRuleSet, type SalesTier } from "./rules";

// ─── Level progress ─────────────────────────────────────────────────────────

export type LevelProgress = {
  /** Tier and rate the rep's next acquired customer gets. */
  next: { tier: SalesTier; rateBps: number };
  /** The higher rate still to unlock (null at the top tier), and how many more eligible customers it takes. */
  unlock: { tier: SalesTier; rateBps: number; remaining: number } | null;
  /** 0..1 through the current band toward `unlock`; 1 at the top tier. */
  progress: number;
};

/**
 * Where the rep stands on the tier ladder. Tiers are marginal by position, so
 * with `n` eligible customers the next one is position n + 1; the next rate
 * unlocks once n reaches the band's last position.
 */
export function levelProgress(eligibleCount: number, rule: CommissionRuleSet): LevelProgress {
  const n = Math.max(0, Math.floor(eligibleCount));
  const next = tierForPosition(n + 1, rule);

  if (next.tier === "STARTER") {
    const higher = tierForPosition(rule.starterMaxPosition + 1, rule);
    return {
      next,
      unlock: { ...higher, remaining: rule.starterMaxPosition - n },
      progress: n / rule.starterMaxPosition,
    };
  }
  if (next.tier === "GROWTH") {
    const band = rule.growthMaxPosition - rule.starterMaxPosition;
    const higher = tierForPosition(rule.growthMaxPosition + 1, rule);
    return {
      next,
      unlock: { ...higher, remaining: rule.growthMaxPosition - n },
      progress: (n - rule.starterMaxPosition) / band,
    };
  }
  return { next, unlock: null, progress: 1 };
}

// ─── Monthly buckets ────────────────────────────────────────────────────────

const HALF_DAY = 12 * 3_600_000;

/** The last `count` Cairo months as "YYYY-MM", oldest first, ending with the month of `now`. */
export function lastMonths(now: Date, count: number): string[] {
  const [y, m] = cohortMonthOf(now).split("-").map(Number);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    // Noon on the 1st keeps DST shifts from tipping into the previous month.
    months.push(cohortMonthOf(new Date(cairoMonthStart(y, m - i).getTime() + HALF_DAY)));
  }
  return months;
}

/** First instant of a "YYYY-MM" month in Cairo. */
export function monthStart(month: string): Date {
  const [y, m] = month.split("-").map(Number);
  return cairoMonthStart(y, m);
}

/** Sums `valueOf` (default: a count) per month; items outside `months` or without a date are skipped. */
export function bucketByMonth<T>(
  months: string[],
  items: T[],
  dateOf: (item: T) => Date | null,
  valueOf: (item: T) => number = () => 1,
): number[] {
  const index = new Map(months.map((month, i) => [month, i]));
  const totals = months.map(() => 0);
  for (const item of items) {
    const date = dateOf(item);
    if (!date) continue;
    const i = index.get(cohortMonthOf(date));
    if (i !== undefined) totals[i] += valueOf(item);
  }
  return totals;
}

// ─── Follow-ups ─────────────────────────────────────────────────────────────

/**
 * Order for "signed up, hasn't paid yet": trials still running come first,
 * ending soonest first (the call that matters today); then everyone else,
 * newest signup first.
 */
export function sortFollowUps<T extends { signedUpAt: Date; trialEndDate: Date | null }>(rows: T[], now = new Date()): T[] {
  const running = (r: T) => r.trialEndDate !== null && r.trialEndDate.getTime() > now.getTime();
  return [...rows].sort((a, b) => {
    const ra = running(a);
    const rb = running(b);
    if (ra !== rb) return ra ? -1 : 1;
    if (ra && rb) return a.trialEndDate!.getTime() - b.trialEndDate!.getTime();
    return b.signedUpAt.getTime() - a.signedUpAt.getTime();
  });
}

// ─── Greeting & daily line ──────────────────────────────────────────────────

const TIME_ZONE = "Africa/Cairo";
const hourFormat = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" });
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

export function salesGreeting(now = new Date()) {
  const hour = Number(hourFormat.format(now));
  if (hour < 12) return "صباح الخير";
  if (hour < 17) return "نهارك سعيد";
  return "مساء الخير";
}

// One line per day, the same for the whole team (picked by Cairo date).
const QUOTES = [
  "ابدأ يومك بالتجار اللي تجربتهم قربت تخلص — دول أقرب بيعة ليك.",
  "المتابعة هي اللي بتقفل البيعة، مش أول مكالمة.",
  "اسمع مشكلة التاجر الأول، وبعدين اعرض الحل.",
  "التاجر اللي جرّب ومدفعش محتاج منك مكالمة، مش رسالة.",
  "رابطك هو محلك — شاركه في كل مكان بتروحه.",
  "عميل راضي بيجيبلك تلاتة من صحابه.",
  "الـ«لأ» النهارده ممكن تبقى «آه» الشهر الجاي.",
  "اعرف كاشو كويس — الثقة بتبان في صوتك.",
  "عشر محادثات كل يوم بتعمل شهر مختلف.",
  "خلّي التاجر يشوف متجره شغال قدامه — الصورة بتقنع أكتر من الكلام.",
  "اسأل أكتر ما تتكلم.",
  "كل عميل مؤهل بيقرّبك من النسبة الأعلى.",
  "التاجر مش بيشتري برنامج، بيشتري مبيعات أكتر — كلّمه عنها.",
  "رد سريع على سؤال التاجر بيسبق أي منافس.",
];

export function salesQuote(now = new Date()) {
  const dayNumber = Math.floor(Date.parse(dayKey.format(now)) / 86_400_000);
  return QUOTES[dayNumber % QUOTES.length];
}
