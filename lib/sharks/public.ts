import { cache } from "react";
import type { Prisma, SharksTrack } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PROGRAM, type ProgramSettings } from "./workflow";
import { parseVideoUrl } from "./video";

// The only way public pages read Sharks data. Everything goes through the same
// published-and-consented filter and an explicit field list, so internal notes,
// scores, application answers and consent records can never reach a visitor.

const PUBLISHED: Prisma.SharksStoryWhereInput = {
  status: "PUBLISHED",
  publishedAt: { not: null },
  approvedAt: { not: null },
  consentGivenAt: { not: null },
  consentRevokedAt: null,
  application: { status: "ACCEPTED" },
};

const PUBLIC_FIELDS = {
  slug: true,
  title: true,
  businessName: true,
  industry: true,
  summary: true,
  intro: true,
  challenge: true,
  whySelected: true,
  supportProvided: true,
  outcomes: true,
  founderQuote: true,
  founderName: true,
  coverImageUrl: true,
  logoUrl: true,
  showTrack: true,
  videoUrl: true,
  videoPosterUrl: true,
  videoPublished: true,
  publishedAt: true,
  application: { select: { plan: { select: { track: true } } } },
} satisfies Prisma.SharksStorySelect;

type Row = Prisma.SharksStoryGetPayload<{ select: typeof PUBLIC_FIELDS }>;

export type PublicStory = {
  slug: string;
  title: string;
  businessName: string;
  industry: string;
  summary: string;
  intro: string | null;
  challenge: string | null;
  whySelected: string | null;
  supportProvided: string | null;
  outcomes: string | null;
  /** Present only when both a quote and the founder's name were provided. */
  quote: { text: string; by: string } | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  track: SharksTrack | null;
  /** Present only when the video itself was published. */
  video: { url: string; poster: string | null } | null;
  publishedAt: string;
};

function toPublic(row: Row): PublicStory {
  const video = row.videoPublished && parseVideoUrl(row.videoUrl) ? { url: row.videoUrl!, poster: row.videoPosterUrl } : null;
  return {
    slug: row.slug,
    title: row.title,
    businessName: row.businessName,
    industry: row.industry,
    summary: row.summary,
    intro: row.intro,
    challenge: row.challenge,
    whySelected: row.whySelected,
    supportProvided: row.supportProvided,
    outcomes: row.outcomes,
    quote: row.founderQuote && row.founderName ? { text: row.founderQuote, by: row.founderName } : null,
    coverImageUrl: row.coverImageUrl,
    logoUrl: row.logoUrl,
    track: row.showTrack ? (row.application.plan?.track ?? null) : null,
    video,
    publishedAt: row.publishedAt!.toISOString(),
  };
}

/**
 * Published stories, newest first. A database hiccup must not take down the
 * marketing page — it then renders the "first stories soon" state.
 */
export const getPublishedStories = cache(async (limit = 24): Promise<PublicStory[]> => {
  try {
    const rows = await prisma.sharksStory.findMany({ where: PUBLISHED, select: PUBLIC_FIELDS, orderBy: { publishedAt: "desc" }, take: limit });
    return rows.map(toPublic);
  } catch (error) {
    console.error("[sharks] published stories", error);
    return [];
  }
});

export const getPublishedStory = cache(async (slug: string): Promise<PublicStory | null> => {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const row = await prisma.sharksStory.findFirst({ where: { ...PUBLISHED, slug }, select: PUBLIC_FIELDS });
  return row ? toPublic(row) : null;
});

/** Program switches for public copy; falls back to defaults if the DB is unreachable. */
export const getPublicProgram = cache(async (): Promise<ProgramSettings> => {
  try {
    const row = await prisma.sharksProgram.findUnique({
      where: { id: "default" },
      select: { applicationsOpen: true, benefitsAvailable: true, growthAvailable: true },
    });
    return row ?? DEFAULT_PROGRAM;
  } catch (error) {
    console.error("[sharks] program", error);
    return DEFAULT_PROGRAM;
  }
});
