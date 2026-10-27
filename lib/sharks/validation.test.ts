import { describe, expect, it } from "vitest";
import { applicationSchema, planSchema, storyContentSchema } from "./validation";

const valid = {
  storeId: "11111111-1111-4111-8111-111111111111",
  submissionKey: "22222222-2222-4222-8222-222222222222",
  businessName: "Nour",
  storeUrl: "https://nour.casho.store",
  industry: "Fashion",
  description: "Handmade cotton clothes for kids, sold online and at a small shop.",
  operatingSince: "1to3y",
  offering: "Cotton kids clothes",
  customers: "Parents in Cairo and Alexandria",
  challenge: "Our repeat customers are growing but we can't keep up with photography.",
  traction: "Around 80 orders a month",
  potential: "Customers keep coming back and recommending us to friends.",
  requestedTracks: ["BENEFITS"],
  investmentInterest: false,
  supportGoal: "Better product photos and a faster checkout for mobile customers.",
  links: [],
  termsAccepted: true,
  marketingOptIn: false,
};

describe("applicationSchema", () => {
  it("accepts a complete application", () => {
    expect(applicationSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the terms and at least one track", () => {
    expect(applicationSchema.safeParse({ ...valid, termsAccepted: false }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...valid, requestedTracks: [] }).success).toBe(false);
  });

  it("can't request an investment track", () => {
    expect(applicationSchema.safeParse({ ...valid, requestedTracks: ["INVESTMENT"] }).success).toBe(false);
  });

  it("rejects non-http links and more than five", () => {
    expect(applicationSchema.safeParse({ ...valid, links: ["javascript:alert(1)"] }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...valid, links: Array(6).fill("https://x.com") }).success).toBe(false);
  });

  it("caps long answers", () => {
    expect(applicationSchema.safeParse({ ...valid, challenge: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("planSchema", () => {
  it("rejects benefits outside the catalog and an end before the start", () => {
    const base = { applicationId: valid.storeId, track: "BENEFITS", benefits: ["store_setup"], scope: "Set up the store together", status: "PLANNED" };
    expect(planSchema.safeParse(base).success).toBe(true);
    expect(planSchema.safeParse({ ...base, benefits: ["cash_grant"] }).success).toBe(false);
    expect(planSchema.safeParse({ ...base, startsOn: "2026-11-10", endsOn: "2026-11-01" }).success).toBe(false);
  });
});

describe("storyContentSchema", () => {
  const base = { storyId: valid.storeId, slug: "nour", title: "Nour", businessName: "Nour", industry: "Fashion", summary: "", showTrack: true };
  it("validates slugs and video links", () => {
    expect(storyContentSchema.safeParse(base).success).toBe(true);
    expect(storyContentSchema.safeParse({ ...base, slug: "Nour Studio" }).success).toBe(false);
    expect(storyContentSchema.safeParse({ ...base, slug: "apply" }).success).toBe(false);
    expect(storyContentSchema.safeParse({ ...base, videoUrl: "https://example.com/x" }).success).toBe(false);
    expect(storyContentSchema.safeParse({ ...base, videoUrl: "https://youtu.be/abcDEF12345" }).success).toBe(true);
  });
});
