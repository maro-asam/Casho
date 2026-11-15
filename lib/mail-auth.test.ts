import { describe, expect, it } from "vitest";

import { checkMailDns, isFreeMailSender, isMailDnsReady, senderDomain, type MailDnsRecords } from "./mail-auth";

const empty: MailDnsRecords = { apexTxt: [], dmarcTxt: [], brevo1Dkim: [], brevo2Dkim: [], legacyDkimTxt: [], mx: [] };

const authenticated: MailDnsRecords = {
  ...empty,
  apexTxt: ["brevo-code:0123456789abcdef0123456789abcdef", "v=spf1 include:spf.brevo.com ~all"],
  dmarcTxt: ["v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com"],
  brevo1Dkim: ["b1.casho-store.dkim.brevo.com"],
  brevo2Dkim: ["b2.casho-store.dkim.brevo.com"],
};

const statusOf = (records: MailDnsRecords, id: string, from = "noreply@casho.store") =>
  checkMailDns(from, records).find((check) => check.id === id)?.status;

describe("senderDomain / isFreeMailSender", () => {
  it("reads the domain, lowercased", () => {
    expect(senderDomain("NoReply@Casho.Store")).toBe("casho.store");
    expect(senderDomain("not-an-email")).toBeNull();
    expect(senderDomain("@casho.store")).toBeNull();
  });

  it("flags free-mail senders only", () => {
    expect(isFreeMailSender("cashostore0@gmail.com")).toBe(true);
    expect(isFreeMailSender("someone@Outlook.com")).toBe(true);
    expect(isFreeMailSender("noreply@casho.store")).toBe(false);
  });
});

describe("checkMailDns", () => {
  it("stops at a free-mail sender — no DNS can fix it", () => {
    const checks = checkMailDns("cashostore0@gmail.com", authenticated);
    expect(checks).toHaveLength(1);
    expect(checks[0]).toMatchObject({ id: "sender", status: "fail" });
    expect(isMailDnsReady(checks)).toBe(false);
  });

  it("a domain with nothing published fails brevo-code, DKIM and DMARC", () => {
    const checks = checkMailDns("noreply@casho.store", empty);
    expect(checks.filter((c) => c.status === "fail").map((c) => c.id)).toEqual(["brevo-code", "dkim", "dmarc"]);
    expect(statusOf(empty, "spf")).toBe("warn");
    expect(statusOf(empty, "mx")).toBe("info");
  });

  it("is ready once Brevo's records are live", () => {
    const checks = checkMailDns("noreply@casho.store", authenticated);
    expect(isMailDnsReady(checks)).toBe(true);
    expect(checks.every((c) => c.status === "pass" || c.status === "info")).toBe(true);
  });

  it("needs both Brevo DKIM CNAMEs, pointing at Brevo", () => {
    expect(statusOf({ ...authenticated, brevo2Dkim: [] }, "dkim")).toBe("fail");
    expect(statusOf({ ...authenticated, brevo1Dkim: ["elsewhere.example.com"], brevo2Dkim: ["b2.x.dkim.brevo.com."] }, "dkim")).toBe("fail");
  });

  it("accepts the older mail._domainkey key", () => {
    const legacy = { ...authenticated, brevo1Dkim: [], brevo2Dkim: [], legacyDkimTxt: ["k=rsa;p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ"] };
    expect(statusOf(legacy, "dkim")).toBe("pass");
  });

  it("rejects duplicate or policy-less DMARC", () => {
    expect(statusOf({ ...authenticated, dmarcTxt: ["v=DMARC1; p=none", "v=DMARC1; p=reject"] }, "dmarc")).toBe("fail");
    expect(statusOf({ ...authenticated, dmarcTxt: ["v=DMARC1; rua=mailto:x@y.z"] }, "dmarc")).toBe("fail");
    expect(statusOf({ ...authenticated, dmarcTxt: ["v=DMARC1; p=quarantine"] }, "dmarc")).toBe("pass");
  });

  it("two SPF records is an error; SPF without Brevo is a warning", () => {
    expect(statusOf({ ...authenticated, apexTxt: [...authenticated.apexTxt, "v=spf1 -all"] }, "spf")).toBe("fail");
    expect(statusOf({ ...authenticated, apexTxt: ["brevo-code:abc", "v=spf1 include:_spf.google.com ~all"] }, "spf")).toBe("warn");
  });

  it("ignores unrelated TXT records at the apex", () => {
    const withVerification = { ...authenticated, apexTxt: ["google-site-verification=xyz", ...authenticated.apexTxt] };
    expect(isMailDnsReady(checkMailDns("noreply@casho.store", withVerification))).toBe(true);
  });
});
