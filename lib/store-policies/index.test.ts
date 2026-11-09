import { describe, expect, it } from "vitest";

import {
  consentPolicyTypes,
  parsePolicy,
  readStoredPolicies,
  resolvePolicy,
  visiblePolicyTypes,
  type PolicyTemplateContext,
} from "./index";
import { buildPolicyTemplate } from "./templates";

const ctx: PolicyTemplateContext = {
  storeName: "متجر النور",
  email: "hello@nour.com",
  whatsapp: "01012345678",
  hasDigital: false,
  adPlatforms: [],
};

describe("parsePolicy", () => {
  it("splits headings, paragraphs and bullet lists", () => {
    const blocks = parsePolicy("مقدمة\nسطر تاني\n\n# العنوان\n- أول\n• تاني\n* تالت\n\nفقرة أخيرة");
    expect(blocks).toEqual([
      { kind: "paragraph", text: "مقدمة\nسطر تاني" },
      { kind: "heading", text: "العنوان" },
      { kind: "list", items: ["أول", "تاني", "تالت"] },
      { kind: "paragraph", text: "فقرة أخيرة" },
    ]);
  });

  it("ends a list when a paragraph line follows without a blank line", () => {
    expect(parsePolicy("- بند\nفقرة")).toEqual([
      { kind: "list", items: ["بند"] },
      { kind: "paragraph", text: "فقرة" },
    ]);
  });

  it("handles Windows line endings and drops empty headings", () => {
    expect(parsePolicy("#\r\n## قسم\r\nنص")).toEqual([
      { kind: "heading", text: "قسم" },
      { kind: "paragraph", text: "نص" },
    ]);
  });

  it("keeps a dash inside a sentence as text", () => {
    expect(parsePolicy("من 2 - 5 أيام")).toEqual([{ kind: "paragraph", text: "من 2 - 5 أيام" }]);
  });
});

describe("readStoredPolicies", () => {
  it("ignores malformed JSON instead of throwing", () => {
    expect(readStoredPolicies(null)).toEqual({});
    expect(readStoredPolicies([])).toEqual({});
    expect(readStoredPolicies({ returns: "oops", privacy: { hidden: true }, bogus: { body: "x" } })).toEqual({
      privacy: { hidden: true },
    });
  });
});

describe("resolvePolicy", () => {
  it("falls back to the template filled with the store's details", () => {
    const policy = resolvePolicy({}, "returns", ctx);
    expect(policy.isTemplate).toBe(true);
    expect(policy.updatedAt).toBeNull();
    expect(policy.body).toContain("متجر النور");
    expect(policy.body).toContain("14 يومًا");
    expect(policy.body).toContain("01012345678");
  });

  it("uses the merchant's own text, and treats a blank body as the template", () => {
    const own = resolvePolicy({ terms: { body: "شروطنا", updatedAt: "2026-11-08T10:00:00.000Z" } }, "terms", ctx);
    expect(own).toMatchObject({ body: "شروطنا", isTemplate: false, updatedAt: "2026-11-08T10:00:00.000Z" });
    expect(resolvePolicy({ terms: { body: "   " } }, "terms", ctx).isTemplate).toBe(true);
  });
});

describe("visibility", () => {
  it("lists shown policies in display order", () => {
    expect(visiblePolicyTypes({})).toEqual(["returns", "shipping", "privacy", "terms"]);
    expect(visiblePolicyTypes({ shipping: { hidden: true } })).toEqual(["returns", "privacy", "terms"]);
  });

  it("asks for consent only to the terms and return policy that are shown", () => {
    expect(consentPolicyTypes({})).toEqual(["returns", "terms"]);
    expect(consentPolicyTypes({ returns: { hidden: true }, terms: { hidden: true } })).toEqual([]);
  });
});

describe("templates", () => {
  it("mentions only what the store actually has", () => {
    expect(buildPolicyTemplate("shipping", ctx)).not.toContain("المنتجات الرقمية");
    expect(buildPolicyTemplate("shipping", { ...ctx, hasDigital: true })).toContain("المنتجات الرقمية");
    expect(buildPolicyTemplate("privacy", ctx)).not.toContain("Meta");
    expect(buildPolicyTemplate("privacy", { ...ctx, adPlatforms: ["Meta", "TikTok"] })).toContain("Meta وTikTok");
  });

  it("points to the contact page when the store has no contact details", () => {
    const body = buildPolicyTemplate("terms", { ...ctx, email: null, whatsapp: null });
    expect(body).toContain(`صفحة "تواصل معنا"`);
  });

  it("parses every template into headings and content", () => {
    for (const type of ["returns", "shipping", "privacy", "terms"] as const) {
      const blocks = parsePolicy(buildPolicyTemplate(type, ctx));
      expect(blocks[0]?.kind).toBe("paragraph");
      expect(blocks.filter((b) => b.kind === "heading").length).toBeGreaterThan(3);
      expect(blocks.at(-2)).toEqual({ kind: "heading", text: "تواصل معنا" });
    }
  });
});
