import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ExternalLink, X } from "lucide-react";

import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { prisma } from "@/lib/prisma";
import { StatusText } from "@/components/saas-page";
import { STORY_STATUS } from "@/lib/sharks/catalog";
import { parseVideoUrl } from "@/lib/sharks/video";
import { canApproveStory, canMoveStory, canPublishStory, hasValidConsent, manualStoryMoves, missingStoryContent } from "@/lib/sharks/workflow";
import { BackLink, Fields, Panel } from "../../../_components/admin-ui";
import { fmtDate, fmtDateTime } from "../../../_lib/format";
import { ConsentForm, RevokeConsentButton, StoryEditor, StoryWorkflow, VideoPublishSwitch } from "../../_components/story-controls";

export default async function SharksStoryEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const story = await prisma.sharksStory.findUnique({
    where: { id },
    include: { application: { select: { id: true, status: true, marketingOptIn: true, businessName: true } } },
  });
  if (!story) notFound();

  const people = await prisma.user.findMany({
    where: { id: { in: [story.consentRecordedById, story.approvedById].filter(Boolean) as string[] } },
    select: { id: true, name: true, email: true },
  });
  const nameOf = (uid: string | null) => people.find((p) => p.id === uid)?.name || people.find((p) => p.id === uid)?.email || "—";

  const consent = hasValidConsent(story);
  const approve = canApproveStory(story);
  const publish = canPublishStory(story, story.application.status);
  const missing = missingStoryContent(story);
  const moves = manualStoryMoves(story.status).filter((to) => canMoveStory(story, to).ok);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://casho.store";

  const checks = [
    { ok: story.application.status === "ACCEPTED", label: "الطلب مقبول" },
    { ok: consent, label: "موافقة البيزنس مسجلة وسارية" },
    { ok: missing.length === 0, label: missing.length ? `المحتوى ناقص: ${missing.join("، ")}` : "المحتوى الأساسي كامل" },
    { ok: !!story.approvedAt, label: story.approvedAt ? `اتعتمدت (${nameOf(story.approvedById)})` : "اعتماد داخلي" },
    { ok: story.status === "PUBLISHED", label: "منشورة" },
  ];

  return (
    <div className="space-y-6">
      <BackLink href="/admin/sharks/stories">كل القصص</BackLink>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold">{story.businessName}</h2>
            <StatusText tone={STORY_STATUS[story.status].tone}>{STORY_STATUS[story.status].ar}</StatusText>
          </div>
          <p className="text-sm text-muted-foreground">
            <Link href={`/admin/sharks/${story.application.id}`} className="text-primary hover:underline">
              طلب {story.application.businessName}
            </Link>
            {story.publishedAt && story.status === "PUBLISHED" && ` · اتنشرت ${fmtDateTime(story.publishedAt)}`}
            {story.unpublishedAt && story.status !== "PUBLISHED" && ` · اتشالت ${fmtDateTime(story.unpublishedAt)}`}
          </p>
        </div>
        {story.status === "PUBLISHED" && (
          <a href={`${appUrl}/sharks/${story.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ExternalLink className="size-4" />
            افتح الصفحة العامة
          </a>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel title="مسار النشر" description="المقترح ← موافقة البيزنس ← الإنتاج ← مراجعة داخلية ← اعتماد ← نشر.">
            <ul className="mb-5 grid gap-2 text-sm sm:grid-cols-2">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  {c.ok ? <Check className="size-4 text-emerald-600" aria-label="تم" /> : <X className="size-4 text-muted-foreground" aria-label="لسه" />}
                  <span className={c.ok ? undefined : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
            <StoryWorkflow
              storyId={story.id}
              status={story.status}
              moves={moves}
              canApprove={approve.ok ? { ok: true } : { ok: false, reason: approve.reason }}
              canPublish={publish.ok ? { ok: true } : { ok: false, reason: publish.reason }}
            />
          </Panel>

          <Panel title="المحتوى العام" description="كل اللي هنا بيظهر على الصفحة العامة بعد النشر. مفيش ملاحظات داخلية أو تقييمات بتتنشر.">
            <StoryEditor
              storyId={story.id}
              locked={story.status === "PUBLISHED"}
              approved={story.status === "APPROVED" || story.status === "UNPUBLISHED"}
              content={{
                slug: story.slug,
                title: story.title,
                businessName: story.businessName,
                industry: story.industry,
                summary: story.summary,
                intro: story.intro,
                challenge: story.challenge,
                whySelected: story.whySelected,
                supportProvided: story.supportProvided,
                outcomes: story.outcomes,
                founderQuote: story.founderQuote,
                founderName: story.founderName,
                coverImageUrl: story.coverImageUrl,
                logoUrl: story.logoUrl,
                videoUrl: story.videoUrl,
                videoPosterUrl: story.videoPosterUrl,
                showTrack: story.showTrack,
              }}
            />
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="موافقة البيزنس على النشر">
            {consent ? (
              <div className="space-y-4">
                <Fields
                  rows={[
                    { label: "وافق", value: story.consentGivenBy },
                    { label: "التاريخ", value: fmtDate(story.consentGivenAt) },
                    { label: "الوسيلة", value: story.consentMethod },
                    { label: "سجّلها", value: nameOf(story.consentRecordedById) },
                  ]}
                />
                <p className="whitespace-pre-wrap rounded-md bg-muted px-3 py-2 text-sm">{story.consentScope}</p>
                <RevokeConsentButton storyId={story.id} published={story.status === "PUBLISHED"} />
              </div>
            ) : (
              <div className="space-y-3">
                {story.consentRevokedAt && <p className="text-sm text-muted-foreground">الموافقة اتسحبت {fmtDateTime(story.consentRevokedAt)}.</p>}
                <p className="text-xs text-muted-foreground">
                  {story.application.marketingOptIn ? "التاجر قال وقت التقديم إنه مرحّب بالتواصل بخصوص النشر — لسه محتاج موافقة على القصة نفسها." : "التاجر ماختارش التواصل بخصوص النشر وقت التقديم."}
                </p>
                {story.status === "PROPOSED" || story.status === "AWAITING_CONSENT" ? (
                  <ConsentForm storyId={story.id} />
                ) : (
                  <p className="text-sm text-muted-foreground">رجّع القصة لـ «مقترحة» عشان تسجّل موافقة جديدة.</p>
                )}
              </div>
            )}
          </Panel>

          <Panel title="الفيديو" description="نشر الفيديو منفصل عن نشر القصة.">
            {story.videoUrl ? (
              <VideoPublishSwitch
                storyId={story.id}
                published={story.videoPublished}
                disabledReason={!parseVideoUrl(story.videoUrl) ? "رابط الفيديو مش مدعوم" : !consent ? "محتاج موافقة سارية من البيزنس" : null}
              />
            ) : (
              <p className="text-sm text-muted-foreground">مفيش فيديو. ارفعه على YouTube أو Cloudinary وحط الرابط في المحتوى.</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
