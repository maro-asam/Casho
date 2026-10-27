import { describe, expect, it } from "vitest";
import { BENEFITS, BENEFIT_KEYS, INVESTMENT_TRACK_ACTIVE, RUBRIC } from "./catalog";
import {
  DEFAULT_PROGRAM,
  acceptingApplications,
  availableTracks,
  canApplyAgain,
  canApproveStory,
  canChangeApplicationStatus,
  canMoveStory,
  canPublishStory,
  canRecordConsent,
  canSavePlan,
  scoreErrors,
  scoreTotal,
  statusAfterContentEdit,
  storySlug,
  type StoryState,
} from "./workflow";

const story = (over: Partial<StoryState> = {}): StoryState => ({
  status: "IN_REVIEW",
  consentGivenAt: new Date("2026-10-01"),
  consentRevokedAt: null,
  approvedAt: null,
  title: "Title",
  summary: "A summary that is long enough to publish.",
  businessName: "Nour",
  industry: "Fashion",
  slug: "nour",
  ...over,
});

describe("Casho Investment stays inactive", () => {
  it("is flagged off and never offered as a track", () => {
    expect(INVESTMENT_TRACK_ACTIVE).toBe(false);
    expect(availableTracks({ applicationsOpen: true, benefitsAvailable: true, growthAvailable: true })).toEqual(["BENEFITS", "GROWTH"]);
  });

  it("has no benefits in the catalog", () => {
    expect(BENEFIT_KEYS.every((k) => BENEFITS[k].track === "BENEFITS" || BENEFITS[k].track === "GROWTH")).toBe(true);
  });

  it("can't be used as a support plan track", () => {
    const gate = canSavePlan({ applicationStatus: "ACCEPTED", track: "INVESTMENT", program: DEFAULT_PROGRAM });
    expect(gate.ok).toBe(false);
  });
});

describe("program switches", () => {
  it("closes applications when no track is available", () => {
    expect(acceptingApplications({ applicationsOpen: true, benefitsAvailable: false, growthAvailable: false })).toBe(false);
    expect(acceptingApplications({ applicationsOpen: false, benefitsAvailable: true, growthAvailable: true })).toBe(false);
    expect(acceptingApplications(DEFAULT_PROGRAM)).toBe(true);
  });

  it("blocks new plans on a closed track but keeps an existing plan editable", () => {
    const program = { applicationsOpen: true, benefitsAvailable: true, growthAvailable: false };
    expect(canSavePlan({ applicationStatus: "ACCEPTED", track: "GROWTH", program }).ok).toBe(false);
    expect(canSavePlan({ applicationStatus: "ACCEPTED", track: "GROWTH", program, existingTrack: "GROWTH" }).ok).toBe(true);
  });

  it("only plans for accepted applications", () => {
    expect(canSavePlan({ applicationStatus: "UNDER_REVIEW", track: "BENEFITS", program: DEFAULT_PROGRAM }).ok).toBe(false);
  });
});

describe("application status transitions", () => {
  it("allows the review path and decisions", () => {
    expect(canChangeApplicationStatus({ from: "SUBMITTED", to: "UNDER_REVIEW", hasPlan: false, hasStory: false }).ok).toBe(true);
    expect(canChangeApplicationStatus({ from: "UNDER_REVIEW", to: "ACCEPTED", hasPlan: false, hasStory: false }).ok).toBe(true);
    expect(canChangeApplicationStatus({ from: "INTERVIEW", to: "REJECTED", hasPlan: false, hasStory: false }).ok).toBe(true);
  });

  it("can't accept straight from a fresh submission (must be reviewed)", () => {
    expect(canChangeApplicationStatus({ from: "SUBMITTED", to: "ACCEPTED", hasPlan: false, hasStory: false }).ok).toBe(false);
  });

  it("requires the question when requesting information", () => {
    expect(canChangeApplicationStatus({ from: "UNDER_REVIEW", to: "INFO_REQUESTED", hasPlan: false, hasStory: false, message: " " }).ok).toBe(false);
    expect(canChangeApplicationStatus({ from: "UNDER_REVIEW", to: "INFO_REQUESTED", hasPlan: false, hasStory: false, message: "Revenue?" }).ok).toBe(true);
  });

  it("won't reopen an accepted business that already has a plan or story", () => {
    expect(canChangeApplicationStatus({ from: "ACCEPTED", to: "UNDER_REVIEW", hasPlan: true, hasStory: false }).ok).toBe(false);
    expect(canChangeApplicationStatus({ from: "ACCEPTED", to: "UNDER_REVIEW", hasPlan: false, hasStory: true }).ok).toBe(false);
    expect(canChangeApplicationStatus({ from: "ACCEPTED", to: "UNDER_REVIEW", hasPlan: false, hasStory: false }).ok).toBe(true);
  });

  it("lets a store apply again only after every earlier application was not selected", () => {
    expect(canApplyAgain([])).toBe(true);
    expect(canApplyAgain(["REJECTED"])).toBe(true);
    expect(canApplyAgain(["REJECTED", "WAITLISTED"])).toBe(false);
    expect(canApplyAgain(["ACCEPTED"])).toBe(false);
  });
});

describe("scoring", () => {
  it("totals 100 at full marks", () => {
    const full = Object.fromEntries(RUBRIC.map((c) => [c.key, c.max])) as Parameters<typeof scoreTotal>[0];
    expect(scoreTotal(full)).toBe(100);
    expect(scoreErrors(full)).toEqual({});
  });

  it("rejects out-of-range and fractional scores", () => {
    const errs = scoreErrors({ product: 21, demand: -1, founder: 2.5, growth: 15, experience: 10, clarity: 15 });
    expect(Object.keys(errs).sort()).toEqual(["demand", "founder", "product"]);
  });
});

describe("story publication gates", () => {
  it("needs consent before production", () => {
    expect(canMoveStory(story({ status: "CONSENT_RECORDED", consentGivenAt: null }), "IN_PRODUCTION").ok).toBe(false);
    expect(canMoveStory(story({ status: "CONSENT_RECORDED" }), "IN_PRODUCTION").ok).toBe(true);
  });

  it("never reaches APPROVED or PUBLISHED through a manual move", () => {
    expect(canMoveStory(story({ status: "IN_REVIEW" }), "APPROVED").ok).toBe(false);
    expect(canMoveStory(story({ status: "APPROVED" }), "PUBLISHED").ok).toBe(false);
    expect(canMoveStory(story({ status: "PROPOSED" }), "CONSENT_RECORDED").ok).toBe(false);
  });

  it("records consent only before production", () => {
    expect(canRecordConsent(story({ status: "AWAITING_CONSENT" })).ok).toBe(true);
    expect(canRecordConsent(story({ status: "IN_PRODUCTION" })).ok).toBe(false);
  });

  it("approves only reviewed, consented, complete stories", () => {
    expect(canApproveStory(story()).ok).toBe(true);
    expect(canApproveStory(story({ consentRevokedAt: new Date() })).ok).toBe(false);
    expect(canApproveStory(story({ summary: "short" })).ok).toBe(false);
    expect(canApproveStory(story({ status: "IN_PRODUCTION" })).ok).toBe(false);
  });

  it("publishes only with approval, valid consent and an accepted application", () => {
    const approved = story({ status: "APPROVED", approvedAt: new Date() });
    expect(canPublishStory(approved, "ACCEPTED").ok).toBe(true);
    expect(canPublishStory({ ...approved, approvedAt: null }, "ACCEPTED").ok).toBe(false);
    expect(canPublishStory({ ...approved, consentRevokedAt: new Date() }, "ACCEPTED").ok).toBe(false);
    expect(canPublishStory({ ...approved, consentGivenAt: null }, "ACCEPTED").ok).toBe(false);
    expect(canPublishStory(approved, "WAITLISTED").ok).toBe(false);
    expect(canPublishStory(story({ status: "IN_REVIEW", approvedAt: new Date() }), "ACCEPTED").ok).toBe(false);
  });

  it("sends an edited approved story back to review and refuses edits while published", () => {
    expect(statusAfterContentEdit("APPROVED")).toEqual({ allowed: true, status: "IN_REVIEW", clearsApproval: true });
    expect(statusAfterContentEdit("UNPUBLISHED")).toEqual({ allowed: true, status: "IN_REVIEW", clearsApproval: true });
    expect(statusAfterContentEdit("PUBLISHED").allowed).toBe(false);
    expect(statusAfterContentEdit("IN_PRODUCTION")).toEqual({ allowed: true, status: "IN_PRODUCTION", clearsApproval: false });
  });
});

describe("storySlug", () => {
  it("makes URL slugs and falls back for Arabic or reserved names", () => {
    expect(storySlug("Nour Studio!", "x-1")).toBe("nour-studio");
    expect(storySlug("متجر نور", "story-abc")).toBe("story-abc");
    expect(storySlug("apply", "story-abc")).toBe("story-abc");
  });
});
