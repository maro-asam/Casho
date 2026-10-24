import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null | undefined;

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
  replyTo?: string | null;
}) {
  const smtp = getTransporter();
  const fromEmail = process.env.MAIL_FROM_EMAIL;
  if (!smtp) throw new Error("Brevo SMTP environment variables are missing");
  if (!fromEmail) throw new Error("MAIL_FROM_EMAIL is missing");

  // Quotes would end the display name early.
  const fromName = (input.fromName || process.env.MAIL_FROM_NAME || "Casho").replace(/["\\\r\n]/g, "");

  const info = await smtp.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: input.to,
    replyTo: input.replyTo || undefined,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (!info.messageId) throw new Error("فشل إرسال الإيميل");
}
