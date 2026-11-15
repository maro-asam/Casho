import { describe, expect, it } from "vitest";
import { canReusePhone, phoneHeldByMultiAccountInbox } from "./multi-account";

describe("canReusePhone", () => {
  it("allows the team inbox and its +tag aliases with the team phone", () => {
    expect(canReusePhone("mmcasho823@gmail.com", "01103129299")).toBe(true);
    expect(canReusePhone("mmcasho823+store2@gmail.com", "01103129299")).toBe(true);
    expect(canReusePhone("MMcasho823+X@Gmail.com", "01103129299")).toBe(true);
  });

  it("needs both the inbox and the phone", () => {
    expect(canReusePhone("mmcasho823@gmail.com", "01012345678")).toBe(false);
    expect(canReusePhone("someone@gmail.com", "01103129299")).toBe(false);
    expect(canReusePhone("mmcasho823@yahoo.com", "01103129299")).toBe(false);
  });

  it("lets a phone-only entry sign up with any email", () => {
    expect(canReusePhone("first@gmail.com", "01211504120")).toBe(true);
    expect(canReusePhone("another@yahoo.com", " 01211504120 ")).toBe(true);
    expect(canReusePhone("first@gmail.com", "01211504121")).toBe(false);
  });

  it("lets an email-only entry and its +tag aliases sign up with any phone", () => {
    expect(canReusePhone("minadiesel51@gmail.com", "01012345678")).toBe(true);
    expect(canReusePhone("MinaDiesel51+store2@Gmail.com", "01198765432")).toBe(true);
    expect(canReusePhone("minadiesel52@gmail.com", "01012345678")).toBe(false);
    expect(canReusePhone("minadiesel51@yahoo.com", "01012345678")).toBe(false);
  });
});

describe("phoneHeldByMultiAccountInbox", () => {
  it("frees a phone that's on an email-only allow-listed inbox's account", () => {
    expect(phoneHeldByMultiAccountInbox(["minadiesel51@gmail.com"])).toBe(true);
    expect(phoneHeldByMultiAccountInbox(["other@gmail.com", "MinaDiesel51+store2@Gmail.com"])).toBe(true);
  });

  it("keeps every other phone blocked", () => {
    expect(phoneHeldByMultiAccountInbox([])).toBe(false);
    expect(phoneHeldByMultiAccountInbox(["someone@gmail.com"])).toBe(false);
    expect(phoneHeldByMultiAccountInbox(["minadiesel51@yahoo.com"])).toBe(false);
    // An email+phone entry only matches the two together, never the inbox alone.
    expect(phoneHeldByMultiAccountInbox(["mmcasho823@gmail.com"])).toBe(false);
  });
});
