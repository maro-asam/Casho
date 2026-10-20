"use server";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import { discardDraft, publishDraft, stepDraft } from "@/lib/studio/mutate";

type StudioResult = { ok: true; message: string } | { ok: false; message: string };

async function guard(storeId: string) {
  const userId = await requireUserId();
  await MustOwnStore(storeId, userId);
}

export async function PublishStudioDraftAction(storeId: string): Promise<StudioResult> {
  try {
    await guard(storeId);
    const published = await publishDraft(storeId);
    return { ok: true, message: published ? "اتنشر — العملاء شايفين الشكل الجديد دلوقتي" : "مفيش تعديلات جديدة تتنشر" };
  } catch (error) {
    console.error("PublishStudioDraftAction:", error);
    return { ok: false, message: "حصل خطأ أثناء النشر، جرّب تاني" };
  }
}

export async function DiscardStudioDraftAction(storeId: string): Promise<StudioResult> {
  try {
    await guard(storeId);
    await discardDraft(storeId);
    return { ok: true, message: "رجعنا للنسخة المنشورة" };
  } catch (error) {
    console.error("DiscardStudioDraftAction:", error);
    return { ok: false, message: "مقدرناش نلغي التعديلات، جرّب تاني" };
  }
}

export async function StepStudioHistoryAction(storeId: string, direction: "undo" | "redo"): Promise<StudioResult> {
  try {
    await guard(storeId);
    const moved = await stepDraft(storeId, direction);
    if (!moved) return { ok: false, message: direction === "undo" ? "مفيش خطوة قبلها" : "مفيش خطوة بعدها" };
    return { ok: true, message: direction === "undo" ? "رجعنا خطوة" : "رجّعنا الخطوة" };
  } catch (error) {
    console.error("StepStudioHistoryAction:", error);
    return { ok: false, message: "حصل خطأ، جرّب تاني" };
  }
}
