import { describe, expect, it } from "vitest";
import { canReusePhone } from "./multi-account";

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
});
