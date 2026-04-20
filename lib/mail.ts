import nodemailer from "nodemailer";

const host = process.env.BREVO_SMTP_HOST;
const port = Number(process.env.BREVO_SMTP_PORT || 587);
const user = process.env.BREVO_SMTP_USER;
const pass = process.env.BREVO_SMTP_PASS;

if (!host || !user || !pass) {
  throw new Error("Brevo SMTP environment variables are missing");
}

export const mailTransporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass,
  },
});
