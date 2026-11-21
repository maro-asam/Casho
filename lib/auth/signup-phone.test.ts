import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findMany: (...args: unknown[]) => findMany(...args) } } }));

const { isSignupPhoneTaken } = await import("./signup-phone");

describe("a new account's phone (email and Google signup)", () => {
  beforeEach(() => findMany.mockReset());

  it("is free when no account has it", async () => {
    findMany.mockResolvedValue([]);
    expect(await isSignupPhoneTaken("new@example.com", "01012345678")).toBe(false);
  });

  it("is taken when another account has it", async () => {
    findMany.mockResolvedValue([{ email: "someone@example.com" }]);
    expect(await isSignupPhoneTaken("new@example.com", "01012345678")).toBe(true);
  });

  it("stays reusable for the allow-listed team phones and inboxes", async () => {
    // Phone-only entry: any email may sign up with it, no lookup needed.
    expect(await isSignupPhoneTaken("anyone@example.com", "01211504120")).toBe(false);
    expect(findMany).not.toHaveBeenCalled();
    // A phone held by an email-only allow-listed inbox may be reused.
    findMany.mockResolvedValue([{ email: "minadiesel51+2@gmail.com" }]);
    expect(await isSignupPhoneTaken("other@example.com", "01098765432")).toBe(false);
  });
});
