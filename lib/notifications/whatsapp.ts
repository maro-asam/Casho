import Twilio from "twilio";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return Twilio(sid, token);
}

function getFromNumber() {
  return (
    process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886"
  );
}

function normalizeToWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // Egyptian local number (starts with 0)
  if (digits.startsWith("0") && digits.length === 11) {
    return `whatsapp:+2${digits}`;
  }

  // Already has country code
  if (digits.length > 11) {
    return `whatsapp:+${digits}`;
  }

  // Fallback — use as-is with +
  return `whatsapp:+${digits}`;
}

function formatEgp(piasters: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(piasters / 100);
}

const paymentLabels: Record<string, string> = {
  cash_on_delivery: "كاش عند الاستلام",
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
  bank_transfer: "تحويل بنكي",
  kashier: "بطاقة بنكية",
};

export async function sendWhatsAppOrderNotification(
  merchantPhone: string,
  order: {
    id: string;
    customerName: string;
    customerPhone: string;
    address: string;
    total: number;
    paymentMethod: string;
    itemCount: number;
    storeName: string;
  },
) {
  const client = getClient();
  if (!client) return;

  const to = normalizeToWhatsApp(merchantPhone);
  const paymentLabel = paymentLabels[order.paymentMethod] ?? order.paymentMethod;
  const dashboardUrl = `${process.env.APP_URL ?? "https://casho.store"}/dashboard/orders`;

  const body = [
    `🛍️ طلب جديد على متجر ${order.storeName}`,
    "",
    `👤 العميل: ${order.customerName}`,
    `📞 التليفون: ${order.customerPhone}`,
    `📍 العنوان: ${order.address}`,
    `💰 المبلغ: ${formatEgp(order.total)}`,
    `💳 الدفع: ${paymentLabel}`,
    `📦 عدد المنتجات: ${order.itemCount}`,
    "",
    `🔗 ${dashboardUrl}`,
  ].join("\n");

  try {
    await client.messages.create({
      from: getFromNumber(),
      to,
      body,
    });
  } catch (error) {
    console.error("WhatsApp notification error:", error);
  }
}
