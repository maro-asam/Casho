import { describe, expect, it } from "vitest";
import { normalizeCity, normalizeEmail, normalizeHandle, normalizePhone, normalizeWebsite } from "./normalize";
import { bandForScore, effectivePriority, scoreLead, type ScoreInput } from "./scoring";
import { canManageLead, canViewLead, canWorkLead, checkStatusChange, statusAfterAssignment, statusAfterInteraction, type LeadActor } from "./workflow";
import { cairoDayBounds, followUpBucket, reminderDue, validateDueAt } from "./follow-ups";
import { decideMatch, type MatchAccount, type MatchCandidate } from "./conversion-rules";
import { autoMapColumns, applyMapping, checkImportRow, fillBlanks, inFileDuplicates, mappingProblems, TEMPLATE_HEADERS } from "./import";
import { createLeadSchema, changeStatusSchema, logInteractionSchema } from "@/validations/leads.schema";

describe("normalizePhone", () => {
  it.each([
    ["01001234567", "01001234567"],
    ["+20 100 123 4567", "01001234567"],
    ["00201001234567", "01001234567"],
    ["201001234567", "01001234567"],
    ["1001234567", "01001234567"],
    ["٠١٠٠١٢٣٤٥٦٧", "01001234567"],
    ["(010) 0123-4567", "01001234567"],
    ["0223456789", "0223456789"],
    ["+966501234567", "+966501234567"],
  ])("%s → %s", (raw, expected) => expect(normalizePhone(raw)).toBe(expected));

  it.each(["", "abc", "0100123", "01301234567", "+20123", "12345"])("rejects %s", (raw) => expect(normalizePhone(raw)).toBeNull());

  it("matches what signup stores, so conversion can compare", () => {
    expect(normalizePhone("+201112223334")).toBe("01112223334");
  });
});

describe("contact normalizers", () => {
  it("emails are lowercased and validated", () => {
    expect(normalizeEmail(" Sara@Shop.COM ")).toBe("sara@shop.com");
    expect(normalizeEmail("not-an-email")).toBeNull();
  });
  it("websites get https and must have a domain", () => {
    expect(normalizeWebsite("shop.com")).toBe("https://shop.com");
    expect(normalizeWebsite("javascript:alert(1)")).toBeNull();
    expect(normalizeWebsite("localhost")).toBeNull();
  });
  it("social handles from any form", () => {
    expect(normalizeHandle("@my.shop", "instagram.com")).toBe("my.shop");
    expect(normalizeHandle("https://www.instagram.com/my.shop/?hl=ar", "instagram.com")).toBe("my.shop");
    expect(normalizeHandle("<script>", "instagram.com")).toBeNull();
  });
  it("governorates are folded to their Arabic name", () => {
    expect(normalizeCity("cairo")).toBe("القاهرة");
    expect(normalizeCity("القاهره")).toBe("القاهرة");
    expect(normalizeCity("مدينة نصر")).toBe("مدينة نصر");
  });
});

describe("scoring", () => {
  const base: ScoreInput = { instagram: null, website: null, whatsapp: null, businessSize: null, status: "NEW", hadDemo: false, responded: false };

  it("an empty lead scores 0 / LOW", () => {
    expect(scoreLead(base)).toMatchObject({ score: 0, band: "LOW" });
  });
  it("every criterion met → 100 / HOT", () => {
    const r = scoreLead({ instagram: "x", website: "https://x.com", whatsapp: "01001234567", businessSize: "LARGE", status: "NEGOTIATION", hadDemo: true, responded: true });
    expect(r.score).toBe(100);
    expect(r.band).toBe("HOT");
    expect(r.criteria.every((c) => c.met)).toBe(true);
  });
  it("is explainable: points add up to the earned total", () => {
    const r = scoreLead({ ...base, instagram: "x", status: "INTERESTED" });
    expect(r.earned).toBe(30);
    expect(r.criteria.filter((c) => c.met).map((c) => c.key)).toEqual(["instagram", "interested"]);
    expect(r.score).toBe(Math.round((100 * 30) / r.max));
  });
  it("an invalid WhatsApp number earns nothing", () => {
    expect(scoreLead({ ...base, whatsapp: "123" }).earned).toBe(0);
  });
  it("bands", () => {
    expect([0, 24, 25, 49, 50, 74, 75, 100].map(bandForScore)).toEqual(["LOW", "LOW", "MEDIUM", "MEDIUM", "HIGH", "HIGH", "HOT", "HOT"]);
  });
  it("a priority a human picked is kept", () => {
    expect(effectivePriority(true, "HOT", 0)).toBe("HOT");
    expect(effectivePriority(false, "HOT", 0)).toBe("LOW");
  });
});

describe("permissions", () => {
  const admin: LeadActor = { kind: "admin", userId: "a" };
  const rep: LeadActor = { kind: "rep", userId: "u1", salesRepId: "r1" };
  const otherRep: LeadActor = { kind: "rep", userId: "u2", salesRepId: "r2" };
  const lead = { assignedRepId: "r1", status: "ASSIGNED" as const, archivedAt: null, deletedAt: null };

  it("a rep sees only leads assigned to them", () => {
    expect(canViewLead(rep, lead)).toBe(true);
    expect(canViewLead(otherRep, lead)).toBe(false);
    expect(canViewLead(rep, { ...lead, assignedRepId: null })).toBe(false);
  });
  it("archived or deleted leads disappear for the rep, not for the admin", () => {
    expect(canViewLead(rep, { ...lead, archivedAt: new Date() })).toBe(false);
    expect(canViewLead(rep, { ...lead, deletedAt: new Date() })).toBe(false);
    expect(canViewLead(admin, { ...lead, archivedAt: new Date() })).toBe(true);
  });
  it("only the admin manages (edit identity, assign, archive)", () => {
    expect(canManageLead(admin)).toBe(true);
    expect(canManageLead(rep)).toBe(false);
  });
  it("nobody works a deleted lead", () => {
    expect(canWorkLead(admin, { ...lead, deletedAt: new Date() })).toBe(false);
    expect(canWorkLead(otherRep, lead)).toBe(false);
  });
});

describe("status changes", () => {
  const admin: LeadActor = { kind: "admin", userId: "a" };
  const rep: LeadActor = { kind: "rep", userId: "u1", salesRepId: "r1" };
  const lead = { assignedRepId: "r1", status: "CONTACTED" as const, archivedAt: null, deletedAt: null };

  it("nobody sets CONVERTED by hand", () => {
    expect(checkStatusChange(admin, lead, "CONVERTED").ok).toBe(false);
    expect(checkStatusChange(rep, lead, "CONVERTED").ok).toBe(false);
  });
  it("a converted lead is frozen", () => {
    expect(checkStatusChange(admin, { ...lead, status: "CONVERTED" }, "LOST").ok).toBe(false);
  });
  it("a rep moves their own lead through the working stages only", () => {
    expect(checkStatusChange(rep, lead, "INTERESTED").ok).toBe(true);
    expect(checkStatusChange(rep, lead, "LOST").ok).toBe(true);
    expect(checkStatusChange(rep, lead, "NEW").ok).toBe(false);
    expect(checkStatusChange(rep, lead, "ASSIGNED").ok).toBe(false);
    expect(checkStatusChange({ kind: "rep", userId: "u2", salesRepId: "r2" }, lead, "INTERESTED").ok).toBe(false);
  });
  it("NEW / ASSIGNED follow the assignment", () => {
    expect(checkStatusChange(admin, lead, "NEW").ok).toBe(false);
    expect(checkStatusChange(admin, { ...lead, assignedRepId: null }, "ASSIGNED").ok).toBe(false);
    expect(statusAfterAssignment("NEW", true)).toBe("ASSIGNED");
    expect(statusAfterAssignment("ASSIGNED", false)).toBe("NEW");
    expect(statusAfterAssignment("INTERESTED", true)).toBe("INTERESTED");
  });
  it("interactions only move a lead forward", () => {
    expect(statusAfterInteraction("ASSIGNED", "CALL", true)).toBe("CONTACTED");
    expect(statusAfterInteraction("ASSIGNED", "CALL", false)).toBe("ASSIGNED");
    expect(statusAfterInteraction("CONTACTED", "DEMO", null)).toBe("DEMO_SCHEDULED");
    expect(statusAfterInteraction("NEGOTIATION", "DEMO", null)).toBe("NEGOTIATION");
    expect(statusAfterInteraction("LOST", "CALL", true)).toBe("LOST");
  });
  it("LOST needs a reason, OTHER needs a note", () => {
    const id = "6f1c1c2e-4b8a-4c56-9d1e-0a2b3c4d5e6f";
    expect(changeStatusSchema.safeParse({ leadId: id, status: "LOST" }).success).toBe(false);
    expect(changeStatusSchema.safeParse({ leadId: id, status: "LOST", lostReason: "OTHER" }).success).toBe(false);
    expect(changeStatusSchema.safeParse({ leadId: id, status: "LOST", lostReason: "PRICE" }).success).toBe(true);
    expect(changeStatusSchema.safeParse({ leadId: id, status: "LOST", lostReason: "OTHER", lostNote: "سافر" }).success).toBe(true);
  });
  it("a note needs text", () => {
    const id = "6f1c1c2e-4b8a-4c56-9d1e-0a2b3c4d5e6f";
    expect(logInteractionSchema.safeParse({ leadId: id, type: "NOTE", description: "  " }).success).toBe(false);
    expect(logInteractionSchema.safeParse({ leadId: id, type: "CALL", reached: "no" }).success).toBe(true);
  });
});

describe("follow-ups", () => {
  // 2026-11-21 10:00 Cairo (UTC+2, no DST in November) = 08:00Z
  const now = new Date("2026-11-21T08:00:00Z");

  it("Cairo day bounds", () => {
    const { start, end } = cairoDayBounds(now);
    expect(start.toISOString()).toBe("2026-11-20T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-21T22:00:00.000Z");
  });
  it("buckets", () => {
    expect(followUpBucket({ status: "PENDING", dueAt: new Date("2026-11-21T07:00:00Z") }, now)).toBe("overdue");
    expect(followUpBucket({ status: "PENDING", dueAt: new Date("2026-11-21T21:59:00Z") }, now)).toBe("today");
    expect(followUpBucket({ status: "PENDING", dueAt: new Date("2026-11-21T22:00:00Z") }, now)).toBe("upcoming");
    expect(followUpBucket({ status: "DONE", dueAt: now }, now)).toBe("completed");
    expect(followUpBucket({ status: "CANCELED", dueAt: now }, now)).toBeNull();
  });
  it("reminds once, an hour ahead", () => {
    expect(reminderDue({ status: "PENDING", dueAt: new Date("2026-11-21T08:50:00Z"), reminderSentAt: null }, now)).toBe(true);
    expect(reminderDue({ status: "PENDING", dueAt: new Date("2026-11-21T09:30:00Z"), reminderSentAt: null }, now)).toBe(false);
    expect(reminderDue({ status: "PENDING", dueAt: new Date("2026-11-21T08:50:00Z"), reminderSentAt: now }, now)).toBe(false);
    expect(reminderDue({ status: "DONE", dueAt: now, reminderSentAt: null }, now)).toBe(false);
  });
  it("no follow-ups in the past", () => {
    expect(validateDueAt(new Date("2026-11-20T08:00:00Z"), now)).not.toBeNull();
    expect(validateDueAt(new Date("2026-11-22T08:00:00Z"), now)).toBeNull();
  });
});

describe("conversion matching", () => {
  const account: MatchAccount = { userId: "u", email: "sara@shop.com", emailVerified: true, phone: "01001234567", phoneSharedWithOthers: false };
  const lead = (over: Partial<MatchCandidate> = {}): MatchCandidate => ({ leadId: "l1", normalizedPhone: "01001234567", normalizedWhatsapp: null, email: null, ...over });

  it("one lead with the same phone → linked automatically", () => {
    expect(decideMatch(account, [lead()])).toEqual({ kind: "auto", leadId: "l1", matchedBy: "PHONE" });
  });
  it("a verified email match → linked automatically", () => {
    expect(decideMatch(account, [lead({ normalizedPhone: "01111111111", email: "sara@shop.com" })])).toEqual({ kind: "auto", leadId: "l1", matchedBy: "EMAIL" });
  });
  it("an unverified email never links", () => {
    expect(decideMatch({ ...account, emailVerified: false, phone: null }, [lead({ normalizedPhone: "01111111111", email: "sara@shop.com" })])).toEqual({ kind: "none" });
  });
  it("WhatsApp number counts as the phone", () => {
    expect(decideMatch(account, [lead({ normalizedPhone: "01111111111", normalizedWhatsapp: "01001234567" })]).kind).toBe("auto");
  });
  it("several leads → a super admin decides", () => {
    const d = decideMatch(account, [lead(), lead({ leadId: "l2" })]);
    expect(d.kind).toBe("review");
    if (d.kind === "review") expect(d.matches.map((m) => m.reason)).toEqual(["MULTIPLE_LEADS", "MULTIPLE_LEADS"]);
  });
  it("phone matches but the lead's email is someone else's → review", () => {
    const d = decideMatch(account, [lead({ email: "other@x.com" })]);
    expect(d.kind === "review" && d.matches[0].reason).toBe("EMAIL_MISMATCH");
  });
  it("a phone shared by several Casho accounts → review", () => {
    const d = decideMatch({ ...account, phoneSharedWithOthers: true }, [lead()]);
    expect(d.kind === "review" && d.matches[0].reason).toBe("SHARED_PHONE");
  });
  it("no match → nothing", () => {
    expect(decideMatch(account, [lead({ normalizedPhone: "01222222222" })])).toEqual({ kind: "none" });
  });
});

describe("import", () => {
  it("maps Arabic and English headers, and the template's own headers", () => {
    expect(autoMapColumns(["Business Name", "Mobile", "E-mail", "Notes"])).toEqual({ "Business Name": "businessName", Mobile: "phone", "E-mail": "email", Notes: "notes" });
    expect(autoMapColumns(["اسم المحل", "رقم الموبايل", "المحافظة"])).toEqual({ "اسم المحل": "businessName", "رقم الموبايل": "phone", المحافظة: "city" });
    const mapped = autoMapColumns(TEMPLATE_HEADERS);
    expect(Object.values(mapped).every(Boolean)).toBe(true);
    expect(mappingProblems(mapped)).toEqual([]);
  });
  it("requires business name and phone, once each", () => {
    expect(mappingProblems({ A: "businessName" })).toEqual(["لازم عمود لـ«الموبايل»"]);
    expect(mappingProblems({ A: "businessName", B: "phone", C: "phone" })).toEqual(["«الموبايل» متحدد لأكتر من عمود"]);
  });
  it("validates rows with exact reasons", () => {
    const bad = checkImportRow(applyMapping({ n: "", p: "123", e: "nope" }, { n: "businessName", p: "phone", e: "email" }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors).toEqual(["اسم النشاط مطلوب (حرفين على الأقل)", "رقم الموبايل مش صحيح", "الإيميل مش صحيح"]);
  });
  it("cleans a good row and reads enum words", () => {
    const r = checkImportRow({ businessName: "  Sara  Shop ", phone: "+20 100 123 4567", email: "-", source: "انستجرام", businessSize: "متوسط", city: "giza" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalizedPhone).toBe("01001234567");
      expect(r.lead).toMatchObject({ businessName: "Sara Shop", email: null, source: "INSTAGRAM", businessSize: "MEDIUM", city: "الجيزة" });
    }
  });
  it("finds duplicates inside the file by phone or email", () => {
    const d = inFileDuplicates([
      { normalizedPhone: "01001234567", email: null },
      { normalizedPhone: "01001234567", email: null },
      { normalizedPhone: "01111111111", email: "a@b.com" },
      { normalizedPhone: "01222222222", email: "a@b.com" },
      { normalizedPhone: null, email: null },
    ]);
    expect([...d]).toEqual([1, 3]);
  });
  it("FILL_BLANKS never overwrites", () => {
    expect(fillBlanks<Record<string, string | null>>({ email: "old@x.com", city: null }, { email: "new@x.com", city: "الجيزة" }, ["email", "city"])).toEqual({ city: "الجيزة" });
  });
});

describe("add-lead form", () => {
  it("accepts a minimal lead and defaults priority to automatic", () => {
    const r = createLeadSchema.safeParse({ businessName: "Sara Shop", phone: "01001234567", assignRepId: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toMatchObject({ priority: "AUTO", assignRepId: null, email: null });
  });
});
