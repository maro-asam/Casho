import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }));

const { prisma } = await import("@/lib/prisma");
const { resolveSignupReferral, createSignupAttribution, resolveFirstReferral, readSignupFormReferral } = await import("./attribution");

function referrer(value: unknown) {
  vi.mocked(prisma.user.findUnique).mockResolvedValue(value as never);
}

beforeEach(() => vi.clearAllMocks());

describe("resolveSignupReferral — server-side validation", () => {
  it("missing or malformed codes are ignored without a DB lookup", async () => {
    await expect(resolveSignupReferral(undefined)).resolves.toBeNull();
    await expect(resolveSignupReferral("")).resolves.toBeNull();
    await expect(resolveSignupReferral("<script>")).resolves.toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("an unknown code attributes nobody", async () => {
    referrer(null);
    await expect(resolveSignupReferral("NOPE1234")).resolves.toBeNull();
  });

  it("an active sales rep's code yields a sales attribution", async () => {
    referrer({ id: "repUser", role: "SALES", salesRep: { id: "rep1", status: "ACTIVE" } });
    await expect(resolveSignupReferral(" abcd1234 ")).resolves.toEqual({ code: "ABCD1234", referrerUserId: "repUser", salesRepId: "rep1" });
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { referralCode: "ABCD1234" } }));
  });

  it("a disabled rep's link no longer attributes anyone", async () => {
    referrer({ id: "repUser", role: "SALES", salesRep: { id: "rep1", status: "DISABLED" } });
    await expect(resolveSignupReferral("ABCD1234")).resolves.toBeNull();
  });

  it("a merchant's code keeps the existing merchant referral program and creates no sales attribution", async () => {
    referrer({ id: "merchant", role: "USER", salesRep: null });
    await expect(resolveSignupReferral("ABCD1234")).resolves.toEqual({ code: "ABCD1234", referrerUserId: "merchant", salesRepId: null });
  });
});

describe("createSignupAttribution", () => {
  it("creates exactly one SIGNUP_LINK attribution for a sales referral", async () => {
    const tx = { salesAttribution: { create: vi.fn() } };
    const signedUpAt = new Date("2026-10-12Z");
    await createSignupAttribution(tx as never, {
      customerUserId: "newUser",
      referral: { code: "ABCD1234", referrerUserId: "repUser", salesRepId: "rep1" },
      signedUpAt,
    });
    expect(tx.salesAttribution.create).toHaveBeenCalledWith({
      data: {
        customerUserId: "newUser",
        salesRepId: "rep1",
        originalSalesRepId: "rep1",
        source: "SIGNUP_LINK",
        referralCode: "ABCD1234",
        signedUpAt,
      },
    });
  });

  it("does nothing for merchant referrals or no referral", async () => {
    const tx = { salesAttribution: { create: vi.fn() } };
    await createSignupAttribution(tx as never, { customerUserId: "u", referral: null, signedUpAt: new Date() });
    await createSignupAttribution(tx as never, {
      customerUserId: "u",
      referral: { code: "X1234567", referrerUserId: "m", salesRepId: null },
      signedUpAt: new Date(),
    });
    expect(tx.salesAttribution.create).not.toHaveBeenCalled();
  });
});

describe("remembered referral codes", () => {
  const rep = { id: "repUser", role: "SALES", salesRep: { id: "rep1", status: "ACTIVE" } };
  const form = (fields: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    return fd;
  };

  it("resolveFirstReferral falls through a dead link code to the remembered one", async () => {
    vi.mocked(prisma.user.findUnique).mockImplementation((async (args: { where: { referralCode: string } }) =>
      args.where.referralCode === "GOOD1234" ? rep : null) as never);
    await expect(resolveFirstReferral("DEAD1234", "good1234")).resolves.toMatchObject({ code: "GOOD1234", salesRepId: "rep1" });
    await expect(resolveFirstReferral(undefined, "")).resolves.toBeNull();
  });

  it("a form without the code field falls back to the cookie", async () => {
    referrer(rep);
    await expect(readSignupFormReferral(form({}), "ABCD1234")).resolves.toMatchObject({ ok: true, referral: { salesRepId: "rep1" } });
  });

  it("an emptied field means no referral, even with a remembered cookie", async () => {
    await expect(readSignupFormReferral(form({ refCode: " " }), "ABCD1234")).resolves.toEqual({ ok: true, referral: null });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("a typed code that doesn't resolve is an error, not a silent loss", async () => {
    referrer(null);
    await expect(readSignupFormReferral(form({ refCode: "TYPO1234" }), undefined)).resolves.toMatchObject({ ok: false });
  });
});
