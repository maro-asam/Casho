import { describe, expect, it } from "vitest";
import { familyEmailMatch, familyMemberEmail, storeFamilyOf } from "./rules";

describe("storeFamilyOf", () => {
  it("finds the allow-listed inbox from the account itself and its +tag aliases", () => {
    expect(storeFamilyOf("berry@casho.store")).toBe("berry@casho.store");
    expect(storeFamilyOf("berry+cairo-shop@casho.store")).toBe("berry@casho.store");
    expect(storeFamilyOf(" Berry+X@Casho.Store ")).toBe("berry@casho.store");
  });

  it("ignores everyone else", () => {
    expect(storeFamilyOf("madona@casho.store")).toBeNull();
    expect(storeFamilyOf("berry@gmail.com")).toBeNull();
    expect(storeFamilyOf("berry2@casho.store")).toBeNull();
    expect(storeFamilyOf("")).toBeNull();
    expect(storeFamilyOf(null)).toBeNull();
  });
});

describe("familyMemberEmail", () => {
  it("tags the inbox with the store slug", () => {
    expect(familyMemberEmail("berry@casho.store", "cairo-shop")).toBe("berry+cairo-shop@casho.store");
    expect(storeFamilyOf(familyMemberEmail("berry@casho.store", "a-b-c"))).toBe("berry@casho.store");
  });
});

describe("familyEmailMatch", () => {
  it("splits the inbox for the alias lookup", () => {
    expect(familyEmailMatch("berry@casho.store")).toEqual({
      exact: "berry@casho.store",
      aliasPrefix: "berry+",
      aliasSuffix: "@casho.store",
    });
  });
});
