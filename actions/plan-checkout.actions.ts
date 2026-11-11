"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { canonicalPhone } from "@/lib/fraud/phone";
import { createPaymobCheckout, getPlatformPaymobCredentials, paymobCallbackBaseUrl } from "@/lib/paymob";
import {
  PLAN_REFERENCE_PREFIX,
  isDirectPlanCheckoutEnabled,
  isPlanCheckoutRateLimited,
  recordPlanCheckout,
  type PlanCheckoutMeta,
} from "@/lib/payments/plan-checkout";

// TEMP — see lib/payments/plan-checkout.ts.

const inputSchema = z.object({
  planId: z.string().min(1),
  cycle: z.enum(["MONTHLY", "YEARLY"]),
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .transform(canonicalPhone)
    .pipe(z.string().regex(/^01[0125]\d{8}$/)),
  email: z.string().trim().toLowerCase().email().max(120),
});

export type StartPlanCheckoutResult =
  | { success: true; url: string }
  | { success: false; error: "invalid" | "rate_limited" | "unavailable" | "failed" };

/** Opens Paymob's hosted checkout for one plan period. Prices come from the DB, never the client. */
export async function StartPlanCheckoutAction(raw: z.input<typeof inputSchema>): Promise<StartPlanCheckoutResult> {
  if (!isDirectPlanCheckoutEnabled()) return { success: false, error: "unavailable" };

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "invalid" };
  const input = parsed.data;

  try {
    const h = await headers();
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null;
    const userAgent = h.get("user-agent")?.slice(0, 500) || null;

    if (await isPlanCheckoutRateLimited({ phone: input.phone, ipAddress })) {
      return { success: false, error: "rate_limited" };
    }

    const plan = await prisma.plan.findFirst({
      where: { id: input.planId, isActive: true },
      select: { id: true, key: true, name: true, monthlyPrice: true, yearlyPrice: true },
    });
    if (!plan) return { success: false, error: "invalid" };

    const amount = input.cycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
    if (!Number.isInteger(amount) || amount <= 0) return { success: false, error: "unavailable" };

    const creds = getPlatformPaymobCredentials();
    if (!creds) return { success: false, error: "unavailable" };

    const meta: PlanCheckoutMeta = {
      reference: `${PLAN_REFERENCE_PREFIX}${randomUUID()}`,
      planId: plan.id,
      planKey: plan.key,
      planName: plan.name,
      cycle: input.cycle,
      amount,
      name: input.name,
      phone: input.phone,
      email: input.email,
    };
    // Recorded first: the callback needs this row to recognise the payment.
    await recordPlanCheckout(meta, { ipAddress, userAgent });

    const callbackUrl = `${paymobCallbackBaseUrl()}/api/payments/paymob/plan`;
    const cycleLabel = input.cycle === "YEARLY" ? "yearly" : "monthly";
    const { url } = await createPaymobCheckout(creds, {
      amountCents: amount,
      items: [{ name: `Casho ${plan.key} plan (${cycleLabel})`, amountCents: amount, quantity: 1 }],
      billing: { firstName: input.name, phone: input.phone, email: input.email },
      specialReference: meta.reference,
      notificationUrl: callbackUrl,
      redirectionUrl: callbackUrl,
      extras: { type: "plan", planKey: plan.key, cycle: input.cycle },
    });

    return { success: true, url };
  } catch (error) {
    console.error("StartPlanCheckoutAction Error:", error);
    return { success: false, error: "failed" };
  }
}
