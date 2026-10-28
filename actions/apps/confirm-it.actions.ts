"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { encryptSecret } from "@/lib/secrets";
import { getConfirmItApp, newCallbackToken, sendConfirmItTest } from "@/lib/apps/confirm-it";
import { CONFIRM_IT_APP_ID, isValidWebhookUrl, type ConfirmItSecrets, type ConfirmItSettings } from "@/lib/apps/confirm-it/payload";

type ActionResult = { success: boolean; message: string };

async function getStoreId() {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  return store?.id ?? null;
}

function revalidateApps() {
  revalidatePath("/dashboard/apps");
  revalidatePath("/dashboard/apps/confirm-it");
}

/** Installs the app on first save; later saves update it. A blank API key keeps the stored one. */
export async function SaveConfirmItAction(formData: FormData): Promise<ActionResult> {
  const storeId = await getStoreId();
  if (!storeId) return { success: false, message: "المتجر غير موجود" };

  const webhookUrl = String(formData.get("webhookUrl") ?? "").trim();
  const apiKeyInput = String(formData.get("apiKey") ?? "").trim();
  const settings: ConfirmItSettings = { webhookUrl, codOnly: formData.get("codOnly") === "on" };

  if (!webhookUrl) return { success: false, message: "رابط الـ Webhook مطلوب" };
  if (!isValidWebhookUrl(webhookUrl)) return { success: false, message: "رابط الـ Webhook لازم يبدأ بـ https://" };
  if (apiKeyInput.length > 500) return { success: false, message: "مفتاح API طويل جداً" };

  const existing = await getConfirmItApp(storeId);
  // Keep the callback URL the merchant already pasted in Confirm It; a new one only on install.
  const fresh = existing?.secrets ? null : newCallbackToken();
  const secrets: ConfirmItSecrets = {
    callbackToken: existing?.secrets?.callbackToken ?? fresh?.token ?? "",
    apiKey: apiKeyInput || existing?.secrets?.apiKey || undefined,
  };
  const credentials = encryptSecret(JSON.stringify(secrets));
  const tokenHash = fresh ? { callbackTokenHash: fresh.hash } : {};

  await prisma.storeApp.upsert({
    where: { storeId_appId: { storeId, appId: CONFIRM_IT_APP_ID } },
    create: { storeId, appId: CONFIRM_IT_APP_ID, settings, credentials, ...tokenHash },
    update: { settings, credentials, ...tokenHash },
  });

  revalidateApps();
  return { success: true, message: existing ? "تم حفظ إعدادات Confirm It" : "تم تثبيت Confirm It على متجرك 🎉" };
}

export async function ToggleConfirmItAction(isActive: boolean): Promise<ActionResult> {
  const storeId = await getStoreId();
  if (!storeId) return { success: false, message: "المتجر غير موجود" };
  const res = await prisma.storeApp.updateMany({ where: { storeId, appId: CONFIRM_IT_APP_ID }, data: { isActive } });
  if (res.count === 0) return { success: false, message: "التطبيق مش متثبت" };
  revalidateApps();
  return { success: true, message: isActive ? "Confirm It شغال — الطلبات الجديدة هتتبعتله" : "Confirm It اتوقف مؤقتاً" };
}

/** New callback URL — the old one stops working right away. */
export async function RegenerateConfirmItCallbackAction(): Promise<ActionResult> {
  const storeId = await getStoreId();
  if (!storeId) return { success: false, message: "المتجر غير موجود" };
  const app = await getConfirmItApp(storeId);
  if (!app) return { success: false, message: "التطبيق مش متثبت" };

  const { token, hash } = newCallbackToken();
  const secrets: ConfirmItSecrets = { ...(app.secrets ?? {}), callbackToken: token };
  await prisma.storeApp.update({
    where: { id: app.row.id },
    data: { credentials: encryptSecret(JSON.stringify(secrets)), callbackTokenHash: hash },
  });
  revalidateApps();
  return { success: true, message: "اتعمل رابط جديد — حدّثه في لوحة Confirm It" };
}

export async function TestConfirmItAction(): Promise<ActionResult> {
  const storeId = await getStoreId();
  if (!storeId) return { success: false, message: "المتجر غير موجود" };
  const result = await sendConfirmItTest(storeId);
  revalidateApps();
  return result.ok
    ? { success: true, message: "Confirm It استلم آخر طلب كتجربة ✅" }
    : { success: false, message: `فشل الإرسال: ${result.error}` };
}

export async function UninstallConfirmItAction(): Promise<ActionResult> {
  const storeId = await getStoreId();
  if (!storeId) return { success: false, message: "المتجر غير موجود" };
  await prisma.storeApp.deleteMany({ where: { storeId, appId: CONFIRM_IT_APP_ID } });
  revalidateApps();
  return { success: true, message: "تم إلغاء تثبيت Confirm It" };
}
