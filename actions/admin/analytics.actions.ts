"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auditAnalytics, canEditCampaignCosts, requireAnalyticsSuperAdmin, requireAnalyticsViewer } from "@/lib/analytics/access";
import { isValidIpRule } from "@/lib/analytics/guard";
import { funnelInputSchema, type FunnelInput } from "@/lib/analytics/funnels";
import { ANALYTICS_CACHE_TAG } from "@/lib/analytics/queries/shared";
import { clearAnalyticsSettingsCache } from "@/lib/analytics/settings";
import { ID_PATTERN } from "@/lib/analytics/constants";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const fail = (error: string): Result => ({ ok: false, error });

function refresh() {
  revalidateTag(ANALYTICS_CACHE_TAG, { expire: 0 });
  revalidatePath("/admin/analytics", "layout");
}

async function guard() {
  try {
    return await requireAnalyticsSuperAdmin();
  } catch {
    return null;
  }
}

/** Campaign costs: super admins and media buyers (they know what they spent). */
async function costGuard() {
  try {
    const viewer = await requireAnalyticsViewer();
    return canEditCampaignCosts(viewer) ? viewer : null;
  } catch {
    return null;
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────

const lines = (max: number, each: (v: string) => boolean, message: string) =>
  z
    .array(z.string().trim().max(200))
    .max(max)
    .transform((list) => [...new Set(list.filter(Boolean))])
    .refine((list) => list.every(each), message);

const settingsSchema = z.object({
  enabled: z.boolean(),
  trackMarketing: z.boolean(),
  trackApp: z.boolean(),
  trackStorefronts: z.boolean(),
  consentMode: z.enum(["NONE", "BANNER", "REGION"]),
  respectDnt: z.boolean(),
  sessionTimeoutMin: z.coerce.number().int().min(5, "أقل حاجة ٥ دقايق").max(240, "أقصى حاجة ٤ ساعات"),
  realtimeWindowMin: z.coerce.number().int().min(1).max(30),
  rawRetentionDays: z.coerce.number().int().min(7, "أقل حاجة ٧ أيام").max(730),
  sessionRetentionDays: z.coerce.number().int().min(30, "أقل حاجة ٣٠ يوم").max(1095),
  excludedPaths: lines(100, (v) => v.startsWith("/"), "كل مسار مستبعد لازم يبدأ بـ /"),
  excludedQueryParams: lines(100, (v) => /^[\w.-]{1,60}$/.test(v), "اسم باراميتر غير صالح"),
  internalIps: lines(100, isValidIpRule, "في IP أو نطاق مش مكتوب صح (مثال: 41.33.10.5 أو 41.33.0.0/16)"),
  excludeTeam: z.boolean(),
  heatmapsEnabled: z.boolean(),
  heatmapSampleRate: z.coerce.number().int().min(1).max(100),
  heatmapPrivatePages: z.boolean(),
  trackClicks: z.boolean(),
  trackScroll: z.boolean(),
  trackForms: z.boolean(),
  trackErrors: z.boolean(),
  trackVitals: z.boolean(),
  trackCustomEvents: z.boolean(),
});
export type AnalyticsSettingsInput = z.input<typeof settingsSchema>;

export async function SaveAnalyticsSettingsAction(input: AnalyticsSettingsInput): Promise<Result> {
  const viewer = await guard();
  if (!viewer) return fail("الإعدادات دي للسوبر أدمن بس.");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "راجع الإعدادات");
  const data = parsed.data;
  if (data.sessionRetentionDays < data.rawRetentionDays) return fail("مدة الاحتفاظ بملخص الزيارات لازم تكون أطول من أو قد مدة الأحداث.");

  try {
    await prisma.analyticsSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...data, updatedById: viewer.id },
      update: { ...data, updatedById: viewer.id },
    });
    clearAnalyticsSettingsCache();
    await auditAnalytics(viewer, "ANALYTICS_SETTINGS_CHANGED", {
      enabled: data.enabled,
      consentMode: data.consentMode,
      heatmaps: data.heatmapsEnabled,
      rawRetentionDays: data.rawRetentionDays,
    });
    refresh();
    return { ok: true, message: "اتحفظت. التغيير بيوصل للزوار خلال دقايق." };
  } catch (error) {
    console.error("[analytics] save settings", error);
    return fail("مقدرناش نحفظ الإعدادات، جرّب تاني.");
  }
}

// ─── Data deletion (privacy requests, clean-ups) ──────────────────────────

/** Deletes everything collected for one visitor id (a data-subject request). */
export async function DeleteVisitorDataAction(visitorId: string): Promise<Result> {
  const viewer = await guard();
  if (!viewer) return fail("الحذف للسوبر أدمن بس.");
  const id = visitorId.trim();
  if (!ID_PATTERN.test(id)) return fail("رقم الزائر مش صحيح.");
  try {
    const [events, pages, sessions, links] = await prisma.$transaction([
      prisma.analyticsEvent.deleteMany({ where: { visitorId: id } }),
      prisma.analyticsPageView.deleteMany({ where: { visitorId: id } }),
      prisma.analyticsSession.deleteMany({ where: { visitorId: id } }),
      prisma.analyticsIdentity.deleteMany({ where: { visitorId: id } }),
    ]);
    await auditAnalytics(viewer, "ANALYTICS_DATA_DELETED", { kind: "visitor", events: events.count, pages: pages.count, sessions: sessions.count, links: links.count });
    refresh();
    return { ok: true, message: `اتمسح: ${sessions.count} زيارة، ${pages.count} صفحة، ${events.count} حدث.` };
  } catch (error) {
    console.error("[analytics] delete visitor", error);
    return fail("مقدرناش نمسح البيانات، جرّب تاني.");
  }
}

/** Everything a Casho account generated (sessions linked to it and its linked browsers). */
export async function DeleteAccountAnalyticsAction(email: string): Promise<Result> {
  const viewer = await guard();
  if (!viewer) return fail("الحذف للسوبر أدمن بس.");
  const parsed = z.string().trim().toLowerCase().email().safeParse(email);
  if (!parsed.success) return fail("اكتب إيميل صحيح.");
  const user = await prisma.user.findUnique({ where: { email: parsed.data }, select: { id: true } });
  if (!user) return fail("مفيش حساب بالإيميل ده.");
  try {
    const links = await prisma.analyticsIdentity.findMany({ where: { userId: user.id }, select: { visitorId: true } });
    const sessionIds = (await prisma.analyticsSession.findMany({ where: { userId: user.id }, select: { visitorId: true } })).map((s) => s.visitorId);
    const visitors = [...new Set([...links.map((l) => l.visitorId), ...sessionIds])];
    const [events, pages, sessions, ids] = await prisma.$transaction([
      prisma.analyticsEvent.deleteMany({ where: { OR: [{ visitorId: { in: visitors } }, { refId: user.id }] } }),
      prisma.analyticsPageView.deleteMany({ where: { visitorId: { in: visitors } } }),
      prisma.analyticsSession.deleteMany({ where: { OR: [{ visitorId: { in: visitors } }, { userId: user.id }] } }),
      prisma.analyticsIdentity.deleteMany({ where: { userId: user.id } }),
    ]);
    await auditAnalytics(viewer, "ANALYTICS_DATA_DELETED", { kind: "account", userId: user.id, events: events.count, pages: pages.count, sessions: sessions.count, links: ids.count });
    refresh();
    return { ok: true, message: `اتمسح: ${sessions.count} زيارة، ${pages.count} صفحة، ${events.count} حدث.` };
  } catch (error) {
    console.error("[analytics] delete account data", error);
    return fail("مقدرناش نمسح البيانات، جرّب تاني.");
  }
}

// ─── Funnels ──────────────────────────────────────────────────────────────

export async function SaveFunnelAction(id: string | null, input: FunnelInput): Promise<Result & { id?: string }> {
  const viewer = await guard();
  if (!viewer) return fail("تعديل الـ funnels للسوبر أدمن بس.");
  const parsed = funnelInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "راجع الخطوات");
  const data = { ...parsed.data, description: parsed.data.description || null };
  try {
    const row = id
      ? await prisma.analyticsFunnel.update({ where: { id }, data, select: { id: true } })
      : await prisma.analyticsFunnel.create({ data: { ...data, createdById: viewer.id }, select: { id: true } });
    await auditAnalytics(viewer, "ANALYTICS_FUNNEL_CHANGED", { action: id ? "update" : "create", funnelId: row.id });
    refresh();
    return { ok: true, id: row.id };
  } catch (error) {
    console.error("[analytics] save funnel", error);
    return fail("مقدرناش نحفظ الـ funnel.");
  }
}

export async function DeleteFunnelAction(id: string): Promise<Result> {
  const viewer = await guard();
  if (!viewer) return fail("للسوبر أدمن بس.");
  try {
    await prisma.analyticsFunnel.delete({ where: { id } });
    await auditAnalytics(viewer, "ANALYTICS_FUNNEL_CHANGED", { action: "delete", funnelId: id });
    refresh();
    return { ok: true };
  } catch {
    return fail("الـ funnel ده مش موجود.");
  }
}

// ─── Campaign spend ───────────────────────────────────────────────────────

const costSchema = z
  .object({
    campaign: z.string().trim().min(1, "اكتب اسم الحملة زي ما هو في utm_campaign").max(100),
    source: z.string().trim().max(60).optional().nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ البداية"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ النهاية"),
    /** Pounds, as typed. */
    amountEgp: z.coerce.number().positive("المبلغ لازم يكون أكبر من صفر").max(100_000_000),
    note: z.string().trim().max(200).optional().nullable(),
  })
  .refine((v) => v.startDate <= v.endDate, "تاريخ النهاية قبل البداية");

export async function SaveCampaignCostAction(input: z.input<typeof costSchema>): Promise<Result> {
  const viewer = await costGuard();
  if (!viewer) return fail("للسوبر أدمن والميديا باير بس.");
  const parsed = costSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "راجع البيانات");
  const d = parsed.data;
  try {
    const row = await prisma.analyticsCampaignCost.create({
      data: {
        campaign: d.campaign,
        source: d.source?.toLowerCase() || null,
        startDate: new Date(`${d.startDate}T00:00:00Z`),
        endDate: new Date(`${d.endDate}T00:00:00Z`),
        amount: Math.round(d.amountEgp * 100),
        note: d.note || null,
        createdById: viewer.id,
      },
      select: { id: true },
    });
    await auditAnalytics(viewer, "ANALYTICS_COST_CHANGED", { action: "create", costId: row.id, campaign: d.campaign });
    refresh();
    return { ok: true };
  } catch (error) {
    console.error("[analytics] save cost", error);
    return fail("مقدرناش نحفظ التكلفة.");
  }
}

export async function DeleteCampaignCostAction(id: string): Promise<Result> {
  const viewer = await costGuard();
  if (!viewer) return fail("للسوبر أدمن والميديا باير بس.");
  try {
    await prisma.analyticsCampaignCost.delete({ where: { id } });
    await auditAnalytics(viewer, "ANALYTICS_COST_CHANGED", { action: "delete", costId: id });
    refresh();
    return { ok: true };
  } catch {
    return fail("التكلفة دي مش موجودة.");
  }
}
