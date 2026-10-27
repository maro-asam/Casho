"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { needsEmailVerification } from "@/lib/auth/email-verification";
import { getSharksProgram } from "@/lib/sharks/program";
import { notifyApplicant } from "@/lib/sharks/notify";
import { acceptingApplications, availableTracks, canApplyAgain } from "@/lib/sharks/workflow";
import { applicationSchema, fieldErrors, replySchema } from "@/lib/sharks/validation";

export type SharksApplyResult = { success: boolean; message: string; fieldErrors?: Record<string, string>; applicationId?: string };

/**
 * A store owner applies to Casho Sharks for one of their own stores. Scope
 * always comes from the session: the store must belong to the signed-in user.
 */
export async function submitSharksApplicationAction(input: unknown): Promise<SharksApplyResult> {
  const userId = await requireUserId();

  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "راجع البيانات المطلوبة", fieldErrors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const account = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true, mustVerifyEmail: true } });
  if (!account || needsEmailVerification(account)) return { success: false, message: "أكّد إيميلك الأول" };

  const program = await getSharksProgram();
  if (!acceptingApplications(program)) return { success: false, message: "التقديم على Casho Sharks مقفول حاليًا" };
  const open = availableTracks(program);
  if (data.requestedTracks.some((t) => !open.includes(t))) {
    return { success: false, message: "المسار ده مش متاح حاليًا", fieldErrors: { requestedTracks: "المسار ده مش متاح حاليًا" } };
  }

  // A double-click / retry of the same form session returns the first result.
  const existing = await prisma.sharksApplication.findUnique({ where: { submissionKey: data.submissionKey }, select: { id: true, userId: true } });
  if (existing) {
    return existing.userId === userId ? { success: true, message: "طلبك اتبعت", applicationId: existing.id } : { success: false, message: "حصل خطأ، جرّب تاني" };
  }

  const store = await prisma.store.findFirst({ where: { id: data.storeId, userId }, select: { id: true } });
  if (!store) return { success: false, message: "التقديم متاح لصاحب المتجر بس", fieldErrors: { storeId: "اختار متجر من متاجرك" } };

  const now = new Date();
  try {
    const created = await prisma.$transaction(async (tx) => {
      // Serialise applications per store so two tabs can't both get through.
      await tx.$queryRaw`SELECT id FROM "Store" WHERE id = ${store.id} FOR UPDATE`;
      const previous = await tx.sharksApplication.findMany({ where: { storeId: store.id }, select: { status: true } });
      if (!canApplyAgain(previous.map((p) => p.status))) return null;

      const application = await tx.sharksApplication.create({
        data: {
          storeId: store.id,
          userId,
          submissionKey: data.submissionKey,
          businessName: data.businessName,
          storeUrl: data.storeUrl,
          industry: data.industry,
          description: data.description,
          operatingSince: data.operatingSince,
          offering: data.offering,
          customers: data.customers,
          challenge: data.challenge,
          traction: data.traction,
          potential: data.potential,
          requestedTracks: data.requestedTracks,
          investmentInterest: data.investmentInterest,
          supportGoal: data.supportGoal,
          links: data.links,
          extraInfo: data.extraInfo,
          termsAcceptedAt: now,
          marketingOptIn: data.marketingOptIn,
          marketingOptInAt: data.marketingOptIn ? now : null,
        },
        select: { id: true },
      });
      await tx.sharksApplicationEvent.create({
        data: { applicationId: application.id, kind: "SUBMITTED", toStatus: "SUBMITTED", visibleToApplicant: true, actorId: userId },
      });
      return application;
    });

    if (!created) return { success: false, message: "عندك طلب مفتوح بالفعل للمتجر ده" };

    await notifyApplicant({ applicationId: created.id, storeId: store.id, kind: "submitted", status: "SUBMITTED" });
    revalidatePath("/dashboard/sharks");
    revalidatePath("/admin/sharks");
    return { success: true, message: "طلبك اتبعت", applicationId: created.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: true, message: "طلبك اتبعت" };
    }
    console.error("[sharks] submit", error);
    return { success: false, message: "محصلش إرسال، جرّب تاني" };
  }
}

/** The applicant answers the team's question; the application goes back to review. */
export async function replyToSharksInfoRequestAction(input: unknown): Promise<SharksApplyResult> {
  const userId = await requireUserId();
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "اكتب ردك", fieldErrors: fieldErrors(parsed.error) };

  // Owner-scoped lookup: another merchant's id simply isn't found.
  const application = await prisma.sharksApplication.findFirst({
    where: { id: parsed.data.applicationId, store: { userId } },
    select: { id: true, status: true },
  });
  if (!application) return { success: false, message: "الطلب مش موجود" };
  if (application.status !== "INFO_REQUESTED") return { success: false, message: "مفيش سؤال مستني رد على الطلب ده" };

  const moved = await prisma.$transaction(async (tx) => {
    const { count } = await tx.sharksApplication.updateMany({
      where: { id: application.id, status: "INFO_REQUESTED" },
      data: { status: "UNDER_REVIEW", infoRequest: null },
    });
    if (count === 0) return false;
    await tx.sharksApplicationEvent.createMany({
      data: [
        { applicationId: application.id, kind: "APPLICANT_REPLY", message: parsed.data.message, visibleToApplicant: true, actorId: userId },
        { applicationId: application.id, kind: "STATUS_CHANGE", fromStatus: "INFO_REQUESTED", toStatus: "UNDER_REVIEW", visibleToApplicant: true, actorId: userId },
      ],
    });
    return true;
  });
  if (!moved) return { success: false, message: "مفيش سؤال مستني رد على الطلب ده" };

  revalidatePath("/dashboard/sharks");
  revalidatePath("/admin/sharks");
  return { success: true, message: "ردك اتبعت لفريق المراجعة" };
}
