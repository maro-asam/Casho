"use server";

import { mailTransporter } from "@/lib/mail";

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
): Promise<void> {
  const fromEmail = process.env.MAIL_FROM_EMAIL;
  const fromName = process.env.MAIL_FROM_NAME || "Casho";

  if (!fromEmail) {
    throw new Error("MAIL_FROM_EMAIL is missing");
  }

  const info = await mailTransporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: "إعادة تعيين كلمة المرور",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; color: #111827;">
        <div style="max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
          <h2 style="margin: 0 0 16px; font-size: 24px;">إعادة تعيين كلمة المرور</h2>

          <p style="margin: 0 0 12px;">
            وصلك طلب لإعادة تعيين كلمة المرور الخاصة بحسابك.
          </p>

          <p style="margin: 0 0 20px;">
            اضغط على الزر التالي لإكمال العملية:
          </p>

          <div style="margin: 24px 0;">
            <a
              href="${resetLink}"
              style="
                display: inline-block;
                background: #111827;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 20px;
                border-radius: 12px;
                font-weight: bold;
              "
            >
              إعادة تعيين كلمة المرور
            </a>
          </div>

          <p style="margin: 0 0 12px;">
            الرابط صالح لمدة 30 دقيقة فقط.
          </p>

          <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px;">
            لو أنت ما طلبتش إعادة تعيين كلمة المرور، تجاهل الرسالة دي.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

          <p style="margin: 0; color: #6b7280; font-size: 13px; word-break: break-all;">
            لو الزر ما اشتغلش، انسخ الرابط ده وافتحه في المتصفح:
            <br />
            <a href="${resetLink}">${resetLink}</a>
          </p>
        </div>
      </div>
    `,
    text: `افتح الرابط التالي لإعادة تعيين كلمة المرور: ${resetLink}`,
  });

  if (!info.messageId) {
    throw new Error("فشل إرسال الإيميل");
  }
}