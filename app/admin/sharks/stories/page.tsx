import Link from "next/link";
import { BookOpen, Video } from "lucide-react";

import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { prisma } from "@/lib/prisma";
import { DataCard, EmptyState, StatusPill } from "@/components/saas-page";
import { STORY_STATUS } from "@/lib/sharks/catalog";
import { hasValidConsent } from "@/lib/sharks/workflow";
import { fmtDate } from "../../_lib/format";

export default async function SharksStoriesPage() {
  await requireAdmin();
  const stories = await prisma.sharksStory.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      businessName: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      videoUrl: true,
      videoPublished: true,
      consentGivenAt: true,
      consentRevokedAt: true,
    },
  });

  return (
    <DataCard>
      {stories.length === 0 ? (
        <EmptyState icon={BookOpen} title="مفيش قصص لسه" description="افتح طلب مقبول واضغط «اقترح قصة». القصة مش بتتنشر إلا بعد موافقة البيزنس واعتماد داخلي." />
      ) : (
        <ul className="divide-y divide-border">
          {stories.map((s) => (
            <li key={s.id} className="relative grid gap-2 px-4 py-4 hover:bg-muted/30 md:grid-cols-[minmax(0,1.5fr)_auto_auto] md:items-center md:gap-6">
              <div className="min-w-0">
                <Link href={`/admin/sharks/stories/${s.id}`} className="font-semibold after:absolute after:inset-0 hover:underline">
                  {s.businessName}
                </Link>
                <p className="truncate text-sm text-muted-foreground">{s.title}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{hasValidConsent(s) ? "موافقة مسجلة" : s.consentRevokedAt ? "الموافقة اتسحبت" : "مفيش موافقة"}</span>
                {s.videoUrl && (
                  <span className="inline-flex items-center gap-1">
                    <Video className="size-3.5" />
                    {s.videoPublished ? "الفيديو مفعّل" : "الفيديو مقفول"}
                  </span>
                )}
                {s.publishedAt && s.status === "PUBLISHED" && <span>اتنشرت {fmtDate(s.publishedAt)}</span>}
              </div>
              <div className="md:justify-self-end">
                <StatusPill tone={STORY_STATUS[s.status].tone}>{STORY_STATUS[s.status].ar}</StatusPill>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DataCard>
  );
}
