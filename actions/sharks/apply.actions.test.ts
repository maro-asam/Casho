import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  $queryRaw: vi.fn(async () => [{ id: "locked" }]),
  sharksApplication: { findMany: vi.fn(async (): Promise<{ status: string }[]> => []), create: vi.fn(async () => ({ id: "app1" })), updateMany: vi.fn(async () => ({ count: 1 })) },
  sharksApplicationEvent: { create: vi.fn(), createMany: vi.fn() },
};
const prismaMock = {
  user: { findUnique: vi.fn() },
  store: { findFirst: vi.fn() },
  sharksApplication: { findUnique: vi.fn(), findFirst: vi.fn() },
  $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/actions/auth/require-user-id.actions", () => ({ requireUserId: vi.fn() }));
vi.mock("@/lib/sharks/program", () => ({ getSharksProgram: vi.fn() }));
vi.mock("@/lib/sharks/notify", () => ({ notifyApplicant: vi.fn() }));

const { requireUserId } = await import("@/actions/auth/require-user-id.actions");
const { getSharksProgram } = await import("@/lib/sharks/program");
const { notifyApplicant } = await import("@/lib/sharks/notify");
const { submitSharksApplicationAction, replyToSharksInfoRequestAction } = await import("./apply.actions");

const STORE = "11111111-1111-4111-8111-111111111111";
const APP = "33333333-3333-4333-8333-333333333333";
const input = {
  storeId: STORE,
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
  investmentInterest: true,
  supportGoal: "Better product photos and a faster checkout for mobile customers.",
  links: [],
  termsAccepted: true,
  marketingOptIn: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUserId).mockResolvedValue("owner1");
  vi.mocked(getSharksProgram).mockResolvedValue({ applicationsOpen: true, benefitsAvailable: true, growthAvailable: false });
  prismaMock.user.findUnique.mockResolvedValue({ emailVerified: true, mustVerifyEmail: false });
  prismaMock.sharksApplication.findUnique.mockResolvedValue(null);
  prismaMock.store.findFirst.mockResolvedValue({ id: STORE });
  tx.sharksApplication.findMany.mockResolvedValue([]);
});

describe("submitSharksApplicationAction", () => {
  it("requires a session before anything else", async () => {
    vi.mocked(requireUserId).mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(submitSharksApplicationAction(input)).rejects.toThrow();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("creates the application for the owner's own store and notifies them", async () => {
    const res = await submitSharksApplicationAction(input);
    expect(res.success).toBe(true);
    expect(prismaMock.store.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: STORE, userId: "owner1" } }));
    expect(tx.sharksApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ storeId: STORE, userId: "owner1", investmentInterest: true, marketingOptIn: false, marketingOptInAt: null }) }),
    );
    expect(notifyApplicant).toHaveBeenCalledWith(expect.objectContaining({ kind: "submitted" }));
  });

  it("refuses a store the user doesn't own (no cross-tenant applications)", async () => {
    prismaMock.store.findFirst.mockResolvedValue(null);
    const res = await submitSharksApplicationAction(input);
    expect(res.success).toBe(false);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuses when applications are closed or the track is closed", async () => {
    vi.mocked(getSharksProgram).mockResolvedValue({ applicationsOpen: false, benefitsAvailable: true, growthAvailable: true });
    expect((await submitSharksApplicationAction(input)).success).toBe(false);
    vi.mocked(getSharksProgram).mockResolvedValue({ applicationsOpen: true, benefitsAvailable: true, growthAvailable: false });
    expect((await submitSharksApplicationAction({ ...input, requestedTracks: ["GROWTH"] })).success).toBe(false);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuses unverified new accounts", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ emailVerified: false, mustVerifyEmail: true });
    expect((await submitSharksApplicationAction(input)).success).toBe(false);
  });

  it("refuses a second open application for the same store", async () => {
    tx.sharksApplication.findMany.mockResolvedValue([{ status: "UNDER_REVIEW" }]);
    const res = await submitSharksApplicationAction(input);
    expect(res.success).toBe(false);
    expect(tx.sharksApplication.create).not.toHaveBeenCalled();
  });

  it("treats a repeated submission key as the same submission", async () => {
    prismaMock.sharksApplication.findUnique.mockResolvedValue({ id: "app1", userId: "owner1" });
    const res = await submitSharksApplicationAction(input);
    expect(res).toMatchObject({ success: true, applicationId: "app1" });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("validates on the server too", async () => {
    const res = await submitSharksApplicationAction({ ...input, termsAccepted: false, challenge: "" });
    expect(res.success).toBe(false);
    expect(res.fieldErrors).toHaveProperty("termsAccepted");
    expect(res.fieldErrors).toHaveProperty("challenge");
  });
});

describe("replyToSharksInfoRequestAction", () => {
  it("only finds applications of the signed-in owner's stores", async () => {
    prismaMock.sharksApplication.findFirst.mockResolvedValue(null);
    const res = await replyToSharksInfoRequestAction({ applicationId: APP, message: "Here are the numbers" });
    expect(res.success).toBe(false);
    expect(prismaMock.sharksApplication.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: APP, store: { userId: "owner1" } } }));
  });

  it("moves the application back to review with a visible reply", async () => {
    prismaMock.sharksApplication.findFirst.mockResolvedValue({ id: APP, status: "INFO_REQUESTED" });
    const res = await replyToSharksInfoRequestAction({ applicationId: APP, message: "Here are the numbers" });
    expect(res.success).toBe(true);
    expect(tx.sharksApplication.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: APP, status: "INFO_REQUESTED" }, data: { status: "UNDER_REVIEW", infoRequest: null } }));
  });

  it("refuses when no question is open", async () => {
    prismaMock.sharksApplication.findFirst.mockResolvedValue({ id: APP, status: "UNDER_REVIEW" });
    expect((await replyToSharksInfoRequestAction({ applicationId: APP, message: "Hello there" })).success).toBe(false);
  });
});
