import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  sharksStory: { findMany: vi.fn(), findFirst: vi.fn() },
  sharksProgram: { findUnique: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }));

const { getPublishedStories, getPublishedStory } = await import("./public");

const PRIVATE = ["consentGivenBy", "consentMethod", "consentScope", "consentRecordedById", "approvedById", "createdById", "status", "applicationId"];

beforeEach(() => vi.clearAllMocks());

describe("public story queries", () => {
  it("only ask for published, approved, consented stories of accepted businesses", async () => {
    prismaMock.sharksStory.findMany.mockResolvedValue([]);
    await getPublishedStories();
    const { where, select } = prismaMock.sharksStory.findMany.mock.calls[0][0];
    expect(where).toMatchObject({
      status: "PUBLISHED",
      publishedAt: { not: null },
      approvedAt: { not: null },
      consentGivenAt: { not: null },
      consentRevokedAt: null,
      application: { status: "ACCEPTED" },
    });
    for (const field of PRIVATE) expect(select).not.toHaveProperty(field);
    // From the application only the plan's track is read — never answers, scores or notes.
    expect(select.application).toEqual({ select: { plan: { select: { track: true } } } });
  });

  it("hide the video unless it was published separately", async () => {
    const row = {
      slug: "nour",
      title: "t",
      businessName: "Nour",
      industry: "i",
      summary: "s",
      intro: null,
      challenge: null,
      whySelected: null,
      supportProvided: null,
      outcomes: null,
      founderQuote: "q",
      founderName: null,
      coverImageUrl: null,
      logoUrl: null,
      showTrack: false,
      videoUrl: "https://youtu.be/abcDEF12345",
      videoPosterUrl: null,
      videoPublished: false,
      publishedAt: new Date(),
      application: { plan: { track: "GROWTH" } },
    };
    prismaMock.sharksStory.findFirst.mockResolvedValue(row);
    const story = await getPublishedStory("nour");
    expect(story?.video).toBeNull();
    expect(story?.track).toBeNull(); // showTrack off
    expect(story?.quote).toBeNull(); // quote without a name isn't shown

    prismaMock.sharksStory.findFirst.mockResolvedValue({ ...row, videoPublished: true, showTrack: true });
    const shown = await getPublishedStory("nour");
    expect(shown?.video?.url).toBe(row.videoUrl);
    expect(shown?.track).toBe("GROWTH");
  });

  it("reject malformed slugs without querying", async () => {
    expect(await getPublishedStory("../admin")).toBeNull();
    expect(prismaMock.sharksStory.findFirst).not.toHaveBeenCalled();
  });

  it("render the empty state when the database is unavailable", async () => {
    prismaMock.sharksStory.findMany.mockRejectedValue(new Error("down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getPublishedStories()).toEqual([]);
    spy.mockRestore();
  });
});
