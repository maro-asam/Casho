import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { Unavailable } from "@/components/saas-page";
import { MEDIA_BUYER_HOME } from "@/lib/admin/panel-roles";
import { requireAnalyticsViewer } from "@/lib/analytics/access";
import { getAnalyticsSettings } from "@/lib/analytics/settings";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "../_lib/format";
import { DataTools, SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AnalyticsSettingsPage() {
  const viewer = await requireAnalyticsViewer();
  // Internal IPs, exclusions and who edited them: admins only.
  if (viewer.mediaBuyer) redirect(MEDIA_BUYER_HOME);
  const settings = await getAnalyticsSettings();
  const [counts, editor] = await Promise.all([
    prisma.$queryRaw<{ sessions: number; pageviews: number; events: number }[]>`
      SELECT (SELECT count(*)::int FROM "AnalyticsSession") AS sessions,
             (SELECT count(*)::int FROM "AnalyticsPageView") AS pageviews,
             (SELECT count(*)::int FROM "AnalyticsEvent") AS events
    `.catch(() => []),
    settings.updatedById ? prisma.user.findUnique({ where: { id: settings.updatedById }, select: { name: true, email: true } }) : null,
  ]);
  const { updatedAt, updatedById: _ignored, ...values } = settings;
  void _ignored;

  return (
    <div className="space-y-6">
      {!viewer.superAdmin && (
        <section className="apple-card">
          <Unavailable icon={Lock} title="الإعدادات للسوبر أدمن" description="تقدر تشوفها بس مش تعدلها." className="py-8" />
        </section>
      )}
      <SettingsForm initial={values} readOnly={!viewer.superAdmin} rows={counts[0] ?? null} />
      {viewer.superAdmin && <DataTools />}
      {updatedAt && (
        <p className="px-1 text-[12px] text-muted-foreground">
          آخر تعديل {fmtDateTime(updatedAt)}
          {editor ? ` — ${editor.name ?? editor.email}` : ""}
        </p>
      )}
    </div>
  );
}
