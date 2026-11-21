/**
 * Lead scoring (pure, unit-tested). Every point comes from a named criterion
 * the admin and the rep can see on the lead, so a score is never a mystery.
 * The weights live in one list; making them configurable later means loading
 * this list from the DB instead of the constant.
 *
 * score = round(100 × earned / maxPossible)  →  0–100
 * band:  0–24 LOW · 25–49 MEDIUM · 50–74 HIGH · 75–100 HOT
 */
import type { LeadBusinessSize, LeadPriority, LeadStatus } from "@prisma/client";
import { normalizePhone, isEgyptianMobile } from "./normalize";

export type ScoreInput = {
  instagram: string | null;
  website: string | null;
  whatsapp: string | null;
  businessSize: LeadBusinessSize | null;
  status: LeadStatus;
  /** Any DEMO activity was logged. */
  hadDemo: boolean;
  /** Any call / WhatsApp / email marked "reached", or a meeting / demo. */
  responded: boolean;
};

export type ScoreCriterion = {
  key: string;
  label: string;
  points: number;
  met: (lead: ScoreInput) => boolean;
};

const INTERESTED_OR_LATER: LeadStatus[] = ["INTERESTED", "DEMO_SCHEDULED", "NEGOTIATION", "CONVERTED"];
const DEMO_OR_LATER: LeadStatus[] = ["DEMO_SCHEDULED", "NEGOTIATION", "CONVERTED"];

export const SCORE_CRITERIA: ScoreCriterion[] = [
  { key: "instagram", label: "عنده حساب إنستجرام", points: 10, met: (l) => !!l.instagram },
  { key: "website", label: "عنده موقع", points: 10, met: (l) => !!l.website },
  {
    key: "whatsapp",
    label: "رقم واتساب صحيح",
    points: 10,
    met: (l) => {
      const n = normalizePhone(l.whatsapp);
      return !!n && (isEgyptianMobile(n) || n.startsWith("+"));
    },
  },
  { key: "interested", label: "مهتم بكاشو", points: 20, met: (l) => INTERESTED_OR_LATER.includes(l.status) },
  { key: "demo", label: "اتحدد له ديمو", points: 20, met: (l) => l.hadDemo || DEMO_OR_LATER.includes(l.status) },
  { key: "established", label: "نشاط ثابت (مش لسه بادئ)", points: 15, met: (l) => l.businessSize === "MEDIUM" || l.businessSize === "LARGE" },
  { key: "responded", label: "رد على تواصل قبل كده", points: 10, met: (l) => l.responded },
];

const MAX_POINTS = SCORE_CRITERIA.reduce((s, c) => s + c.points, 0);

export type ScoreBreakdown = {
  score: number;
  band: LeadPriority;
  earned: number;
  max: number;
  criteria: { key: string; label: string; points: number; met: boolean }[];
};

export function bandForScore(score: number): LeadPriority {
  if (score >= 75) return "HOT";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

export function scoreLead(lead: ScoreInput): ScoreBreakdown {
  const criteria = SCORE_CRITERIA.map((c) => ({ key: c.key, label: c.label, points: c.points, met: c.met(lead) }));
  const earned = criteria.reduce((s, c) => s + (c.met ? c.points : 0), 0);
  const score = Math.round((100 * earned) / MAX_POINTS);
  return { score, band: bandForScore(score), earned, max: MAX_POINTS, criteria };
}

/** The priority to store: a human's pick wins; otherwise the score's band. */
export function effectivePriority(locked: boolean, current: LeadPriority, score: number): LeadPriority {
  return locked ? current : bandForScore(score);
}
