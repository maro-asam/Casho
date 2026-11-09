"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { prisma } from "@/lib/prisma";
import { registrantSchema } from "@/lib/domains/registrant";

// Admin side of domain sales (lib/domains): the on/off switch, the USD rate,
// the markup and the registrant contact sent with every registration.

const settingsSchema = z.object({
  enabled: z.boolean(),
  /** EGP per 1 USD, as typed (e.g. 50.75). */
  usdRate: z.number({ error: "اكتب سعر الدولار" }).min(10, "سعر الدولار مش منطقي").max(1000, "سعر الدولار مش منطقي"),
  /** Percent on top of Vercel's price. */
  markupPercent: z.number({ error: "اكتب الهامش" }).min(0, "الهامش مينفعش يكون بالسالب").max(200, "الهامش كبير أوي"),
  registrant: z.unknown(),
});

export type DomainSettingsInput = z.input<typeof settingsSchema>;
export type DomainAdminResult = { success: boolean; message: string; fieldErrors?: Record<string, string> };

function errorsOf(error: z.ZodError, prefix = "") {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = prefix + issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}

export async function updateDomainSettingsAction(input: DomainSettingsInput): Promise<DomainAdminResult> {
  const admin = await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "راجع الحقول", fieldErrors: errorsOf(parsed.error) };

  const { enabled, usdRate, markupPercent } = parsed.data;
  const contact = registrantSchema.safeParse(parsed.data.registrant);
  // The contact is required to sell; while sales are off a half-filled one is just not saved.
  if (enabled && !contact.success) {
    return { success: false, message: "بيانات المسجّل ناقصة — لازم تكمل عشان تفتح البيع", fieldErrors: errorsOf(contact.error, "registrant.") };
  }

  const data = {
    enabled,
    usdRate: Math.round(usdRate * 100),
    markupBps: Math.round(markupPercent * 100),
    ...(contact.success && { registrant: contact.data as Prisma.InputJsonObject }),
    updatedById: admin.id,
  };
  await prisma.domainSettings.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });
  revalidatePath("/admin/domains");
  return { success: true, message: enabled ? "اتحفظ — التجار يقدروا يشتروا دومينات دلوقتي." : "اتحفظ — شراء الدومينات مقفول للتجار." };
}
