import { NextRequest, NextResponse } from "next/server";
import {
  approveTopupRequestAction,
  rejectTopupRequestAction,
} from "@/actions/admin/admin-topup.actions";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // ── Admin callback_query (approve / reject topup) ──────────────────────────
  const callbackQuery = body.callback_query;
  if (callbackQuery) {
    const [action, requestId] = (callbackQuery.data as string).split("_");
    try {
      if (action === "approve") await approveTopupRequestAction(requestId);
      if (action === "reject") await rejectTopupRequestAction(requestId);
    } catch (e) {
      console.error(e);
    }
    return NextResponse.json({ ok: true });
  }

  // ── Merchant linking via /start TOKEN ──────────────────────────────────────
  const message = body.message;
  if (message?.text) {
    const text: string = message.text.trim();
    const chatId = String(message.chat.id);
    const firstName: string = message.from?.first_name ?? "";

    if (text.startsWith("/start")) {
      const token = text.split(" ")[1]?.trim();

      if (!token) {
        await sendTelegramMessage(
          `مرحباً ${firstName}! أرسل الرمز الموجود في لوحة التحكم للربط.`,
          chatId,
        );
        return NextResponse.json({ ok: true });
      }

      const settings = await prisma.storeSettings.findFirst({
        where: { telegramLinkToken: token },
        include: { store: { select: { name: true } } },
      });

      if (!settings) {
        await sendTelegramMessage(
          "❌ الرمز غير صحيح أو منتهي الصلاحية. ارجع للوحة التحكم وانسخ الرمز من جديد.",
          chatId,
        );
        return NextResponse.json({ ok: true });
      }

      await prisma.storeSettings.update({
        where: { id: settings.id },
        data: { telegramChatId: chatId, telegramLinkToken: null },
      });

      await sendTelegramMessage(
        `✅ تم ربط متجر "${settings.store.name}" بنجاح!\nسيصلك إشعار فوري عند كل طلب جديد.`,
        chatId,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
