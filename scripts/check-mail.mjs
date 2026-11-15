// Will Casho's emails reach the inbox? Checks the sender domain's DNS for what
// Brevo needs (brevo-code, DKIM, DMARC, SPF), and can send a real test email.
//
//   node scripts/check-mail.mjs                                   check MAIL_FROM_EMAIL from .env
//   node scripts/check-mail.mjs noreply@casho.store               check another sender
//   node scripts/check-mail.mjs noreply@casho.store --send you@gmail.com
//                                                                  …and send a test from it via Brevo SMTP
//
// Asks public resolvers (Cloudflare, Google), not the local cache, so a record
// added a minute ago shows up as soon as it's live. Exits 1 if a check fails.
// Setup guide: docs/email/deliverability.md

import "dotenv/config";
import { Resolver } from "node:dns/promises";
import nodemailer from "nodemailer";

import { checkMailDns, isMailDnsReady, senderDomain } from "../lib/mail-auth.ts";

const args = process.argv.slice(2);
const sendIndex = args.indexOf("--send");
const sendTo = sendIndex >= 0 ? args[sendIndex + 1] : null;
const fromEmail =
  args.find((arg, i) => !arg.startsWith("--") && (sendIndex < 0 || i !== sendIndex + 1)) ?? process.env.MAIL_FROM_EMAIL ?? "";

if (sendIndex >= 0 && !sendTo) {
  console.error("--send needs an address: --send you@gmail.com");
  process.exit(2);
}
if (!fromEmail) {
  console.error("No sender: pass one (noreply@casho.store) or set MAIL_FROM_EMAIL.");
  process.exit(2);
}

const resolver = new Resolver({ timeout: 5000, tries: 2 });
resolver.setServers(["1.1.1.1", "8.8.8.8"]);

/** No such name / no records of that type → []. Anything else (timeouts) is a real error. */
async function lookup(fn) {
  try {
    return await fn();
  } catch (error) {
    if (["ENODATA", "ENOTFOUND", "ENONAME"].includes(error?.code)) return [];
    throw error;
  }
}

const txt = (name) => lookup(() => resolver.resolveTxt(name)).then((rows) => rows.map((chunks) => chunks.join("")));
const cname = (name) => lookup(() => resolver.resolveCname(name));
const mx = (name) => lookup(() => resolver.resolveMx(name)).then((rows) => rows.map((row) => row.exchange));

const domain = senderDomain(fromEmail);
const records = domain
  ? {
      apexTxt: await txt(domain),
      dmarcTxt: await txt(`_dmarc.${domain}`),
      brevo1Dkim: await cname(`brevo1._domainkey.${domain}`),
      brevo2Dkim: await cname(`brevo2._domainkey.${domain}`),
      legacyDkimTxt: await txt(`mail._domainkey.${domain}`),
      mx: await mx(domain),
    }
  : { apexTxt: [], dmarcTxt: [], brevo1Dkim: [], brevo2Dkim: [], legacyDkimTxt: [], mx: [] };

const checks = checkMailDns(fromEmail, records);
const mark = { pass: "✓", info: "·", warn: "!", fail: "✗" };

console.log(`\nSender: ${fromEmail}${domain ? `  (domain ${domain})` : ""}\n`);
for (const check of checks) console.log(`  ${mark[check.status]} ${check.id.padEnd(10)} ${check.message}`);

const ready = isMailDnsReady(checks);
console.log(
  ready
    ? "\nDNS is ready. In Brevo, the domain should show as authenticated (press “Authenticate” if it doesn't yet).\n"
    : "\nNot ready — fix the ✗ lines. Records can take a few minutes to go live after you add them.\n",
);

if (sendTo) {
  const { BREVO_SMTP_HOST: host, BREVO_SMTP_USER: user, BREVO_SMTP_PASS: pass } = process.env;
  const port = Number(process.env.BREVO_SMTP_PORT || 587);
  if (!host || !user || !pass) {
    console.error("Can't send: BREVO_SMTP_HOST / BREVO_SMTP_USER / BREVO_SMTP_PASS are missing.");
    process.exit(1);
  }

  const smtp = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  try {
    const info = await smtp.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || "Casho"}" <${fromEmail}>`,
      to: sendTo,
      replyTo: process.env.MAIL_REPLY_TO || undefined,
      subject: `تجربة إرسال من كاشو — ${stamp}`,
      text: `دي رسالة تجربة من ${fromEmail} (${stamp}).\nلو وصلت في الـ Inbox يبقى الإعداد سليم.`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
        <p>دي رسالة تجربة من <b dir="ltr">${fromEmail}</b> (${stamp}).</p>
        <p>لو وصلت في الـ Inbox يبقى الإعداد سليم.</p></div>`,
    });
    console.log(`Sent to ${sendTo} (${info.messageId}).`);
    console.log("In Gmail: ⋮ → “Show original” — SPF, DKIM and DMARC should all say PASS, DKIM for this domain.\n");
  } catch (error) {
    console.error(`Brevo refused the test: ${error?.response || error?.message || error}`);
    console.error("If it says the sender isn't valid: authenticate the domain in Brevo first, then add the sender.\n");
    process.exit(1);
  }
}

process.exit(ready ? 0 : 1);
