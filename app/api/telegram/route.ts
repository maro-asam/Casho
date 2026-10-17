/**
 * Telegram bot webhook — links a merchant's chat to their store (/start TOKEN).
 *
 * Every update must carry the secret Telegram echoes back in
 * `X-Telegram-Bot-Api-Secret-Token`. Register the webhook once with:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>
 */
import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

function isFromTelegram(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const received = req.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!isFromTelegram(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

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
