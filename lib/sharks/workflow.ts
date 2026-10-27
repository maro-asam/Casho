import type { SharksApplicationStatus, SharksStoryStatus, SharksTrack } from "@prisma/client";
import { RUBRIC, type RubricKey } from "./catalog";

// Pure rules for the Casho Sharks workflow — no DB, unit-tested. Actions call
// these before writing so the UI can't skip a step by posting directly.

/* ── Program ─────────────────────────────────────────────────────────────── */

export type ProgramSettings = { applicationsOpen: boolean; benefitsAvailable: boolean; growthAvailable: boolean };

export const DEFAULT_PROGRAM: ProgramSettings = { applicationsOpen: true, benefitsAvailable: true, growthAvailable: true };

/** Tracks an applicant may request / an admin may plan right now. Never includes investment. */
export function availableTracks(program: ProgramSettings): SharksTrack[] {
  return [...(program.benefitsAvailable ? (["BENEFITS"] as const) : []), ...(program.growthAvailable ? (["GROWTH"] as const) : [])];
}

/** Applications are accepted only while open and at least one track is on offer. */
export function acceptingApplications(program: ProgramSettings) {
  return program.applicationsOpen && availableTracks(program).length > 0;
}

/* ── Applications ────────────────────────────────────────────────────────── */

const APPLICATION_TRANSITIONS: Record<SharksApplicationStatus, SharksApplicationStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "INFO_REQUESTED", "INTERVIEW", "WAITLISTED", "REJECTED"],
  UNDER_REVIEW: ["INFO_REQUESTED", "INTERVIEW", "ACCEPTED", "WAITLISTED", "REJECTED"],
  INFO_REQUESTED: ["UNDER_REVIEW", "INTERVIEW", "WAITLISTED", "REJECTED"],
  INTERVIEW: ["UNDER_REVIEW", "INFO_REQUESTED", "ACCEPTED", "WAITLISTED", "REJECTED"],
  WAITLISTED: ["UNDER_REVIEW", "INTERVIEW", "ACCEPTED", "REJECTED"],
  ACCEPTED: ["UNDER_REVIEW"],
  REJECTED: ["UNDER_REVIEW"],
};

export const DECISION_STATUSES: SharksApplicationStatus[] = ["ACCEPTED", "WAITLISTED", "REJECTED"];

/** Statuses that still count as "an application in progress" for the store. */
export const OPEN_APPLICATION_STATUSES: SharksApplicationStatus[] = ["SUBMITTED", "UNDER_REVIEW", "INFO_REQUESTED", "INTERVIEW", "WAITLISTED", "ACCEPTED"];

export function nextApplicationStatuses(from: SharksApplicationStatus) {
  return APPLICATION_TRANSITIONS[from];
}

export type Gate = { ok: true } | { ok: false; reason: string };
const ok: Gate = { ok: true };
const no = (reason: string): Gate => ({ ok: false, reason });

export function canChangeApplicationStatus(input: {
  from: SharksApplicationStatus;
  to: SharksApplicationStatus;
  hasPlan: boolean;
  hasStory: boolean;
  message?: string | null;
}): Gate {
  if (input.from === input.to) return no("الطلب بالفعل في الحالة دي");
  if (!APPLICATION_TRANSITIONS[input.from].includes(input.to)) return no("مينفعش تنقل الطلب للحالة دي من حالته الحالية");
  // Reopening an accepted business would orphan what was promised or published.
  if (input.from === "ACCEPTED" && (input.hasPlan || input.hasStory)) return no("الطلب عليه خطة دعم أو قصة — اقفلهم الأول قبل ما تعيد فتحه");
  if (input.to === "INFO_REQUESTED" && !input.message?.trim()) return no("اكتب المعلومات المطلوبة من التاجر");
  return ok;
}

/** A store may apply again only once every earlier application was not selected. */
export function canApplyAgain(previous: SharksApplicationStatus[]) {
  return previous.every((s) => !OPEN_APPLICATION_STATUSES.includes(s));
}

/* ── Evaluation ──────────────────────────────────────────────────────────── */

export type Scores = Record<RubricKey, number>;

export function scoreErrors(scores: Partial<Record<string, unknown>>): Partial<Record<RubricKey, string>> {
  const errors: Partial<Record<RubricKey, string>> = {};
  for (const c of RUBRIC) {
    const v = scores[c.key];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > c.max) errors[c.key] = `رقم صحيح من 0 لـ ${c.max}`;
  }
  return errors;
}

export function scoreTotal(scores: Scores) {
  return RUBRIC.reduce((sum, c) => sum + scores[c.key], 0);
}

/* ── Support plans ───────────────────────────────────────────────────────── */

export function canSavePlan(input: {
  applicationStatus: SharksApplicationStatus;
  track: string;
  program: ProgramSettings;
  existingTrack?: SharksTrack | null;
}): Gate {
  if (input.applicationStatus !== "ACCEPTED") return no("خطة الدعم بتتعمل للطلبات المقبولة بس");
  // Only Benefits and Growth exist as plan tracks; anything else (e.g. investment) is refused.
  if (input.track !== "BENEFITS" && input.track !== "GROWTH") return no("المسار ده مش متاح لخطط الدعم");
  // A plan already on a track keeps working even if that track was later closed to new plans.
  if (input.existingTrack !== input.track && !availableTracks(input.program).includes(input.track)) {
    return no("المسار ده مقفول حاليًا من إعدادات البرنامج");
  }
  return ok;
}

/* ── Stories ─────────────────────────────────────────────────────────────── */

export type StoryState = {
  status: SharksStoryStatus;
  consentGivenAt: Date | null;
  consentRevokedAt: Date | null;
  approvedAt: Date | null;
  title: string;
  summary: string;
  businessName: string;
  industry: string;
  slug: string;
};

export const hasValidConsent = (s: Pick<StoryState, "consentGivenAt" | "consentRevokedAt">) => !!s.consentGivenAt && !s.consentRevokedAt;

export function missingStoryContent(s: Pick<StoryState, "title" | "summary" | "businessName" | "industry" | "slug">) {
  const missing: string[] = [];
  if (!s.title.trim()) missing.push("العنوان");
  if (!s.businessName.trim()) missing.push("اسم البيزنس");
  if (!s.industry.trim()) missing.push("المجال");
  if (s.summary.trim().length < 20) missing.push("الوصف العام");
  if (!s.slug.trim()) missing.push("الرابط");
  return missing;
}

/**
 * Manual moves (the admin's "status" menu). Consent is recorded only through
 * recordConsent, and APPROVED / PUBLISHED only through their gated helpers.
 */
const STORY_MANUAL: Record<SharksStoryStatus, SharksStoryStatus[]> = {
  PROPOSED: ["AWAITING_CONSENT", "ARCHIVED"],
  AWAITING_CONSENT: ["PROPOSED", "ARCHIVED"],
  CONSENT_RECORDED: ["IN_PRODUCTION", "ARCHIVED"],
  IN_PRODUCTION: ["IN_REVIEW", "ARCHIVED"],
  IN_REVIEW: ["IN_PRODUCTION", "ARCHIVED"],
  APPROVED: ["IN_PRODUCTION", "ARCHIVED"],
  PUBLISHED: [],
  UNPUBLISHED: ["IN_PRODUCTION", "ARCHIVED"],
  ARCHIVED: ["PROPOSED"],
};

export function manualStoryMoves(from: SharksStoryStatus) {
  return STORY_MANUAL[from];
}

export function canMoveStory(s: StoryState, to: SharksStoryStatus): Gate {
  if (!STORY_MANUAL[s.status].includes(to)) return no("مينفعش تنقل القصة للحالة دي من حالتها الحالية");
  // Production needs a yes from the business first.
  if ((to === "IN_PRODUCTION" || to === "IN_REVIEW") && !hasValidConsent(s)) return no("لازم موافقة البيزنس تكون متسجلة الأول");
  return ok;
}

export function canRecordConsent(s: StoryState): Gate {
  if (!["PROPOSED", "AWAITING_CONSENT"].includes(s.status)) return no("الموافقة بتتسجل قبل الإنتاج بس");
  return ok;
}

export function canApproveStory(s: StoryState): Gate {
  if (s.status !== "IN_REVIEW") return no("القصة لازم تكون في المراجعة الداخلية الأول");
  if (!hasValidConsent(s)) return no("مفيش موافقة سارية من البيزنس");
  const missing = missingStoryContent(s);
  if (missing.length) return no(`ناقص: ${missing.join("، ")}`);
  return ok;
}

export function canPublishStory(s: StoryState, applicationStatus: SharksApplicationStatus): Gate {
  if (s.status !== "APPROVED" && s.status !== "UNPUBLISHED") return no("القصة لازم تتعتمد الأول");
  if (!s.approvedAt) return no("القصة محتاجة اعتماد داخلي قبل النشر");
  if (!hasValidConsent(s)) return no("مفيش موافقة سارية من البيزنس");
  if (applicationStatus !== "ACCEPTED") return no("الطلب مش في حالة مقبول");
  if (missingStoryContent(s).length) return no("محتوى القصة ناقص");
  return ok;
}

/** Editing public content invalidates an approval: the edited story goes back to review. */
export function statusAfterContentEdit(status: SharksStoryStatus): { allowed: boolean; status: SharksStoryStatus; clearsApproval: boolean } {
  if (status === "PUBLISHED") return { allowed: false, status, clearsApproval: false };
  if (status === "APPROVED" || status === "UNPUBLISHED") return { allowed: true, status: "IN_REVIEW", clearsApproval: true };
  return { allowed: true, status, clearsApproval: false };
}

/** Taken by sibling routes under /sharks. */
export const RESERVED_SLUGS = ["apply"];

/** Slug for a story URL: Latin letters, digits and dashes (Arabic names get a fallback). */
export function storySlug(input: string, fallback: string) {
  const base = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base.length >= 3 && !RESERVED_SLUGS.includes(base) ? base : fallback;
}
