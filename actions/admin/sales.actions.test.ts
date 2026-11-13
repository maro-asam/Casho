import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  $queryRaw: vi.fn(async () => [{ id: "locked" }]),
  user: { create: vi.fn(async () => ({ id: "newRepUser", referralCode: "CODE1234" })), update: vi.fn() },
  salesRep: { create: vi.fn(async () => ({ id: "rep1" })), update: vi.fn() },
  session: { deleteMany: vi.fn() },
  salesAttribution: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), create: vi.fn(async () => ({ id: "att1", salesRepId: "repB" })), update: vi.fn() },
  salesAttributionChange: { create: vi.fn() },
  salesCommission: { updateMany: vi.fn(async () => ({ count: 1 })), findUniqueOrThrow: vi.fn() },
  salesCommissionAdjustment: { create: vi.fn(async () => ({ id: "adj1" })), updateMany: vi.fn() },
  salesPayout: { create: vi.fn(async () => ({ id: "payout1" })) },
  salesAuditLog: { create: vi.fn() },
  salesCommissionRule: { create: vi.fn(async () => ({ id: "rule2" })) },
  salesRepAdjustment: { create: vi.fn(async () => ({ id: "radj1" })), updateMany: vi.fn(async () => ({ count: 1 })) },
  passwordResetToken: { deleteMany: vi.fn() },
  emailVerificationCode: { deleteMany: vi.fn() },
};
const prismaMock = {
  ...tx,
  user: { ...tx.user, findFirst: vi.fn() },
  salesRep: { ...tx.salesRep, findUnique: vi.fn() },
  salesCommission: { ...tx.salesCommission, findUnique: vi.fn() },
  salesRepAdjustment: { ...tx.salesRepAdjustment, findUnique: vi.fn() },
  $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./admin-guard.actions", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn(async () => "hashed") }));
vi.mock("@/lib/sales/engine", () => ({ syncSalesCommissionsForCustomer: vi.fn(async () => ({ commissions: 0, adjustments: 0 })) }));
vi.mock("@/lib/sales/queries", () => ({ getPayableItems: vi.fn() }));

const { requireAdmin } = await import("./admin-guard.actions");
const { getPayableItems } = await import("@/lib/sales/queries");
const actions = await import("./sales.actions");

const REP_A = "11111111-1111-4111-8111-111111111111";
const REP_B = "22222222-2222-4222-8222-222222222222";
const CUSTOMER = "33333333-3333-4333-8333-333333333333";
const COMMISSION = "44444444-4444-4444-8444-444444444444";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAdmin).mockResolvedValue({ id: "admin1", email: "a@x.com", role: "ADMIN" } as never);
});

describe("every admin sales action requires an admin", () => {
  const calls: [string, () => Promise<unknown>][] = [
    ["createSalesRepAction", () => actions.createSalesRepAction({ name: "Rep", email: "rep@x.com", password: "password1" })],
    ["updateSalesRepAction", () => actions.updateSalesRepAction({ salesRepId: REP_A, name: "Rep" })],
    ["setSalesRepStatusAction", () => actions.setSalesRepStatusAction({ salesRepId: REP_A, status: "DISABLED", reason: "left team" })],
    ["assignCustomerToSalesRepAction", () => actions.assignCustomerToSalesRepAction({ customerUserId: CUSTOMER, toSalesRepId: REP_A, reason: "dispute ok" })],
    ["updateCommissionStatusAction", () => actions.updateCommissionStatusAction({ commissionId: COMMISSION, action: "approve" })],
    ["createCommissionAdjustmentAction", () => actions.createCommissionAdjustmentAction({ commissionId: COMMISSION, amountEgp: -5, reason: "clawback x" })],
    ["createRepAdjustmentAction", () => actions.createRepAdjustmentAction({ salesRepId: REP_A, kind: "BONUS", amountEgp: 100, reason: "best month" })],
    ["cancelRepAdjustmentAction", () => actions.cancelRepAdjustmentAction({ adjustmentId: COMMISSION, reason: "entered twice" })],
    ["recordSalesPayoutAction", () => actions.recordSalesPayoutAction({ salesRepId: REP_A, expectedTotal: 100, paidAt: "2026-10-01", method: "bank" })],
    ["updateCommissionRulesAction", () => actions.updateCommissionRulesAction({})],
  ];

  it.each(calls)("%s rejects a non-admin before touching the DB", async (_name, call) => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error("Unauthorized"));
    await expect(call()).rejects.toThrow("Unauthorized");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.salesRep.findUnique).not.toHaveBeenCalled();
  });
});

describe("createSalesRepAction — the only path to the SALES role", () => {
  it("creates a brand-new SALES account with a referral code and rep profile", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    const res = await actions.createSalesRepAction({ name: "Rep", email: "Rep@X.com", password: "password1" });
    expect(res.success).toBe(true);
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "rep@x.com", role: "SALES", referralCode: expect.any(String), password: "hashed" }) }),
    );
    expect(tx.salesRep.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "newRepUser", createdById: "admin1" }) }));
    expect(tx.salesAuditLog.create).toHaveBeenCalled();
  });

  it("never converts an existing account (merchant or admin)", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ email: "rep@x.com" });
    const res = await actions.createSalesRepAction({ name: "Rep", email: "rep@x.com", password: "password1" });
    expect(res.success).toBe(false);
    expect(tx.user.create).not.toHaveBeenCalled();
  });
});

describe("updateSalesRepAction — email change", () => {
  const repRow = { id: REP_A, notes: null, user: { id: "repUser", name: "Rep", email: "old@x.com", phone_number: null } };

  it("changes the login email, unlinks Google, kills old reset links, and audits old → new", async () => {
    prismaMock.salesRep.findUnique.mockResolvedValue(repRow);
    prismaMock.user.findFirst.mockResolvedValue(null);
    const res = await actions.updateSalesRepAction({ salesRepId: REP_A, name: "Rep", email: " New@X.com " });
    expect(res.success).toBe(true);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "repUser" },
      data: expect.objectContaining({ email: "new@x.com", emailVerified: false, googleId: null }),
    });
    expect(tx.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "repUser" } });
    expect(tx.emailVerificationCode.deleteMany).toHaveBeenCalledWith({ where: { userId: "repUser" } });
    expect(tx.salesAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "sales_rep_email_changed", before: expect.objectContaining({ email: "old@x.com" }), after: expect.objectContaining({ email: "new@x.com" }) }),
    });
  });

  it("refuses an email another account already uses", async () => {
    prismaMock.salesRep.findUnique.mockResolvedValue(repRow);
    prismaMock.user.findFirst.mockResolvedValue({ id: "someoneElse" });
    const res = await actions.updateSalesRepAction({ salesRepId: REP_A, name: "Rep", email: "taken@x.com" });
    expect(res.success).toBe(false);
    expect(res.fieldErrors?.email).toBeDefined();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("leaves email, Google link and reset tokens alone when the email didn't change", async () => {
    prismaMock.salesRep.findUnique.mockResolvedValue(repRow);
    const res = await actions.updateSalesRepAction({ salesRepId: REP_A, name: "Rep 2", email: "OLD@x.com" });
    expect(res.success).toBe(true);
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: "repUser" }, data: { name: "Rep 2", phone_number: null } });
    expect(tx.passwordResetToken.deleteMany).not.toHaveBeenCalled();
    expect(tx.salesAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "sales_rep_updated" }) });
  });
});

describe("createRepAdjustmentAction — bonuses and deductions", () => {
  it("stores a bonus as positive piasters and audits it", async () => {
    const res = await actions.createRepAdjustmentAction({ salesRepId: REP_A, kind: "BONUS", amountEgp: "150.5", reason: "best rep of October" });
    expect(res.success).toBe(true);
    expect(tx.salesRepAdjustment.create).toHaveBeenCalledWith({
      data: { salesRepId: REP_A, kind: "BONUS", amount: 15_050, currency: "EGP", reason: "best rep of October", actorUserId: "admin1" },
      select: { id: true },
    });
    expect(tx.salesAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "rep_bonus_added", salesRepId: REP_A }) });
  });

  it("stores a deduction as negative piasters", async () => {
    const res = await actions.createRepAdjustmentAction({ salesRepId: REP_A, kind: "DEDUCTION", amountEgp: 200, reason: "advance paid early" });
    expect(res.success).toBe(true);
    expect(tx.salesRepAdjustment.create).toHaveBeenCalledWith({ data: expect.objectContaining({ kind: "DEDUCTION", amount: -20_000 }), select: { id: true } });
  });

  it("rejects zero/negative amounts and a missing reason", async () => {
    for (const input of [
      { salesRepId: REP_A, kind: "BONUS", amountEgp: 0, reason: "valid reason" },
      { salesRepId: REP_A, kind: "DEDUCTION", amountEgp: -5, reason: "valid reason" },
      { salesRepId: REP_A, kind: "BONUS", amountEgp: 10, reason: "x" },
    ]) {
      expect((await actions.createRepAdjustmentAction(input)).success).toBe(false);
    }
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuses an unknown rep", async () => {
    tx.$queryRaw.mockResolvedValueOnce([]);
    const res = await actions.createRepAdjustmentAction({ salesRepId: REP_A, kind: "BONUS", amountEgp: 10, reason: "valid reason" });
    expect(res.success).toBe(false);
    expect(tx.salesRepAdjustment.create).not.toHaveBeenCalled();
  });
});

describe("cancelRepAdjustmentAction", () => {
  const ADJ = "55555555-5555-4555-8555-555555555555";

  it("cancels an unsettled entry conditionally and audits it", async () => {
    prismaMock.salesRepAdjustment.findUnique.mockResolvedValue({ id: ADJ, salesRepId: REP_A, kind: "DEDUCTION", amount: -500, canceledAt: null, payoutId: null });
    const res = await actions.cancelRepAdjustmentAction({ adjustmentId: ADJ, reason: "entered twice" });
    expect(res.success).toBe(true);
    expect(tx.salesRepAdjustment.updateMany).toHaveBeenCalledWith({
      where: { id: ADJ, canceledAt: null, payoutId: null },
      data: expect.objectContaining({ canceledById: "admin1", cancelReason: "entered twice" }),
    });
    expect(tx.salesAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "rep_adjustment_canceled" }) });
  });

  it("refuses an entry a payout already settled", async () => {
    prismaMock.salesRepAdjustment.findUnique.mockResolvedValue({ id: ADJ, salesRepId: REP_A, kind: "BONUS", amount: 500, canceledAt: null, payoutId: "payout1" });
    const res = await actions.cancelRepAdjustmentAction({ adjustmentId: ADJ, reason: "changed my mind" });
    expect(res.success).toBe(false);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("reports a race with a payout instead of canceling", async () => {
    prismaMock.salesRepAdjustment.findUnique.mockResolvedValue({ id: ADJ, salesRepId: REP_A, kind: "BONUS", amount: 500, canceledAt: null, payoutId: null });
    tx.salesRepAdjustment.updateMany.mockResolvedValueOnce({ count: 0 });
    const res = await actions.cancelRepAdjustmentAction({ adjustmentId: ADJ, reason: "changed my mind" });
    expect(res.success).toBe(false);
    expect(tx.salesAuditLog.create).not.toHaveBeenCalled();
  });
});

describe("setSalesRepStatusAction", () => {
  it("disabling ends all sessions and is audited with the reason", async () => {
    prismaMock.salesRep.findUnique.mockResolvedValue({ id: REP_A, status: "ACTIVE", userId: "repUser" });
    const res = await actions.setSalesRepStatusAction({ salesRepId: REP_A, status: "DISABLED", reason: "left the team" });
    expect(res.success).toBe(true);
    expect(tx.session.deleteMany).toHaveBeenCalledWith({ where: { userId: "repUser" } });
    expect(tx.salesAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "sales_rep_disabled", reason: "left the team", actorUserId: "admin1" }) });
  });
});

describe("assignCustomerToSalesRepAction — disputes", () => {
  beforeEach(() => {
    prismaMock.user.findFirst.mockResolvedValue({ id: CUSTOMER, role: "USER", createdAt: new Date("2026-01-01Z") });
    prismaMock.salesRep.findUnique.mockResolvedValue({ id: REP_B, status: "ACTIVE" });
  });

  it("requires a reason", async () => {
    const res = await actions.assignCustomerToSalesRepAction({ customerUserId: CUSTOMER, toSalesRepId: REP_B, reason: "x" });
    expect(res.success).toBe(false);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("reassigns, records previous/new rep, actor and reason, and moves no commissions", async () => {
    tx.salesAttribution.findUnique.mockResolvedValue({ id: "att1" });
    tx.salesAttribution.findUniqueOrThrow.mockResolvedValue({ id: "att1", salesRepId: REP_A });
    const res = await actions.assignCustomerToSalesRepAction({ customerUserId: CUSTOMER, toSalesRepId: REP_B, reason: "customer confirmed rep B" });
    expect(res.success).toBe(true);
    expect(tx.salesAttribution.update).toHaveBeenCalledWith({ where: { id: "att1" }, data: { salesRepId: REP_B } });
    expect(tx.salesAttributionChange.create).toHaveBeenCalledWith({
      data: { attributionId: "att1", fromSalesRepId: REP_A, toSalesRepId: REP_B, actorUserId: "admin1", reason: "customer confirmed rep B" },
    });
    expect(tx.salesCommission.updateMany).not.toHaveBeenCalled();
  });

  it("refuses to attribute admin or sales accounts", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: CUSTOMER, role: "SALES", createdAt: new Date() });
    const res = await actions.assignCustomerToSalesRepAction({ customerUserId: CUSTOMER, toSalesRepId: REP_B, reason: "self attribution" });
    expect(res.success).toBe(false);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuses a disabled target rep", async () => {
    prismaMock.salesRep.findUnique.mockResolvedValue({ id: REP_B, status: "DISABLED" });
    const res = await actions.assignCustomerToSalesRepAction({ customerUserId: CUSTOMER, toSalesRepId: REP_B, reason: "valid reason" });
    expect(res.success).toBe(false);
  });
});

describe("updateCommissionStatusAction", () => {
  it("cannot reverse a PAID commission (use an adjustment)", async () => {
    prismaMock.salesCommission.findUnique.mockResolvedValue({ id: COMMISSION, status: "PAID", salesRepId: REP_A });
    const res = await actions.updateCommissionStatusAction({ commissionId: COMMISSION, action: "reverse", reason: "refund issued" });
    expect(res.success).toBe(false);
    expect(tx.salesCommission.updateMany).not.toHaveBeenCalled();
  });

  it("hold requires a reason", async () => {
    const res = await actions.updateCommissionStatusAction({ commissionId: COMMISSION, action: "hold" });
    expect(res.success).toBe(false);
    expect(prismaMock.salesCommission.findUnique).not.toHaveBeenCalled();
  });

  it("holds conditionally on the current status and audits", async () => {
    prismaMock.salesCommission.findUnique.mockResolvedValue({ id: COMMISSION, status: "APPROVED", salesRepId: REP_A });
    const res = await actions.updateCommissionStatusAction({ commissionId: COMMISSION, action: "hold", reason: "customer dispute" });
    expect(res.success).toBe(true);
    expect(tx.salesCommission.updateMany).toHaveBeenCalledWith({
      where: { id: COMMISSION, status: { in: ["PENDING", "APPROVED"] }, payoutId: null },
      data: { status: "ON_HOLD", statusReason: "customer dispute" },
    });
    expect(tx.salesAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "commission_hold", actorUserId: "admin1" }) });
  });
});

describe("createCommissionAdjustmentAction", () => {
  it("stores signed piasters and refuses to push the net below zero", async () => {
    tx.salesCommission.findUniqueOrThrow.mockResolvedValue({ id: COMMISSION, status: "PAID", amount: 1_000, salesRepId: REP_A, adjustments: [] });
    const bad = await actions.createCommissionAdjustmentAction({ commissionId: COMMISSION, amountEgp: -10.01, reason: "too much clawback" });
    expect(bad.success).toBe(false);
    expect(tx.salesCommissionAdjustment.create).not.toHaveBeenCalled();

    const ok = await actions.createCommissionAdjustmentAction({ commissionId: COMMISSION, amountEgp: -2.5, reason: "partial clawback" });
    expect(ok.success).toBe(true);
    expect(tx.salesCommissionAdjustment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: -250, source: "ADMIN", actorUserId: "admin1", reason: "partial clawback" }),
      select: { id: true },
    });
  });
});

describe("recordSalesPayoutAction — actual payouts only", () => {
  it("refuses when the payable total changed since the admin looked", async () => {
    vi.mocked(getPayableItems).mockResolvedValue({ commissionIds: ["c1"], adjustmentIds: [], repAdjustmentIds: [], total: 5_000 });
    const res = await actions.recordSalesPayoutAction({ salesRepId: REP_A, expectedTotal: 4_000, paidAt: "2026-10-01", method: "bank" });
    expect(res.success).toBe(false);
    expect(tx.salesPayout.create).not.toHaveBeenCalled();
  });

  it("refuses future-dated payouts", async () => {
    const res = await actions.recordSalesPayoutAction({ salesRepId: REP_A, expectedTotal: 5_000, paidAt: "2999-01-01", method: "bank" });
    expect(res.success).toBe(false);
  });

  it("settles exactly the payable items and records who/when/how", async () => {
    vi.mocked(getPayableItems).mockResolvedValue({ commissionIds: ["c1", "c2"], adjustmentIds: ["a1"], repAdjustmentIds: [], total: 5_000 });
    tx.salesCommission.updateMany.mockResolvedValue({ count: 2 });
    const res = await actions.recordSalesPayoutAction({ salesRepId: REP_A, expectedTotal: 5_000, paidAt: "2026-10-01", method: "bank", reference: "TRX-1" });
    expect(res.success).toBe(true);
    expect(tx.salesPayout.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ salesRepId: REP_A, amount: 5_000, currency: "EGP", method: "bank", reference: "TRX-1", recordedById: "admin1" }),
      select: { id: true },
    });
    expect(tx.salesCommission.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["c1", "c2"] }, status: "APPROVED", payoutId: null },
      data: { status: "PAID", payoutId: "payout1" },
    });
    expect(tx.salesCommissionAdjustment.updateMany).toHaveBeenCalledWith({ where: { id: { in: ["a1"] }, payoutId: null }, data: { payoutId: "payout1" } });
  });

  it("settles open bonuses and deductions with the payout", async () => {
    vi.mocked(getPayableItems).mockResolvedValue({ commissionIds: ["c1"], adjustmentIds: [], repAdjustmentIds: ["r1", "r2"], total: 3_000 });
    tx.salesCommission.updateMany.mockResolvedValue({ count: 1 });
    tx.salesRepAdjustment.updateMany.mockResolvedValue({ count: 2 });
    const res = await actions.recordSalesPayoutAction({ salesRepId: REP_A, expectedTotal: 3_000, paidAt: "2026-10-01", method: "bank" });
    expect(res.success).toBe(true);
    expect(tx.salesRepAdjustment.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["r1", "r2"] }, payoutId: null, canceledAt: null },
      data: { payoutId: "payout1" },
    });
  });

  it("aborts the payout if a bonus/deduction was canceled mid-transaction", async () => {
    vi.mocked(getPayableItems).mockResolvedValue({ commissionIds: [], adjustmentIds: [], repAdjustmentIds: ["r1", "r2"], total: 3_000 });
    tx.salesCommission.updateMany.mockResolvedValue({ count: 0 });
    tx.salesRepAdjustment.updateMany.mockResolvedValue({ count: 1 });
    await expect(actions.recordSalesPayoutAction({ salesRepId: REP_A, expectedTotal: 3_000, paidAt: "2026-10-01", method: "bank" })).rejects.toThrow();
  });

  it("aborts the whole payout if a commission changed mid-transaction", async () => {
    vi.mocked(getPayableItems).mockResolvedValue({ commissionIds: ["c1", "c2"], adjustmentIds: [], repAdjustmentIds: [], total: 5_000 });
    tx.salesCommission.updateMany.mockResolvedValue({ count: 1 });
    await expect(actions.recordSalesPayoutAction({ salesRepId: REP_A, expectedTotal: 5_000, paidAt: "2026-10-01", method: "bank" })).rejects.toThrow();
  });
});

describe("updateCommissionRulesAction", () => {
  it("appends a new rule version in basis points", async () => {
    const res = await actions.updateCommissionRulesAction({
      starterRate: "17",
      growthRate: "20",
      proRate: "22",
      renewalRate: "6",
      starterMaxPosition: "10",
      growthMaxPosition: "20",
      eligibilityMonths: "6",
      note: "confirmed by finance",
    });
    expect(res.success).toBe(true);
    expect(tx.salesCommissionRule.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ starterRateBps: 1700, growthRateBps: 2000, proRateBps: 2200, renewalRateBps: 600, eligibilityMonths: 6, createdById: "admin1" }),
      select: { id: true },
    });
  });
});
