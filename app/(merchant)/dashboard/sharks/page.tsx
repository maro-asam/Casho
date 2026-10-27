import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import type { SharksApplicationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Card, LargeTitle, Rows, Row, StatusText, appleButton } from "@/components/saas-page";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { APPLICATION_STATUS, BENEFITS, OPERATING_SINCE, PLAN_STATUS, TRACKS, pick, type BenefitKey, type OperatingSince } from "@/lib/sharks/catalog";
import { getSharksProgram } from "@/lib/sharks/program";
import { OPEN_APPLICATION_STATUSES, acceptingApplications, availableTracks } from "@/lib/sharks/workflow";
import { currentLocale, lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";
import ApplyFlow, { type EligibleStore } from "./_components/ApplyFlow";
import ReplyForm from "./_components/ReplyForm";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: "Casho Sharks", description: tr("قدّم مشروعك على برنامج Casho Sharks وتابع حالة طلبك.") };
}

const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });
const dtf = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** What the merchant reads under each status. */
function statusExplainer(status: SharksApplicationStatus) {
  switch (status) {
    case "SUBMITTED":
      return tr("طلبك وصل وفي الدور للمراجعة.");
    case "UNDER_REVIEW":
      return tr("فريق كاشو بيراجع طلبك دلوقتي.");
    case "INFO_REQUESTED":
      return tr("محتاجين منك معلومات زيادة عشان نكمّل المراجعة.");
    case "INTERVIEW":
      return tr("عايزين نتكلم معاك أكتر. فريقنا هيتواصل معاك لترتيب مكالمة.");
    case "ACCEPTED":
      return tr("مشروعك اتختار في Casho Sharks.");
    case "WAITLISTED":
      return tr("طلبك في قائمة الانتظار. ممكن نرجعلك لما تتوفر فرصة مناسبة.");
    case "REJECTED":
      return tr("مشروعك مااتختارش المرة دي. تقدر تقدّم تاني بعد ما شغلك يتطور.");
  }
}

export default async function SharksDashboardPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const lang = currentLocale();

  // Applicant-safe fields only: no scores, internal notes or reviewer ids.
  const [stores, applications, program] = await Promise.all([
    prisma.store.findMany({
      where: { userId },
      select: { id: true, name: true, slug: true, customDomain: true, customDomainStatus: true, businessCategory: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sharksApplication.findMany({
      where: { store: { userId } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        storeId: true,
        status: true,
        businessName: true,
        industry: true,
        operatingSince: true,
        requestedTracks: true,
        investmentInterest: true,
        supportGoal: true,
        infoRequest: true,
        interviewAt: true,
        createdAt: true,
        store: { select: { name: true } },
        events: {
          where: { visibleToApplicant: true },
          orderBy: { createdAt: "desc" },
          select: { id: true, kind: true, toStatus: true, message: true, createdAt: true },
        },
        plan: { select: { track: true, benefits: true, scope: true, limitations: true, startsOn: true, endsOn: true, status: true } },
      },
    }),
    getSharksProgram(),
  ]);

  const openStoreIds = new Set(applications.filter((a) => OPEN_APPLICATION_STATUSES.includes(a.status)).map((a) => a.storeId));
  const eligible: EligibleStore[] = stores
    .filter((s) => !openStoreIds.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      url: s.customDomain && s.customDomainStatus === "ACTIVE" ? `https://${s.customDomain}` : buildStoreUrl(s.slug),
      industry: s.businessCategory,
    }));
  const accepting = acceptingApplications(program);
  const tracks = availableTracks(program);
  const showForm = accepting && eligible.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8" dir={tdir()}>
      <LargeTitle
        title="Casho Sharks"
        subtitle={tr("برنامج بيختار مشاريع واعدة من تجار كاشو ويساعدها تكبر بالأدوات والخبرة والشركاء المتاحين. مش برنامج تمويل.")}
        actions={
          <a href={`${process.env.NEXT_PUBLIC_APP_URL || "https://casho.store"}/sharks`} target="_blank" rel="noreferrer" className={appleButton.gray}>
            {tr("عن البرنامج")}
            <ExternalLink className="size-4" />
          </a>
        }
      />

      {applications.map((app) => {
        const meta = APPLICATION_STATUS[app.status];
        return (
          <Card key={app.id} title={app.businessName} subtitle={tr("اتقدّم {0} · {1}", df.format(app.createdAt), app.store.name)}>
            <div className="space-y-6 px-5 pb-6">
              <div className="rounded-2xl bg-muted/60 p-5">
                <StatusText tone={meta.tone} className="text-[17px] font-semibold text-foreground">
                  {pick(meta, lang)}
                </StatusText>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{statusExplainer(app.status)}</p>
                {app.status === "INTERVIEW" && app.interviewAt && (
                  <p className="mt-2 text-[15px] font-medium">{tr("ميعاد المقابلة: {0}", dtf.format(app.interviewAt))}</p>
                )}
              </div>

              {app.status === "INFO_REQUESTED" && (
                <div className="space-y-4 rounded-2xl border border-(--sys-orange)/40 p-5">
                  <div>
                    <p className="text-[13px] font-semibold text-muted-foreground">{tr("سؤال فريق المراجعة")}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{app.infoRequest}</p>
                  </div>
                  <ReplyForm applicationId={app.id} />
                </div>
              )}

              {app.status === "ACCEPTED" &&
                (app.plan ? (
                  <section aria-label={tr("خطة الدعم")} className="rounded-2xl border border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
                      <p className="text-[17px] font-semibold">{tr("خطة الدعم المتفق عليها")}</p>
                      <StatusText tone={PLAN_STATUS[app.plan.status].tone}>{pick(PLAN_STATUS[app.plan.status], lang)}</StatusText>
                    </div>
                    <Rows>
                      <Row label={tr("المسار")}>
                        <span dir="ltr">{pick(TRACKS[app.plan.track].name, lang)}</span>
                      </Row>
                      {app.plan.startsOn && <Row label={tr("البداية")}>{df.format(app.plan.startsOn)}</Row>}
                      {app.plan.endsOn && <Row label={tr("النهاية")}>{df.format(app.plan.endsOn)}</Row>}
                    </Rows>
                    <div className="space-y-4 px-5 pb-5">
                      <ul className="space-y-1.5">
                        {app.plan.benefits.map((k) => (
                          <li key={k} className="flex gap-2 text-[15px]">
                            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                            {k in BENEFITS ? pick(BENEFITS[k as BenefitKey], lang) : k}
                          </li>
                        ))}
                      </ul>
                      <div>
                        <p className="text-[13px] font-semibold text-muted-foreground">{tr("النطاق")}</p>
                        <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{app.plan.scope}</p>
                      </div>
                      {app.plan.limitations && (
                        <div>
                          <p className="text-[13px] font-semibold text-muted-foreground">{tr("الحدود")}</p>
                          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{app.plan.limitations}</p>
                        </div>
                      )}
                    </div>
                  </section>
                ) : (
                  <p className="text-[15px] text-muted-foreground">{tr("فريقنا هيتواصل معاك عشان نتفق سوا على خطة دعم واضحة.")}</p>
                ))}

              {app.events.length > 0 && (
                <div>
                  <p className="text-[13px] font-semibold text-muted-foreground">{tr("السجل")}</p>
                  <ol className="mt-3 space-y-4 border-s border-border ps-5">
                    {app.events.map((e) => (
                      <li key={e.id} className="relative">
                        <span aria-hidden className="absolute top-1.5 size-2 rounded-full bg-muted-foreground/50 -inset-s-[24.5px]" />
                        <p className="text-[15px] font-medium">
                          {e.kind === "SUBMITTED"
                            ? tr("الطلب اتبعت")
                            : e.kind === "INFO_REQUEST"
                              ? tr("الفريق طلب معلومات")
                              : e.kind === "APPLICANT_REPLY"
                                ? tr("إنت رديت")
                                : e.toStatus
                                  ? tr("الحالة بقت «{0}»", pick(APPLICATION_STATUS[e.toStatus], lang))
                                  : tr("تحديث")}
                        </p>
                        {e.message && <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{e.message}</p>}
                        <p className="mt-0.5 text-[12px] text-muted-foreground">{dtf.format(e.createdAt)}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <details className="group rounded-2xl bg-muted/40 px-5 py-4">
                <summary className="cursor-pointer text-[15px] font-medium">{tr("ملخص طلبك")}</summary>
                <dl className="mt-4 space-y-3 text-[15px]">
                  <div>
                    <dt className="text-[13px] text-muted-foreground">{tr("المجال")}</dt>
                    <dd>{app.industry}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted-foreground">{tr("شغال من")}</dt>
                    <dd>{app.operatingSince in OPERATING_SINCE ? pick(OPERATING_SINCE[app.operatingSince as OperatingSince], lang) : app.operatingSince}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted-foreground">{tr("المسارات المطلوبة")}</dt>
                    <dd dir="ltr" className="text-end rtl:text-right">
                      {app.requestedTracks.map((t) => pick(TRACKS[t].name, lang)).join(" · ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted-foreground">{tr("المشكلة اللي عايز مساعدة فيها")}</dt>
                    <dd className="whitespace-pre-wrap leading-relaxed">{app.supportGoal}</dd>
                  </div>
                  {app.investmentInterest && <p className="text-[13px] text-muted-foreground">{tr("طلبت تعرف بأي مسار استثمار مستقبلي (للعلم بس، مش طلب تمويل).")}</p>}
                </dl>
              </details>
            </div>
          </Card>
        );
      })}

      {showForm ? (
        <div className="space-y-4">
          {applications.length > 0 && <h2 className="text-[22px] font-bold">{tr("قدّم لمتجر تاني")}</h2>}
          {applications.length === 0 && (
            <div className="space-y-2 text-[15px] leading-relaxed text-muted-foreground">
              <p>{tr("قولنا بتبني إيه وإيه اللي واقف قدامك. الطلب بياخد حوالي ١٠ دقايق، والمسودة بتتحفظ على جهازك لحد ما تبعتها.")}</p>
            </div>
          )}
          <ApplyFlow stores={eligible} tracks={tracks} />
        </div>
      ) : (
        !accepting &&
        applications.length === 0 && (
          <Card title={tr("التقديم مقفول دلوقتي")}>
            <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted-foreground">{tr("Casho Sharks مش بيستقبل طلبات جديدة حاليًا. هنعلن لما التقديم يفتح تاني.")}</p>
          </Card>
        )
      )}
    </div>
  );
}
