"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type SharksApplicationStatus, type SharksEventKind, type SharksStoryStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { APPLICATION_STATUS, RUBRIC, STORY_STATUS } from "@/lib/sharks/catalog";
import { notifyApplicant } from "@/lib/sharks/notify";
import { getSharksProgram } from "@/lib/sharks/program";
import { parseVideoUrl } from "@/lib/sharks/video";
import {
  DECISION_STATUSES,
  canApproveStory,
  canChangeApplicationStatus,
  canMoveStory,
  canPublishStory,
  canRecordConsent,
  canSavePlan,
  hasValidConsent,
  scoreTotal,
  statusAfterContentEdit,
  storySlug,
  type Scores,
} from "@/lib/sharks/workflow";
import {
  consentSchema,
  evaluationSchema,
  fieldErrors,
  interviewSchema,
  noteSchema,
  planSchema,
  programSchema,
  statusSchema,
  storyContentSchema,
  taskSchema,
} from "@/lib/sharks/validation";
import { z } from "zod";

// Admin side of Casho Sharks. Every action checks the admin first, re-validates
// its input and the workflow gate, and writes an event so decisions are
// auditable (who, when, what). None of these touch balances or payments.

export type SharksAdminResult = { success: boolean; message: string; fieldErrors?: Record<string, string>; id?: string };

const fail = (message: string, errors?: Record<string, string>): SharksAdminResult => ({ success: false, message, fieldErrors: errors });
const invalid = (error: z.ZodError) => fail("راجع البيانات", fieldErrors(error));

function refresh(applicationId?: string, storySlugs: string[] = []) {
  revalidatePath("/admin/sharks", "layout");
  if (applicationId) revalidatePath(`/admin/sharks/${applicationId}`);
  revalidatePath("/dashboard/sharks");
  if (storySlugs.length) {
    revalidatePath("/sharks");
    revalidatePath("/");
    for (const slug of storySlugs) revalidatePath(`/sharks/${slug}`);
  }
}

async function logEvent(
  db: Prisma.TransactionClient | typeof prisma,
  applicationId: string,
  actorId: string,
  kind: SharksEventKind,
  message: string | null,
  extra: { fromStatus?: SharksApplicationStatus; toStatus?: SharksApplicationStatus; visibleToApplicant?: boolean } = {},
) {
  await db.sharksApplicationEvent.create({ data: { applicationId, actorId, kind, message, ...extra } });
}

/* ── Applications ────────────────────────────────────────────────────────── */

export async function setSharksApplicationStatusAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { applicationId, status: to, message } = parsed.data;

  const app = await prisma.sharksApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, status: true, storeId: true, plan: { select: { id: true } }, story: { select: { id: true } } },
  });
  if (!app) return fail("الطلب مش موجود");

  const gate = canChangeApplicationStatus({ from: app.status, to, hasPlan: !!app.plan, hasStory: !!app.story, message });
  if (!gate.ok) return fail(gate.reason, to === "INFO_REQUESTED" ? { message: gate.reason } : undefined);

  const decided = DECISION_STATUSES.includes(to);
  const moved = await prisma.$transaction(async (tx) => {
    const { count } = await tx.sharksApplication.updateMany({
      where: { id: app.id, status: app.status },
      data: {
        status: to,
        infoRequest: to === "INFO_REQUESTED" ? message : null,
        ...(decided ? { decidedAt: new Date(), decidedById: admin.id } : { decidedAt: null, decidedById: null }),
      },
    });
    if (count === 0) return false;
    await logEvent(tx, app.id, admin.id, to === "INFO_REQUESTED" ? "INFO_REQUEST" : "STATUS_CHANGE", message, {
      fromStatus: app.status,
      toStatus: to,
      visibleToApplicant: true,
    });
    return true;
  });
  if (!moved) return fail("الطلب اتغيّر من شوية — حدّث الصفحة");

  await notifyApplicant({ applicationId: app.id, storeId: app.storeId, kind: to === "INFO_REQUESTED" ? "info_requested" : "status", status: to, detail: message });
  refresh(app.id);
  return { success: true, message: `بقى «${APPLICATION_STATUS[to].ar}»` };
}

export async function addSharksNoteAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const exists = await prisma.sharksApplication.count({ where: { id: parsed.data.applicationId } });
  if (!exists) return fail("الطلب مش موجود");
  await logEvent(prisma, parsed.data.applicationId, admin.id, "NOTE", parsed.data.message);
  refresh(parsed.data.applicationId);
  return { success: true, message: "الملاحظة اتسجلت" };
}

export async function saveSharksEvaluationAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = evaluationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { applicationId, notes, ...rest } = parsed.data;
  const scores = Object.fromEntries(RUBRIC.map((c) => [c.key, rest[c.key]])) as Scores;
  const total = scoreTotal(scores);

  const exists = await prisma.sharksApplication.count({ where: { id: applicationId } });
  if (!exists) return fail("الطلب مش موجود");

  await prisma.$transaction(async (tx) => {
    await tx.sharksEvaluation.upsert({
      where: { applicationId_reviewerId: { applicationId, reviewerId: admin.id } },
      create: { applicationId, reviewerId: admin.id, ...scores, total, notes },
      update: { ...scores, total, notes },
    });
    await logEvent(tx, applicationId, admin.id, "EVALUATION", `تقييم ${total} / 100`);
  });
  refresh(applicationId);
  return { success: true, message: `التقييم اتسجل: ${total} / 100` };
}

export async function recordSharksInterviewAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = interviewSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { applicationId, interviewAt, interviewLocation, notes } = parsed.data;

  const exists = await prisma.sharksApplication.count({ where: { id: applicationId } });
  if (!exists) return fail("الطلب مش موجود");

  await prisma.$transaction(async (tx) => {
    await tx.sharksApplication.update({ where: { id: applicationId }, data: { interviewAt, interviewLocation } });
    const when = interviewAt ? interviewAt.toISOString() : "بدون ميعاد";
    await logEvent(tx, applicationId, admin.id, "INTERVIEW", [`مقابلة: ${when}${interviewLocation ? ` · ${interviewLocation}` : ""}`, notes].filter(Boolean).join("\n"));
  });
  refresh(applicationId);
  return { success: true, message: "بيانات المقابلة اتسجلت" };
}

/* ── Support plan ────────────────────────────────────────────────────────── */

export async function saveSharksPlanAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const [app, program] = await Promise.all([
    prisma.sharksApplication.findUnique({ where: { id: data.applicationId }, select: { id: true, status: true, plan: { select: { id: true, track: true } } } }),
    getSharksProgram(),
  ]);
  if (!app) return fail("الطلب مش موجود");

  const gate = canSavePlan({ applicationStatus: app.status, track: data.track, program, existingTrack: app.plan?.track ?? null });
  if (!gate.ok) return fail(gate.reason, { track: gate.reason });
  const track = data.track as "BENEFITS" | "GROWTH";

  if (data.ownerId) {
    const owner = await prisma.user.findFirst({ where: { id: data.ownerId, role: { in: ["ADMIN", "SUPER_ADMIN"] } }, select: { id: true } });
    if (!owner) return fail("المسؤول لازم يكون أدمن", { ownerId: "اختار أدمن" });
  }

  const fields = {
    track,
    benefits: data.benefits,
    scope: data.scope,
    limitations: data.limitations,
    startsOn: data.startsOn,
    endsOn: data.endsOn,
    ownerId: data.ownerId,
    status: data.status,
    completedAt: data.status === "COMPLETED" ? new Date() : null,
  };

  await prisma.$transaction(async (tx) => {
    await tx.sharksSupportPlan.upsert({
      where: { applicationId: app.id },
      create: { applicationId: app.id, createdById: admin.id, ...fields },
      update: fields,
    });
    await logEvent(tx, app.id, admin.id, "PLAN", app.plan ? "خطة الدعم اتعدلت" : "خطة الدعم اتعملت");
  });
  refresh(app.id);
  return { success: true, message: "خطة الدعم اتحفظت" };
}

export async function addSharksTaskAction(input: unknown): Promise<SharksAdminResult> {
  await requireAdmin();
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const plan = await prisma.sharksSupportPlan.findUnique({ where: { id: parsed.data.planId }, select: { id: true, applicationId: true } });
  if (!plan) return fail("الخطة مش موجودة");
  await prisma.sharksPlanTask.create({ data: parsed.data });
  refresh(plan.applicationId);
  return { success: true, message: parsed.data.isMilestone ? "المرحلة اتضافت" : "المهمة اتضافت" };
}

const taskStatusSchema = z.object({ taskId: z.string().uuid(), status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELED"]) });

export async function setSharksTaskStatusAction(input: unknown): Promise<SharksAdminResult> {
  await requireAdmin();
  const parsed = taskStatusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const task = await prisma.sharksPlanTask.findUnique({ where: { id: parsed.data.taskId }, select: { plan: { select: { applicationId: true } } } });
  if (!task) return fail("المهمة مش موجودة");
  await prisma.sharksPlanTask.update({
    where: { id: parsed.data.taskId },
    data: { status: parsed.data.status, completedAt: parsed.data.status === "DONE" ? new Date() : null },
  });
  refresh(task.plan.applicationId);
  return { success: true, message: "اتحدثت" };
}

export async function addSharksProgressNoteAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const plan = await prisma.sharksSupportPlan.findUnique({ where: { applicationId: parsed.data.applicationId }, select: { id: true } });
  if (!plan) return fail("مفيش خطة دعم للطلب ده");
  await logEvent(prisma, parsed.data.applicationId, admin.id, "PROGRESS", parsed.data.message);
  refresh(parsed.data.applicationId);
  return { success: true, message: "التحديث اتسجل" };
}

/* ── Stories ─────────────────────────────────────────────────────────────── */

const idSchema = z.object({ applicationId: z.string().uuid() });
const storyIdSchema = z.object({ storyId: z.string().uuid() });

const STORY_GATE_FIELDS = {
  id: true,
  slug: true,
  status: true,
  consentGivenAt: true,
  consentRevokedAt: true,
  approvedAt: true,
  title: true,
  summary: true,
  businessName: true,
  industry: true,
  videoUrl: true,
  applicationId: true,
  application: { select: { status: true } },
} satisfies Prisma.SharksStorySelect;

async function loadStory(storyId: string) {
  return prisma.sharksStory.findUnique({ where: { id: storyId }, select: STORY_GATE_FIELDS });
}

/** Proposes a story for an accepted business. Nothing is public until consent + approval + publish. */
export async function createSharksStoryAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const app = await prisma.sharksApplication.findUnique({
    where: { id: parsed.data.applicationId },
    select: { id: true, status: true, businessName: true, industry: true, story: { select: { id: true } } },
  });
  if (!app) return fail("الطلب مش موجود");
  if (app.status !== "ACCEPTED") return fail("القصص بتتعمل للطلبات المقبولة بس");
  if (app.story) return { success: true, message: "القصة موجودة", id: app.story.id };

  let slug = storySlug(app.businessName, `story-${app.id.slice(0, 8)}`);
  if (await prisma.sharksStory.count({ where: { slug } })) slug = `${slug}-${app.id.slice(0, 4)}`;

  const story = await prisma.$transaction(async (tx) => {
    const created = await tx.sharksStory.create({
      data: { applicationId: app.id, slug, title: app.businessName, businessName: app.businessName, industry: app.industry, summary: "", createdById: admin.id },
      select: { id: true },
    });
    await logEvent(tx, app.id, admin.id, "STORY", "قصة اتقترحت");
    return created;
  });
  refresh(app.id);
  return { success: true, message: "القصة اتعملت كمقترح", id: story.id };
}

export async function updateSharksStoryAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = storyContentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { storyId, ...content } = parsed.data;

  const story = await loadStory(storyId);
  if (!story) return fail("القصة مش موجودة");
  const next = statusAfterContentEdit(story.status);
  if (!next.allowed) return fail("القصة منشورة — شيلها من النشر الأول عشان تعدّلها");

  // A new or changed video link is never published implicitly.
  const videoChanged = (content.videoUrl ?? null) !== (story.videoUrl ?? null);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.sharksStory.update({
        where: { id: story.id },
        data: {
          ...content,
          status: next.status,
          ...(next.clearsApproval && { approvedAt: null, approvedById: null }),
          ...(videoChanged && { videoPublished: false }),
        },
      });
      if (next.clearsApproval) await logEvent(tx, story.applicationId, admin.id, "STORY", "القصة اتعدلت بعد الاعتماد — رجعت للمراجعة");
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return fail("الرابط ده مستخدم في قصة تانية", { slug: "الرابط مستخدم" });
    throw error;
  }
  refresh(story.applicationId);
  return { success: true, message: next.clearsApproval ? "اتحفظت — ورجعت للمراجعة الداخلية" : "اتحفظت" };
}

const moveSchema = z.object({ storyId: z.string().uuid(), status: z.enum(Object.keys(STORY_STATUS) as [SharksStoryStatus, ...SharksStoryStatus[]]) });

export async function moveSharksStoryAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const story = await loadStory(parsed.data.storyId);
  if (!story) return fail("القصة مش موجودة");
  const to = parsed.data.status;

  const gate = canMoveStory(story, to);
  if (!gate.ok) return fail(gate.reason);

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.sharksStory.updateMany({
      where: { id: story.id, status: story.status },
      data: {
        status: to,
        // Going back to production or the archive drops the approval.
        ...((to === "IN_PRODUCTION" || to === "ARCHIVED" || to === "PROPOSED") && { approvedAt: null, approvedById: null }),
        ...(to === "ARCHIVED" && { archivedAt: new Date(), videoPublished: false }),
      },
    });
    if (count) await logEvent(tx, story.applicationId, admin.id, "STORY", `القصة بقت «${STORY_STATUS[to].ar}»`);
  });
  refresh(story.applicationId);
  return { success: true, message: `بقت «${STORY_STATUS[to].ar}»` };
}

export async function recordSharksConsentAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = consentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const story = await loadStory(parsed.data.storyId);
  if (!story) return fail("القصة مش موجودة");
  const gate = canRecordConsent(story);
  if (!gate.ok) return fail(gate.reason);

  await prisma.$transaction(async (tx) => {
    await tx.sharksStory.update({
      where: { id: story.id },
      data: {
        status: "CONSENT_RECORDED",
        consentGivenAt: parsed.data.givenAt,
        consentGivenBy: parsed.data.givenBy,
        consentMethod: parsed.data.method,
        consentScope: parsed.data.scope,
        consentRecordedById: admin.id,
        consentRevokedAt: null,
      },
    });
    await logEvent(tx, story.applicationId, admin.id, "STORY", `موافقة النشر اتسجلت (${parsed.data.givenBy} · ${parsed.data.method})`);
  });
  refresh(story.applicationId);
  return { success: true, message: "الموافقة اتسجلت" };
}

const revokeSchema = z.object({ storyId: z.string().uuid(), reason: z.string().trim().min(2, "اكتب السبب").max(1000) });

/** Consent withdrawn: the story comes down immediately and needs a fresh yes. */
export async function revokeSharksConsentAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = revokeSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const story = await loadStory(parsed.data.storyId);
  if (!story) return fail("القصة مش موجودة");
  if (!hasValidConsent(story)) return fail("مفيش موافقة سارية");

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.sharksStory.update({
      where: { id: story.id },
      data: {
        consentRevokedAt: now,
        status: "AWAITING_CONSENT",
        approvedAt: null,
        approvedById: null,
        videoPublished: false,
        ...(story.status === "PUBLISHED" && { unpublishedAt: now }),
      },
    });
    await logEvent(tx, story.applicationId, admin.id, "STORY", `الموافقة اتسحبت: ${parsed.data.reason}`);
  });
  refresh(story.applicationId, [story.slug]);
  return { success: true, message: story.status === "PUBLISHED" ? "الموافقة اتسحبت والقصة اتشالت من النشر" : "الموافقة اتسحبت" };
}

export async function approveSharksStoryAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = storyIdSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const story = await loadStory(parsed.data.storyId);
  if (!story) return fail("القصة مش موجودة");
  const gate = canApproveStory(story);
  if (!gate.ok) return fail(gate.reason);

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.sharksStory.updateMany({
      where: { id: story.id, status: "IN_REVIEW" },
      data: { status: "APPROVED", approvedAt: new Date(), approvedById: admin.id },
    });
    if (count) await logEvent(tx, story.applicationId, admin.id, "STORY", "القصة اتعتمدت للنشر");
  });
  refresh(story.applicationId);
  return { success: true, message: "القصة اتعتمدت — تقدر تنشرها" };
}

export async function publishSharksStoryAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = storyIdSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const story = await loadStory(parsed.data.storyId);
  if (!story) return fail("القصة مش موجودة");
  const gate = canPublishStory(story, story.application.status);
  if (!gate.ok) return fail(gate.reason);

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.sharksStory.updateMany({
      where: { id: story.id, status: story.status, approvedAt: { not: null }, consentRevokedAt: null },
      data: { status: "PUBLISHED", publishedAt: new Date(), unpublishedAt: null },
    });
    if (count) await logEvent(tx, story.applicationId, admin.id, "STORY", "القصة اتنشرت");
  });
  refresh(story.applicationId, [story.slug]);
  return { success: true, message: "القصة اتنشرت" };
}

export async function unpublishSharksStoryAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = storyIdSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const story = await loadStory(parsed.data.storyId);
  if (!story) return fail("القصة مش موجودة");
  if (story.status !== "PUBLISHED") return fail("القصة مش منشورة");

  await prisma.$transaction(async (tx) => {
    await tx.sharksStory.update({ where: { id: story.id }, data: { status: "UNPUBLISHED", unpublishedAt: new Date() } });
    await logEvent(tx, story.applicationId, admin.id, "STORY", "القصة اتشالت من النشر");
  });
  refresh(story.applicationId, [story.slug]);
  return { success: true, message: "القصة اتشالت من النشر" };
}

const videoSchema = z.object({ storyId: z.string().uuid(), published: z.boolean() });

/** The video has its own switch, separate from publishing the story. */
export async function setSharksVideoPublishedAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = videoSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const story = await loadStory(parsed.data.storyId);
  if (!story) return fail("القصة مش موجودة");
  if (parsed.data.published) {
    if (!parseVideoUrl(story.videoUrl)) return fail("مفيش رابط فيديو صالح محفوظ");
    if (!hasValidConsent(story)) return fail("مفيش موافقة سارية من البيزنس");
  }

  await prisma.$transaction(async (tx) => {
    await tx.sharksStory.update({ where: { id: story.id }, data: { videoPublished: parsed.data.published } });
    await logEvent(tx, story.applicationId, admin.id, "STORY", parsed.data.published ? "الفيديو اتفعّل للنشر" : "الفيديو اتقفل");
  });
  refresh(story.applicationId, [story.slug]);
  return { success: true, message: parsed.data.published ? "الفيديو هيظهر مع القصة المنشورة" : "الفيديو مش هيظهر" };
}

/* ── Program ─────────────────────────────────────────────────────────────── */

export async function updateSharksProgramAction(input: unknown): Promise<SharksAdminResult> {
  const admin = await requireAdmin();
  const parsed = programSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await prisma.sharksProgram.upsert({
    where: { id: "default" },
    create: { id: "default", ...parsed.data, updatedById: admin.id },
    update: { ...parsed.data, updatedById: admin.id },
  });
  revalidatePath("/admin/sharks", "layout");
  revalidatePath("/sharks");
  revalidatePath("/dashboard/sharks");
  return { success: true, message: "إعدادات البرنامج اتحفظت" };
}
