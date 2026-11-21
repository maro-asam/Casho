import { describe, expect, it } from "vitest";
import { PROOF_MAX_BYTES, checkProof, isAcceptableProof, manualTransferDetail, needsPaymentProof, normalizePayer, proofRules } from "./manual-proof";

describe("manual transfer proof at checkout", () => {
  const settings = {
    manualPaymentDetails: { instapay: "  store@instapay ", fawry: "" },
    vodafoneCashNumber: "01011112222",
    instapayAddress: "old@instapay",
    bankTransferDetails: null,
  };

  it("finds where to send the money: the per-method map first, then the legacy columns", () => {
    expect(manualTransferDetail("instapay", settings)).toBe("store@instapay");
    expect(manualTransferDetail("vodafone_cash", settings)).toBe("01011112222");
    expect(manualTransferDetail("fawry", settings)).toBeNull();
    expect(manualTransferDetail("bank_transfer", settings)).toBeNull();
    expect(manualTransferDetail("instapay", null)).toBeNull();
  });

  it("asks for proof only on manual methods the merchant filled in", () => {
    expect(needsPaymentProof("instapay", settings)).toBe(true);
    expect(needsPaymentProof("vodafone_cash", settings)).toBe(true);
    expect(needsPaymentProof("bank_transfer", settings)).toBe(false); // nothing to transfer to
    expect(needsPaymentProof("cash_on_delivery", settings)).toBe(false);
    expect(needsPaymentProof("paymob", { manualPaymentDetails: { paymob: "x" } })).toBe(false);
  });

  it("tidies what the shopper paid from, and refuses what can't identify a transfer", () => {
    expect(normalizePayer("  010 1234   5678 ")).toBe("010 1234 5678");
    expect(normalizePayer("ab")).toBeNull();
    expect(normalizePayer("   ")).toBeNull();
    expect(normalizePayer(undefined)).toBeNull();
    expect(normalizePayer(42)).toBeNull();
    expect(normalizePayer("x".repeat(200))?.length).toBe(80);
  });

  it("accepts a screenshot: an image, not empty, under the limit, never SVG", () => {
    const image = (size: number, type: string) => new Blob([new Uint8Array(size)], { type });
    expect(isAcceptableProof(image(1000, "image/jpeg"))).toBe(true);
    expect(isAcceptableProof(image(1000, "image/webp"))).toBe(true);
    expect(isAcceptableProof(image(0, "image/png"))).toBe(false);
    expect(isAcceptableProof(image(PROOF_MAX_BYTES + 1, "image/jpeg"))).toBe(false);
    expect(isAcceptableProof(image(1000, "application/pdf"))).toBe(false);
    expect(isAcceptableProof(image(1000, "image/svg+xml"))).toBe(false);
    expect(isAcceptableProof("https://example.com/a.jpg")).toBe(false);
    expect(isAcceptableProof(null)).toBe(false);
  });

  describe("the merchant picks what's required", () => {
    const shot = new Blob([new Uint8Array(2000)], { type: "image/jpeg" });
    const both = { payer: true, screenshot: true };
    const payerOnly = { payer: true, screenshot: false };
    const shotOnly = { payer: false, screenshot: true };
    const neither = { payer: false, screenshot: false };

    it("requires both by default (stores from before the switches)", () => {
      expect(proofRules(null)).toEqual(both);
      expect(proofRules({ requireTransferPayer: false, requireTransferScreenshot: true })).toEqual(shotOnly);
    });

    it("refuses a missing required piece", () => {
      expect(checkProof(both, { payer: "01012345678", image: null })).toEqual({ error: expect.stringContaining("صورة التحويل") });
      expect(checkProof(both, { payer: "", image: shot })).toEqual({ error: expect.stringContaining("حوّلت منه") });
      expect(checkProof(payerOnly, { payer: " ", image: null })).toHaveProperty("error");
      expect(checkProof(shotOnly, null)).toHaveProperty("error");
    });

    it("lets an optional piece be left out, and keeps it when sent", () => {
      expect(checkProof(payerOnly, { payer: "01012345678", image: null })).toEqual({ payer: "01012345678", image: null });
      expect(checkProof(shotOnly, { payer: null, image: shot })).toEqual({ payer: null, image: shot });
      expect(checkProof(shotOnly, { payer: "01012345678", image: shot })).toEqual({ payer: "01012345678", image: shot });
      expect(checkProof(neither, { payer: "", image: null })).toEqual({ payer: null, image: null });
    });

    it("refuses an unusable screenshot even when it's optional", () => {
      const pdf = new Blob([new Uint8Array(2000)], { type: "application/pdf" });
      const huge = new Blob([new Uint8Array(PROOF_MAX_BYTES + 1)], { type: "image/png" });
      expect(checkProof(payerOnly, { payer: "01012345678", image: pdf })).toHaveProperty("error");
      expect(checkProof(neither, { payer: "", image: huge })).toHaveProperty("error");
      // An empty file input is "nothing sent", not a bad file.
      expect(checkProof(payerOnly, { payer: "01012345678", image: new Blob([]) })).toEqual({ payer: "01012345678", image: null });
    });
  });
});
