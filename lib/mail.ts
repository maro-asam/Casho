import nodemailer, { type Transporter } from "nodemailer";

import { isFreeMailSender } from "./mail-auth";

let transporter: Transporter | null | undefined;
let warnedFreeMail = false;

/** Brevo SMTP, built on first use; null when its env vars are missing. */
function getTransporter() {
  if (transporter !== undefined) return transporter;

  const host = process.env.BREVO_SMTP_HOST;
  const port = Number(process.env.BREVO_SMTP_PORT || 587);
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS;

  transporter =
    host && user && pass
      ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
      : null;
  return transporter;
}

/** Optional emails (order notifications) are skipped when this is false. */
export function isMailConfigured() {
  return Boolean(getTransporter() && process.env.MAIL_FROM_EMAIL);
}

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Shown as the sender; the address is always MAIL_FROM_EMAIL. */
  fromName?: string;
  /** Falls back to MAIL_REPLY_TO, then none (replies go to the sender). */
  replyTo?: string | null;
}) {
  const smtp = getTransporter();
  const fromEmail = process.env.MAIL_FROM_EMAIL;
  if (!smtp) throw new Error("Brevo SMTP environment variables are missing");
  if (!fromEmail) throw new Error("MAIL_FROM_EMAIL is missing");
  if (!warnedFreeMail && isFreeMailSender(fromEmail)) {
    warnedFreeMail = true;
    console.warn(
      `[mail] MAIL_FROM_EMAIL (${fromEmail}) is a free-mail address: Brevo can't sign for it, so receivers fail DMARC and send it to spam. Use noreply@ on an authenticated domain — docs/email/deliverability.md`,
    );
  }

  // Quotes would end the display name early.
  const fromName = (input.fromName || process.env.MAIL_FROM_NAME || "Casho").replace(/["\\\r\n]/g, "");

  const info = await smtp.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: input.to,
    replyTo: input.replyTo || process.env.MAIL_REPLY_TO || undefined,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (!info.messageId) throw new Error("فشل إرسال الإيميل");
}
