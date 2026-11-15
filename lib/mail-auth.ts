// Sender authentication: what the From domain needs in DNS so mail sent
// through Brevo passes DMARC and reaches the inbox instead of spam. Pure, and
// free of "@/" imports and non-erasable TS so `node scripts/check-mail.mjs`
// can import it directly. The DNS lookups themselves live in that script.
//
// Brevo's envelope sender (Return-Path) is Brevo's own domain, so SPF never
// aligns with ours; DMARC passes through DKIM (brevo1/brevo2._domainkey).
// That's why DKIM and DMARC are required here and SPF is only advised.

/** Domains we can't sign for: mail "from" them via Brevo always fails DMARC. */
const FREE_MAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "yandex.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "mail.com",
]);

/** The values Brevo asks for. The brevo-code and DKIM targets come from Brevo's own domain screen. */
export const RECOMMENDED_DMARC = "v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com";
export const RECOMMENDED_SPF = "v=spf1 include:spf.brevo.com ~all";

export function senderDomain(email: string): string | null {
  const at = email.trim().lastIndexOf("@");
  if (at < 1) return null;
  const domain = email.trim().slice(at + 1).toLowerCase().replace(/\.$/, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) ? domain : null;
}

export function isFreeMailSender(email: string) {
  const domain = senderDomain(email);
  return !!domain && FREE_MAIL_DOMAINS.has(domain);
}

/** What DNS answered for the sender domain. Missing names are empty arrays. */
export type MailDnsRecords = {
  /** TXT at the domain itself (brevo-code, SPF). */
  apexTxt: string[];
  /** TXT at _dmarc.<domain>. */
  dmarcTxt: string[];
  /** CNAME targets of brevo1._domainkey and brevo2._domainkey (Brevo's current setup). */
  brevo1Dkim: string[];
  brevo2Dkim: string[];
  /** TXT at mail._domainkey — the key Brevo handed out before the CNAME setup. */
  legacyDkimTxt: string[];
  mx: string[];
};

export type MailCheckStatus = "pass" | "info" | "warn" | "fail";

export type MailCheck = {
  id: "sender" | "brevo-code" | "dkim" | "dmarc" | "spf" | "mx";
  status: MailCheckStatus;
  message: string;
};

const isBrevoDkimTarget = (target: string) => /\.dkim\.brevo\.com\.?$/i.test(target.trim());

function checkSender(fromEmail: string): MailCheck {
  const domain = senderDomain(fromEmail);
  if (!domain) return { id: "sender", status: "fail", message: `"${fromEmail}" isn't an email address.` };
  if (FREE_MAIL_DOMAINS.has(domain)) {
    return {
      id: "sender",
      status: "fail",
      message: `${domain} can't be authenticated in Brevo — receivers see a DMARC failure and file the mail as spam. Send from your own domain (noreply@casho.store).`,
    };
  }
  return { id: "sender", status: "pass", message: `Sending as ${fromEmail}.` };
}

function checkBrevoCode(records: MailDnsRecords): MailCheck {
  const found = records.apexTxt.some((txt) => /^(brevo|sendinblue)-code:/i.test(txt.trim()));
  return found
    ? { id: "brevo-code", status: "pass", message: "Brevo ownership code is published." }
    : { id: "brevo-code", status: "fail", message: "No brevo-code TXT record on the domain — Brevo can't confirm you own it." };
}

function checkDkim(records: MailDnsRecords): MailCheck {
  const one = records.brevo1Dkim.some(isBrevoDkimTarget);
  const two = records.brevo2Dkim.some(isBrevoDkimTarget);
  if (one && two) return { id: "dkim", status: "pass", message: "DKIM: brevo1 and brevo2 point at Brevo." };
  if (one || two) {
    return { id: "dkim", status: "fail", message: `DKIM: ${one ? "brevo2" : "brevo1"}._domainkey is missing — Brevo needs both CNAMEs.` };
  }
  if (records.legacyDkimTxt.some((txt) => /(^|;)\s*p=[A-Za-z0-9+/=]{20,}/.test(txt))) {
    return { id: "dkim", status: "pass", message: "DKIM: mail._domainkey key is published (Brevo's older setup)." };
  }
  return { id: "dkim", status: "fail", message: "No DKIM: add the brevo1/brevo2._domainkey CNAMEs from Brevo's domain screen." };
}

function checkDmarc(records: MailDnsRecords): MailCheck {
  const dmarc = records.dmarcTxt.filter((txt) => /^v=DMARC1\b/i.test(txt.trim()));
  if (dmarc.length === 0) return { id: "dmarc", status: "fail", message: `No DMARC record. Add TXT _dmarc → ${RECOMMENDED_DMARC}` };
  if (dmarc.length > 1) return { id: "dmarc", status: "fail", message: "More than one DMARC record — receivers ignore them all. Keep one." };

  const policy = /(?:^|;)\s*p=(none|quarantine|reject)\b/i.exec(dmarc[0])?.[1]?.toLowerCase();
  if (!policy) return { id: "dmarc", status: "fail", message: "DMARC record has no valid p= policy." };
  return {
    id: "dmarc",
    status: "pass",
    message:
      policy === "none"
        ? "DMARC p=none (monitoring). After a few clean weeks, p=quarantine also stops others from spoofing the domain."
        : `DMARC p=${policy}.`,
  };
}

function checkSpf(records: MailDnsRecords): MailCheck {
  const spf = records.apexTxt.filter((txt) => /^v=spf1\b/i.test(txt.trim()));
  if (spf.length > 1) return { id: "spf", status: "fail", message: "More than one SPF record — that's a permanent SPF error. Merge them into one." };
  if (spf.length === 0) return { id: "spf", status: "warn", message: `No SPF record (not needed for Brevo to pass DMARC, but advised): ${RECOMMENDED_SPF}` };
  return /\binclude:(spf\.brevo\.com|spf\.sendinblue\.com)\b/i.test(spf[0])
    ? { id: "spf", status: "pass", message: "SPF includes Brevo." }
    : { id: "spf", status: "warn", message: "SPF doesn't include spf.brevo.com — add it if this domain sends through Brevo." };
}

function checkMx(records: MailDnsRecords): MailCheck {
  return records.mx.length > 0
    ? { id: "mx", status: "pass", message: `Receives mail (MX: ${records.mx.join(", ")}).` }
    : { id: "mx", status: "info", message: "No MX: replies to this address bounce. Fine for a noreply@ sender." };
}

/** Every check for sending as `fromEmail`; `records` are the sender domain's. */
export function checkMailDns(fromEmail: string, records: MailDnsRecords): MailCheck[] {
  const sender = checkSender(fromEmail);
  if (sender.status === "fail") return [sender];
  return [sender, checkBrevoCode(records), checkDkim(records), checkDmarc(records), checkSpf(records), checkMx(records)];
}

/** Brevo can authenticate the domain (and mail will pass DMARC) once nothing fails. */
export function isMailDnsReady(checks: MailCheck[]) {
  return checks.every((check) => check.status !== "fail");
}
