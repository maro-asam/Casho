const TG_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function post(method: string, body: object) {
  try {
    await fetch(`${TG_API}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("Telegram Error:", err);
  }
}

/** Send a plain text message to any chat (admin or merchant). */
export async function sendTelegramMessage(text: string, chatId?: string) {
  const id = chatId ?? process.env.TELEGRAM_CHAT_ID;
  if (!id) return;
  await post("sendMessage", { chat_id: id, text });
}

/** Send a Markdown message with optional inline keyboard buttons. */
export async function sendTelegramMarkdown(
  chatId: string,
  text: string,
  inlineKeyboard?: { text: string; callback_data: string }[][],
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  };
  if (inlineKeyboard) {
    body.reply_markup = { inline_keyboard: inlineKeyboard };
  }
  await post("sendMessage", body);
}
