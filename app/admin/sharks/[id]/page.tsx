import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { prisma } from "@/lib/prisma";
import { StatusText } from "@/components/saas-page";
import { APPLICATION_STATUS, OPERATING_SINCE, RUBRIC, STORY_STATUS, TRACKS, type OperatingSince } from "@/lib/sharks/catalog";
import { getSharksProgram } from "@/lib/sharks/program";
import { availableTracks, nextApplicationStatuses } from "@/lib/sharks/workflow";
import { BackLink, Fields, Panel, PanelEmpty } from "../../_components/admin-ui";
import { SUBSCRIPTION_META, fmtDate, fmtDateTime } from "../../_lib/format";
import { CreateStoryButton, EvaluationForm, InterviewForm, NoteForm, StatusControls } from "../_components/application-controls";
import { PlanForm, TaskList } from "../_components/plan-controls";

const EVENT_LABEL: Record<string, string> = {
  SUBMITTED: "اتقدّم",
  STATUS_CHANGE: "تغيير حالة",
  INFO_REQUEST: "طلب معلومات",
  APPLICANT_REPLY: "رد التاجر",
  NOTE: "ملاحظة داخلية",
  EVALUATION: "تقييم",
  INTERVIEW: "مقابلة",
  PLAN: "خطة الدعم",
  PROGRESS: "تحديث تنفيذ",
  STORY: "القصة",
};

export default async function SharksApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [app, program] = await Promise.all([
    prisma.sharksApplication.findUnique({
      where: { id },
      include: {
        store: { select: { name: true, slug: true, subscriptionStatus: true, createdAt: true, user: { select: { email: true, name: true, phone_number: true } } } },
        events: { orderBy: { createdAt: "desc" } },
        evaluations: { orderBy: { updatedAt: "desc" } },
        plan: { include: { tasks: { orderBy: [{ dueOn: "asc" }, { createdAt: "asc" }] } } },
        story: { select: { id: true, status: true, slug: true } },
      },
    }),
    getSharksProgram(),
  ]);
  if (!app) notFound();

  // One lookup for every actor/reviewer/owner name on the page.
  const ids = [...new Set([...app.events.map((e) => e.actorId), ...app.evaluations.map((e) => e.reviewerId), app.decidedById, app.plan?.ownerId].filter(Boolean) as string[])];
  const [people, admins] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } }),
    prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, select: { id: true, name: true, email: true }, orderBy: { email: "asc" } }),
  ]);
  const nameOf = (uid: string | null) => {
    if (!uid) return "—";
    const p = people.find((x) => x.id === uid);
    return p ? p.name || p.email : "حساب محذوف";
  };

  const mine = app.evaluations.find((e) => e.reviewerId === admin.id) ?? null;
  const avg = app.evaluations.length ? Math.round(app.evaluations.reduce((s, e) => s + e.total, 0) / app.evaluations.length) : null;
  const meta = APPLICATION_STATUS[app.status];

  const answers: { label: string; value: string | null }[] = [
    { label: "عن البيزنس", value: app.description },
    { label: "بيبيع إيه", value: app.offering },
    { label: "العملاء", value: app.customers },
    { label: "أكبر تحدي", value: app.challenge },
    { label: "وصل لإيه", value: app.traction },
    { label: "ليه شايفه ليه مستقبل", value: app.potential },
    { label: "محتاج مساعدة في", value: app.supportGoal },
    { label: "إضافات", value: app.extraInfo },
  ];

  return (
    <div className="space-y-6">
      <BackLink href="/admin/sharks">كل الطلبات</BackLink>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold">{app.businessName}</h2>
            <StatusText tone={meta.tone}>{meta.ar}</StatusText>
          </div>
          <p className="text-sm text-muted-foreground">
            {app.industry} · اتقدّم {fmtDateTime(app.createdAt)}
            {app.decidedAt && ` · القرار: ${nameOf(app.decidedById)} في ${fmtDateTime(app.decidedAt)}`}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel title="الحالة والقرار" description="كل تغيير بيتسجل باسمك ووقته، والتاجر بيوصله إشعار.">
            <StatusControls applicationId={app.id} next={nextApplicationStatuses(app.status)} />
            {app.status === "INFO_REQUESTED" && app.infoRequest && (
              <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">السؤال المفتوح: </span>
                {app.infoRequest}
              </p>
            )}
          </Panel>

          <Panel title="الطلب">
            <dl className="space-y-4 text-sm">
              {answers
                .filter((a) => a.value)
                .map((a) => (
                  <div key={a.label}>
                    <dt className="text-xs font-medium text-muted-foreground">{a.label}</dt>
                    <dd className="mt-1 whitespace-pre-wrap leading-6">{a.value}</dd>
                  </div>
                ))}
              <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">شغال من</dt>
                  <dd className="mt-1">{app.operatingSince in OPERATING_SINCE ? OPERATING_SINCE[app.operatingSince as OperatingSince].ar : app.operatingSince}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">المسارات المطلوبة</dt>
                  <dd className="mt-1" dir="ltr">
                    {app.requestedTracks.map((t) => TRACKS[t].name.en).join(" · ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">اهتمام بالاستثمار مستقبلًا</dt>
                  <dd className="mt-1">{app.investmentInterest ? "أيوه — للعلم فقط، مش طلب تمويل" : "لأ"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">الموافقات</dt>
                  <dd className="mt-1 space-y-0.5">
                    <p>الشروط: {fmtDateTime(app.termsAcceptedAt)}</p>
                    <p>التواصل بخصوص النشر: {app.marketingOptIn ? `أيوه (${fmtDateTime(app.marketingOptInAt)})` : "لأ"}</p>
                  </dd>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <dt className="text-xs font-medium text-muted-foreground">الروابط</dt>
                <dd className="mt-1 space-y-1">
                  {[app.storeUrl, ...app.links].map((l) => (
                    <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 text-primary hover:underline" dir="ltr">
                      <ExternalLink className="size-3 shrink-0" />
                      <span className="truncate">{l}</span>
                    </a>
                  ))}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel
            title="خطة الدعم"
            description="اللي كاشو اتفقت تقدّمه فعلًا للبيزنس ده. التاجر بيشوف المسار والمزايا والنطاق والمواعيد."
          >
            {app.status === "ACCEPTED" ? (
              <div className="space-y-8">
                <PlanForm
                  applicationId={app.id}
                  plan={app.plan}
                  tracks={availableTracks(program)}
                  admins={admins.map((a) => ({ id: a.id, label: a.name || a.email }))}
                />
                {app.plan && (
                  <>
                    <div className="space-y-3 border-t border-border pt-6">
                      <h3 className="text-sm font-semibold">المهام والمراحل</h3>
                      <TaskList planId={app.plan.id} tasks={app.plan.tasks} />
                    </div>
                    <div className="space-y-3 border-t border-border pt-6">
                      <h3 className="text-sm font-semibold">تحديثات التنفيذ</h3>
                      <NoteForm applicationId={app.id} kind="progress" />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <PanelEmpty>الخطة بتتعمل بعد قبول الطلب.</PanelEmpty>
            )}
          </Panel>

          <Panel title="القصة" description="النشر منفصل عن القبول: محتاج موافقة صريحة من البيزنس واعتماد داخلي.">
            {app.story ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <StatusText tone={STORY_STATUS[app.story.status].tone}>{STORY_STATUS[app.story.status].ar}</StatusText>
                <Link href={`/admin/sharks/stories/${app.story.id}`} className="text-primary hover:underline">
                  افتح القصة
                </Link>
              </div>
            ) : app.status === "ACCEPTED" ? (
              <CreateStoryButton applicationId={app.id} />
            ) : (
              <PanelEmpty>القصص بتتعمل للطلبات المقبولة بس.</PanelEmpty>
            )}
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="المتجر">
            <Fields
              rows={[
                {
                  label: "المتجر",
                  value: (
                    <Link href={`/admin/stores/${app.store.slug}`} className="text-primary hover:underline">
                      {app.store.name}
                    </Link>
                  ),
                },
                { label: "صاحب الحساب", value: app.store.user.name || "—" },
                { label: "الإيميل", value: app.store.user.email, ltr: true },
                { label: "الموبايل", value: app.store.user.phone_number, ltr: true },
                { label: "الاشتراك", value: SUBSCRIPTION_META[app.store.subscriptionStatus]?.label ?? app.store.subscriptionStatus },
                { label: "على كاشو من", value: fmtDate(app.store.createdAt) },
              ]}
            />
          </Panel>

          <Panel title="التقييم" description={avg !== null ? `المتوسط ${avg} / 100 من ${app.evaluations.length} تقييم` : "لسه محدش قيّم"}>
            {app.evaluations.filter((e) => e.reviewerId !== admin.id).length > 0 && (
              <ul className="mb-4 space-y-1 border-b border-border pb-4 text-sm">
                {app.evaluations
                  .filter((e) => e.reviewerId !== admin.id)
                  .map((e) => (
                    <li key={e.id} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{nameOf(e.reviewerId)}</span>
                      <span className="tabular-nums" title={RUBRIC.map((c) => `${c.ar}: ${e[c.key]}`).join("\n")}>
                        {e.total} / 100
                      </span>
                    </li>
                  ))}
              </ul>
            )}
            <EvaluationForm applicationId={app.id} initial={mine} />
          </Panel>

          <Panel title="المقابلة">
            <InterviewForm applicationId={app.id} at={app.interviewAt} location={app.interviewLocation} />
          </Panel>

          <Panel title="ملاحظات داخلية">
            <NoteForm applicationId={app.id} />
          </Panel>

          <Panel title="السجل" flush>
            <ol className="divide-y divide-border">
              {app.events.map((e) => (
                <li key={e.id} className="space-y-1 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {EVENT_LABEL[e.kind] ?? e.kind}
                      {e.toStatus && ` ← ${APPLICATION_STATUS[e.toStatus].ar}`}
                    </span>
                    {!e.visibleToApplicant && <span className="rounded bg-muted px-1.5 text-[11px] text-muted-foreground">داخلي</span>}
                  </div>
                  {e.message && <p className="whitespace-pre-wrap text-muted-foreground">{e.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    {nameOf(e.actorId)} · {fmtDateTime(e.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
