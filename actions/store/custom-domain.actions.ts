"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { revalidatePath } from "next/cache";

const DOMAIN_REGEX =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(4, "النطاق قصير جداً")
  .max(253, "النطاق طويل جداً")
  .regex(DOMAIN_REGEX, "صيغة النطاق غير صحيحة — مثال: mystore.com");

export type DomainCheckResult =
  | { status: "valid" }
  | { status: "invalid"; reason: string }
  | { status: "taken" };

export async function checkDomainAvailabilityAction(
  domain: string
): Promise<DomainCheckResult> {
  const parsed = domainSchema.safeParse(domain);
  if (!parsed.success) {
    return { status: "invalid", reason: parsed.error.issues[0].message };
  }

  const clean = parsed.data;

  // Block casho.store subdomains from being registered as custom domains
  if (clean.endsWith(".casho.store") || clean === "casho.store") {
    return { status: "invalid", reason: "هذا النطاق محجوز ولا يمكن استخدامه" };
  }

  const existing = await prisma.store.findFirst({
    where: { customDomain: clean },
    select: { id: true },
  });

  if (existing) return { status: "taken" };

  return { status: "valid" };
}

export type ConnectDomainState = {
  success: boolean;
  message: string;
};

export async function connectCustomDomainAction(
  domain: string
): Promise<ConnectDomainState> {
  try {
    const userId = await requireUserId();

    const parsed = domainSchema.safeParse(domain);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const clean = parsed.data;

    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true, customDomain: true },
    });

    if (!store) {
      return { success: false, message: "لم يتم العثور على المتجر" };
    }

    const conflict = await prisma.store.findFirst({
      where: { customDomain: clean, id: { not: store.id } },
      select: { id: true },
    });

    if (conflict) {
      return { success: false, message: "هذا النطاق مستخدم من متجر آخر" };
    }

    await prisma.store.update({
      where: { id: store.id },
      data: {
        customDomain: clean,
        customDomainStatus: "PENDING",
        customDomainConnectedAt: new Date(),
      },
    });

    revalidatePath("/domain");
    return { success: true, message: "تم ربط النطاق بنجاح، الحالة: قيد المراجعة" };
  } catch {
    return { success: false, message: "حدث خطأ، حاول مرة أخرى" };
  }
}

export async function disconnectCustomDomainAction(): Promise<ConnectDomainState> {
  try {
    const userId = await requireUserId();

    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!store) {
      return { success: false, message: "لم يتم العثور على المتجر" };
    }

    await prisma.store.update({
      where: { id: store.id },
      data: {
        customDomain: null,
        customDomainStatus: "PENDING",
        customDomainConnectedAt: null,
      },
    });

    revalidatePath("/domain");
    return { success: true, message: "تم إلغاء ربط النطاق" };
  } catch {
    return { success: false, message: "حدث خطأ، حاول مرة أخرى" };
  }
}

export type DomainStatusResult = {
  customDomain: string | null;
  customDomainStatus: "PENDING" | "ACTIVE" | "FAILED";
  customDomainConnectedAt: Date | null;
};

export async function getDomainStatusAction(): Promise<DomainStatusResult | null> {
  try {
    const userId = await requireUserId();

    const store = await prisma.store.findFirst({
      where: { userId },
      select: {
        customDomain: true,
        customDomainStatus: true,
        customDomainConnectedAt: true,
      },
    });

    if (!store) return null;

    return {
      customDomain: store.customDomain,
      customDomainStatus: store.customDomainStatus as "PENDING" | "ACTIVE" | "FAILED",
      customDomainConnectedAt: store.customDomainConnectedAt,
    };
  } catch {
    return null;
  }
}
