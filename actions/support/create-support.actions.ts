"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

export async function createSupportRequest(formData: FormData) {
  const userId = await requireUserId();

  const title = String(formData.get("title") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!title || !message) {
    return {
      success: false,
      message: "يرجى إدخال جميع البيانات المطلوبة",
    };
  }

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  const request = await prisma.supportRequest.create({
    data: {
      title,
      message,
      userId,
      storeId: store?.id,
    },
  });

  try {
    await sendTelegramMessage(`
🆘 طلب دعم جديد على Casho

🏪 المتجر: ${store?.name ?? "غير معروف"}
🔗 الرابط: ${store?.slug ? `${process.env.NEXT_PUBLIC_APP_URL}/store/${store.slug}` : "غير متوفر"}

📌 العنوان:
${title}

📝 الرسالة:
${message}

🆔 رقم الطلب:
${request.id}

📂 مراجعة الطلبات:
${process.env.NEXT_PUBLIC_APP_URL}/admin/support-requests
`);
  } catch (error) {
    console.error("Telegram Error:", error);
  }

  return {
    success: true,
    message: "تم إرسال طلب الدعم بنجاح",
  };
}
