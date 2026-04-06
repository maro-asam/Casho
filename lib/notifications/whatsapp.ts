import Twilio from "twilio";

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);

export async function sendWhatsAppMessage(body: string) {
  try {
    await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio sandbox
      to: "whatsapp:+201014344053", // رقمك
      body,
    });
  } catch (error) {
    console.error("WhatsApp Error:", error);
  }
}
