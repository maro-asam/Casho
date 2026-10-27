import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  sharksApplication: { updateMany: vi.fn(async () => ({ count: 1 })), update: vi.fn() },
  sharksApplicationEvent: { create: vi.fn() },
  sharksEvaluation: { upsert: vi.fn() },
  sharksSupportPlan: { upsert: vi.fn() },
  sharksStory: { create: vi.fn(async () => ({ id: "story1" })), update: vi.fn(), updateMany: vi.fn(async () => ({ count: 1 })) },
};
const prismaMock = {
  ...tx,
  sharksApplication: { ...tx.sharksApplication, findUnique: vi.fn(), count: vi.fn(async () => 1) },
  sharksStory: { ...tx.sharksStory, findUnique: vi.fn(), count: vi.fn(async () => 0) },
  sharksSupportPlan: { ...tx.sharksSupportPlan, findUnique: vi.fn() },
  sharksPlanTask: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  sharksProgram: { upsert: vi.fn() },
  user: { findFirst: vi.fn() },
  $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/actions/admin/admin-guard.actions", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/sharks/program", () => ({ getSharksProgram: vi.fn(async () => ({ applicationsOpen: true, benefitsAvailable: true, growthAvailable: true })) }));
vi.mock("@/lib/sharks/notify", () => ({ notifyApplicant: vi.fn() }));

const { requireAdmin } = await import("@/actions/admin/admin-guard.actions");
const { notifyApplicant } = await import("@/lib/sharks/notify");
const actions = await import("./sharks.actions");

const APP = "33333333-3333-4333-8333-333333333333";
const STORY = "44444444-4444-4444-8444-444444444444";
const PLAN = "55555555-5555-4555-8555-555555555555";

const story = (over: Record<string, unknown> = {}) => ({
  id: STORY,
  slug: "nour",
  status: "APPROVED",
  consentGivenAt: new Date("2026-10-01"),
  consentRevokedAt: null,
  approvedAt: new Date("2026-10-02"),
  title: "Nour",
  summary: "A summary that is long enough to publish.",
  businessName: "Nour",
  industry: "Fashion",
  videoUrl: null,
  applicationId: APP,
  application: { status: "ACCEPTED" },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAdmin).mockResolvedValue({ id: "admin1", email: "a@x.com", role: "ADMIN" } as never);
});

describe("every Sharks admin action requires an admin", () => {
  const calls: [string, () => Promise<unknown>][] = [
    ["setSharksApplicationStatusAction", () => actions.setSharksApplicationStatusAction({ applicationId: APP, status: "ACCEPTED" })],
    ["addSharksNoteAction", () => actions.addSharksNoteAction({ applicationId: APP, message: "note" })],
    ["saveSharksEvaluationAction", () => actions.saveSharksEvaluationAction({ applicationId: APP, product: 1, demand: 1, founder: 1, growth: 1, experience: 1, clarity: 1 })],
    ["recordSharksInterviewAction", () => actions.recordSharksInterviewAction({ applicationId: APP })],
    ["saveSharksPlanAction", () => actions.saveSharksPlanAction({ applicationId: APP, track: "BENEFITS", benefits: ["store_setup"], scope: "scope of work", status: "PLANNED" })],
    ["addSharksTaskAction", () => actions.addSharksTaskAction({ planId: PLAN, title: "task", isMilestone: false })],
    ["setSharksTaskStatusAction", () => actions.setSharksTaskStatusAction({ taskId: PLAN, status: "DONE" })],
    ["addSharksProgressNoteAction", () => actions.addSharksProgressNoteAction({ applicationId: APP, message: "progress" })],
    ["createSharksStoryAction", () => actions.createSharksStoryAction({ applicationId: APP })],
    ["updateSharksStoryAction", () => actions.updateSharksStoryAction({ storyId: STORY })],
    ["moveSharksStoryAction", () => actions.moveSharksStoryAction({ storyId: STORY, status: "ARCHIVED" })],
    ["recordSharksConsentAction", () => actions.recordSharksConsentAction({ storyId: STORY })],
    ["revokeSharksConsentAction", () => actions.revokeSharksConsentAction({ storyId: STORY, reason: "asked" })],
    ["approveSharksStoryAction", () => actions.approveSharksStoryAction({ storyId: STORY })],
    ["publishSharksStoryAction", () => actions.publishSharksStoryAction({ storyId: STORY })],
    ["unpublishSharksStoryAction", () => actions.unpublishSharksStoryAction({ storyId: STORY })],
    ["setSharksVideoPublishedAction", () => actions.setSharksVideoPublishedAction({ storyId: STORY, published: true })],
    ["updateSharksProgramAction", () => actions.updateSharksProgramAction({ applicationsOpen: true, benefitsAvailable: true, growthAvailable: true })],
  ];

  it.each(calls)("%s rejects a non-admin before touching the DB", async (_name, call) => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error("Unauthorized"));
    await expect(call()).rejects.toThrow("Unauthorized");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.sharksApplication.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.sharksStory.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.sharksProgram.upsert).not.toHaveBeenCalled();
  });
});

describe("application decisions", () => {
  it("records who decided and when, logs it, and notifies the applicant", async () => {
    prismaMock.sharksApplication.findUnique.mockResolvedValue({ id: APP, status: "UNDER_REVIEW", storeId: "store1", plan: null, story: null });
    const res = await actions.setSharksApplicationStatusAction({ applicationId: APP, status: "ACCEPTED" });
    expect(res.success).toBe(true);
    expect(tx.sharksApplication.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: APP, status: "UNDER_REVIEW" }, data: expect.objectContaining({ status: "ACCEPTED", decidedById: "admin1", decidedAt: expect.any(Date) }) }),
    );
    expect(tx.sharksApplicationEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ kind: "STATUS_CHANGE", fromStatus: "UNDER_REVIEW", toStatus: "ACCEPTED", actorId: "admin1" }) }));
    expect(notifyApplicant).toHaveBeenCalled();
  });

  it("rejects transitions the workflow doesn't allow", async () => {
    prismaMock.sharksApplication.findUnique.mockResolvedValue({ id: APP, status: "SUBMITTED", storeId: "store1", plan: null, story: null });
    const res = await actions.setSharksApplicationStatusAction({ applicationId: APP, status: "ACCEPTED" });
    expect(res.success).toBe(false);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("support plans can't express funding", () => {
  it("refuses an investment track", async () => {
    prismaMock.sharksApplication.findUnique.mockResolvedValue({ id: APP, status: "ACCEPTED", plan: null });
    const res = await actions.saveSharksPlanAction({ applicationId: APP, track: "INVESTMENT", benefits: ["store_setup"], scope: "scope of work", status: "PLANNED" });
    expect(res.success).toBe(false);
    expect(tx.sharksSupportPlan.upsert).not.toHaveBeenCalled();
  });

  it("refuses benefits that aren't in the catalog", async () => {
    const res = await actions.saveSharksPlanAction({ applicationId: APP, track: "BENEFITS", benefits: ["cash_grant"], scope: "scope of work", status: "PLANNED" });
    expect(res.success).toBe(false);
    expect(prismaMock.sharksApplication.findUnique).not.toHaveBeenCalled();
  });

  it("refuses plans for applications that weren't accepted", async () => {
    prismaMock.sharksApplication.findUnique.mockResolvedValue({ id: APP, status: "WAITLISTED", plan: null });
    const res = await actions.saveSharksPlanAction({ applicationId: APP, track: "BENEFITS", benefits: ["store_setup"], scope: "scope of work", status: "PLANNED" });
    expect(res.success).toBe(false);
  });

  it("saves an agreed Benefits plan", async () => {
    prismaMock.sharksApplication.findUnique.mockResolvedValue({ id: APP, status: "ACCEPTED", plan: null });
    const res = await actions.saveSharksPlanAction({ applicationId: APP, track: "BENEFITS", benefits: ["store_setup", "pos_setup"], scope: "Set up the store together", status: "PLANNED" });
    expect(res.success).toBe(true);
    expect(tx.sharksSupportPlan.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ track: "BENEFITS", createdById: "admin1" }) }));
  });
});

describe("story publication", () => {
  it("publishes an approved, consented story", async () => {
    prismaMock.sharksStory.findUnique.mockResolvedValue(story());
    const res = await actions.publishSharksStoryAction({ storyId: STORY });
    expect(res.success).toBe(true);
    expect(tx.sharksStory.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ approvedAt: { not: null }, consentRevokedAt: null }), data: expect.objectContaining({ status: "PUBLISHED" }) }),
    );
  });

  it.each([
    ["without consent", { consentGivenAt: null }],
    ["after consent was revoked", { consentRevokedAt: new Date() }],
    ["without approval", { status: "IN_REVIEW", approvedAt: null }],
    ["when the application isn't accepted", { application: { status: "REJECTED" } }],
  ])("refuses to publish %s", async (_label, over) => {
    prismaMock.sharksStory.findUnique.mockResolvedValue(story(over));
    const res = await actions.publishSharksStoryAction({ storyId: STORY });
    expect(res.success).toBe(false);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("can't approve without consent", async () => {
    prismaMock.sharksStory.findUnique.mockResolvedValue(story({ status: "IN_REVIEW", approvedAt: null, consentGivenAt: null }));
    expect((await actions.approveSharksStoryAction({ storyId: STORY })).success).toBe(false);
  });

  it("revoking consent takes a published story down and switches the video off", async () => {
    prismaMock.sharksStory.findUnique.mockResolvedValue(story({ status: "PUBLISHED" }));
    const res = await actions.revokeSharksConsentAction({ storyId: STORY, reason: "owner asked" });
    expect(res.success).toBe(true);
    expect(tx.sharksStory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "AWAITING_CONSENT", approvedAt: null, videoPublished: false, consentRevokedAt: expect.any(Date), unpublishedAt: expect.any(Date) }),
      }),
    );
  });

  it("won't edit a published story and drops approval when an approved one is edited", async () => {
    const content = { storyId: STORY, slug: "nour", title: "Nour", businessName: "Nour", industry: "Fashion", summary: "", showTrack: true };
    prismaMock.sharksStory.findUnique.mockResolvedValue(story({ status: "PUBLISHED" }));
    expect((await actions.updateSharksStoryAction(content)).success).toBe(false);

    prismaMock.sharksStory.findUnique.mockResolvedValue(story({ status: "APPROVED" }));
    expect((await actions.updateSharksStoryAction(content)).success).toBe(true);
    expect(tx.sharksStory.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "IN_REVIEW", approvedAt: null }) }));
  });

  it("creates stories only for accepted applications", async () => {
    prismaMock.sharksApplication.findUnique.mockResolvedValue({ id: APP, status: "UNDER_REVIEW", businessName: "Nour", industry: "Fashion", story: null });
    expect((await actions.createSharksStoryAction({ applicationId: APP })).success).toBe(false);
    expect(tx.sharksStory.create).not.toHaveBeenCalled();
  });

  it("publishes a video only with a valid link and consent", async () => {
    prismaMock.sharksStory.findUnique.mockResolvedValue(story({ videoUrl: "https://example.com/x" }));
    expect((await actions.setSharksVideoPublishedAction({ storyId: STORY, published: true })).success).toBe(false);
    prismaMock.sharksStory.findUnique.mockResolvedValue(story({ videoUrl: "https://youtu.be/abcDEF12345", consentRevokedAt: new Date() }));
    expect((await actions.setSharksVideoPublishedAction({ storyId: STORY, published: true })).success).toBe(false);
    prismaMock.sharksStory.findUnique.mockResolvedValue(story({ videoUrl: "https://youtu.be/abcDEF12345" }));
    expect((await actions.setSharksVideoPublishedAction({ storyId: STORY, published: true })).success).toBe(true);
  });
});
