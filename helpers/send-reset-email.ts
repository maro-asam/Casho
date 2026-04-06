import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const { data, error } = await resend.emails.send({
    from: "marooasam1@gmail.com",
    to: [to],
    subject: "إعادة تعيين كلمة المرور",
    html: `
      <div style="font-family: sans-serif; direction: rtl; text-align: right;">
        <h2>إعادة تعيين كلمة المرور</h2>
        <p>اضغط على الزر لتغيير كلمة المرور:</p>
        <a href="${resetLink}"
           style="display:inline-block;padding:10px 16px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">
           تغيير كلمة المرور
        </a>
        <p style="margin-top:10px;font-size:12px;color:#666;">
          الرابط صالح لمدة 30 دقيقة فقط.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message || "فشل إرسال الإيميل");
  }

  console.log("Resend success:", data);
}