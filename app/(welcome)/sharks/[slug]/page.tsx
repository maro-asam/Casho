import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProgram, getPublishedStory } from "@/lib/sharks/public";
import { acceptingApplications } from "@/lib/sharks/workflow";
import StoryView from "../../_components/sharks/StoryView";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStory(slug).catch(() => null);
  if (!story) return { title: "Casho Sharks", robots: { index: false } };
  return {
    title: `${story.businessName} — Casho Sharks`,
    description: story.summary,
    alternates: { canonical: `/sharks/${story.slug}` },
    openGraph: {
      title: `${story.businessName} — Casho Sharks`,
      description: story.summary,
      type: "article",
      ...(story.coverImageUrl && { images: [{ url: story.coverImageUrl }] }),
    },
  };
}

/** Only published, consented stories resolve; everything else is a plain 404. */
export default async function SharksStoryPage({ params }: Props) {
  const { slug } = await params;
  const [story, program] = await Promise.all([getPublishedStory(slug), getPublicProgram()]);
  if (!story) notFound();

  return (
    <div className="al">
      <StoryView story={story} open={acceptingApplications(program)} />
    </div>
  );
}
