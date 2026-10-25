import { beforeEach, describe, expect, it, vi } from "vitest";

type Code = { id: string; userId: string; codeHash: string; attempts: number; expiresAt: Date; createdAt: Date };
let codes: Code[] = [];
let user = { id: "u1", email: "sara@example.com", emailVerified: false };
const sent: { to: string; text: string }[] = [];

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/mail", () => ({
  isMailConfigured: () => true,
  sendMail: vi.fn(async (mail: { to: string; text: string }) => {
    sent.push(mail);
  }),
}));

const newest = () => [...codes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => ({ ...user })),
      update: vi.fn(async ({ data }: { data: Partial<typeof user> }) => Object.assign(user, data)),
    },
    emailVerificationCode: {
      findMany: vi.fn(async ({ where }: { where: { createdAt: { gte: Date } } }) =>
        newest().filter((c) => c.createdAt >= where.createdAt.gte),
      ),
      // A copy, like Prisma: later writes don't change a row already read.
      findFirst: vi.fn(async () => (newest()[0] ? { ...newest()[0] } : null)),
      create: vi.fn(async ({ data }: { data: Omit<Code, "id" | "attempts" | "createdAt"> }) => {
        const row = { ...data, id: `c${codes.length}`, attempts: 0, createdAt: new Date() };
        codes.push(row);
        return row;
      }),
      updateMany: vi.fn(async ({ where }: { where: { id: string; attempts: { lt: number } } }) => {
        const row = codes.find((c) => c.id === where.id && c.attempts < where.attempts.lt);
        if (row) row.attempts += 1;
        return { count: row ? 1 : 0 };
      }),
      deleteMany: vi.fn(async () => {
        codes = [];
      }),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

const { generateCode, hashCode, maskEmail, needsEmailVerification, normalizeCode, sendVerificationCode, verifyCode } = await import(
  "./email-verification"
);

/** Puts a known code in place, as if it had just been emailed. */
function seed(code: string, overrides: Partial<Code> = {}) {
  codes.push({
    id: `c${codes.length}`,
    userId: "u1",
    codeHash: hashCode("u1", code),
    attempts: 0,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    createdAt: new Date(),
    ...overrides,
  });
}

beforeEach(() => {
  codes = [];
  sent.length = 0;
  user = { id: "u1", email: "sara@example.com", emailVerified: false };
});

describe("codes", () => {
  it("are always 6 digits", () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it("accept Arabic digits and pasted spacing", () => {
    expect(normalizeCode("٤٨٢ ٩١٧")).toBe("482917");
    expect(normalizeCode("482-917")).toBe("482917");
  });

  it("mask the email without hiding the domain", () => {
    expect(maskEmail("marolinkedin@gmail.com")).toBe("ma•••••@gmail.com");
    expect(maskEmail("a@b.co")).toBe("a•@b.co");
  });

  it("only lock accounts that were created needing it", () => {
    expect(needsEmailVerification({ mustVerifyEmail: true, emailVerified: false })).toBe(true);
    expect(needsEmailVerification({ mustVerifyEmail: false, emailVerified: false })).toBe(false);
    expect(needsEmailVerification({ mustVerifyEmail: true, emailVerified: true })).toBe(false);
  });
});

describe("verifyCode", () => {
  it("confirms the email with the right code and clears the codes", async () => {
    seed("482917");
    expect(await verifyCode("u1", "482917")).toEqual({ ok: true });
    expect(user.emailVerified).toBe(true);
    expect(codes).toHaveLength(0);
  });

  it("counts wrong guesses down, then locks the code", async () => {
    seed("482917");
    expect(await verifyCode("u1", "000000")).toEqual({ ok: false, reason: "wrong", attemptsLeft: 4 });
    for (let i = 0; i < 3; i++) await verifyCode("u1", "000000");
    expect(await verifyCode("u1", "000000")).toEqual({ ok: false, reason: "locked" });
    // Even the right code is refused once locked.
    expect(await verifyCode("u1", "482917")).toEqual({ ok: false, reason: "locked" });
    expect(user.emailVerified).toBe(false);
  });

  it("refuses an expired code", async () => {
    seed("482917", { expiresAt: new Date(Date.now() - 1000) });
    expect(await verifyCode("u1", "482917")).toEqual({ ok: false, reason: "expired" });
  });

  it("only the newest code works", async () => {
    seed("111111", { createdAt: new Date(Date.now() - 120_000) });
    seed("222222");
    expect((await verifyCode("u1", "111111")).ok).toBe(false);
    expect((await verifyCode("u1", "222222")).ok).toBe(true);
  });

  it("rejects incomplete input without spending an attempt", async () => {
    seed("482917");
    expect(await verifyCode("u1", "4829")).toEqual({ ok: false, reason: "invalid" });
    expect(codes[0].attempts).toBe(0);
  });
});

describe("sendVerificationCode", () => {
  it("emails a code that verifies", async () => {
    expect((await sendVerificationCode("u1")).ok).toBe(true);
    expect(sent[0].to).toBe("sara@example.com");
    const code = sent[0].text.match(/\d{6}/)![0];
    expect((await verifyCode("u1", code)).ok).toBe(true);
  });

  it("makes you wait a minute between sends", async () => {
    await sendVerificationCode("u1");
    const again = await sendVerificationCode("u1");
    expect(again).toMatchObject({ ok: false, reason: "cooldown" });
    expect(sent).toHaveLength(1);
  });

  it("stops after five sends in an hour", async () => {
    for (let i = 0; i < 5; i++) seed(String(i).repeat(6), { createdAt: new Date(Date.now() - (10 - i) * 120_000) });
    expect(await sendVerificationCode("u1")).toMatchObject({ ok: false, reason: "limit" });
  });

  it("does nothing for a confirmed email", async () => {
    user.emailVerified = true;
    expect(await sendVerificationCode("u1")).toMatchObject({ ok: false, reason: "verified" });
    expect(sent).toHaveLength(0);
  });
});
