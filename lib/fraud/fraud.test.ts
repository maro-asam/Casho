import { describe, expect, it } from "vitest";
import { canonicalPhone, maskPhone, phoneVariants, toE164 } from "./phone";
import { riskFromHistory, type PhoneHistory } from "./reputation";

const h = (delivered: number, returned: number, canceled = 0): PhoneHistory => ({
  delivered,
  returned,
  canceled,
  total: delivered + returned + canceled,
});
const none = h(0, 0);

describe("canonicalPhone", () => {
  it("folds every Egyptian spelling into 01XXXXXXXXX", () => {
    for (const raw of ["01012345678", "010 1234 5678", "+201012345678", "00201012345678", "201012345678"]) {
      expect(canonicalPhone(raw)).toBe("01012345678");
    }
  });
  it("keeps foreign numbers recognisable", () => {
    expect(canonicalPhone("+966501234567")).toBe("+966501234567");
  });
  it("lists the stored spellings and the E.164 form", () => {
    expect(phoneVariants("01012345678")).toEqual(["01012345678", "201012345678", "+201012345678", "00201012345678"]);
    expect(toE164("01012345678")).toBe("+201012345678");
    expect(maskPhone("01012345678")).toBe("010•••••678");
  });
});

describe("riskFromHistory", () => {
  it("treats a new number as low risk", () => {
    const r = riskFromHistory(none, none, false);
    expect(r.level).toBe("LOW");
    expect(r.signals).toContain("رقم جديد — أول طلب على كاشو");
  });

  it("trusts a number with deliveries and no returns", () => {
    expect(riskFromHistory(h(1, 0), h(4, 0), false).level).toBe("LOW");
  });

  it("flags a single return among many deliveries as medium", () => {
    expect(riskFromHistory(none, h(5, 1), false).level).toBe("MEDIUM");
  });

  it("flags a number that only ever refused as high", () => {
    expect(riskFromHistory(none, h(0, 1), false).level).toBe("HIGH");
    expect(riskFromHistory(h(0, 1), h(3, 2), false).level).toBe("HIGH");
  });

  it("flags many cancellations with no delivery as medium", () => {
    expect(riskFromHistory(none, h(0, 0, 3), false).level).toBe("MEDIUM");
  });

  it("always rates a blocked number high", () => {
    const r = riskFromHistory(h(9, 0), h(9, 0), true);
    expect(r.level).toBe("HIGH");
    expect(r.blockedByStore).toBe(true);
  });
});
