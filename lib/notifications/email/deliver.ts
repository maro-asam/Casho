// How notification emails leave: up to three tries (SMTP hiccups are common
// and short), then one EmailLog row with the outcome. Runs inside after(), so
// the waits never hold up a response. Never throws.

import { after } from "next/server";

import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

/** After the response when inside a request; right away otherwise (scripts, tests). Never throws. */
export function inBackground(task: () => Promise<void>) {
  const run = () => task().catch((error) => console.error("[email]", error));
  try {
    after(run);
  } catch {
    void run();
  }
}

/** A dashboard page, absolute — for buttons in emails. */
export function dashboardUrl(path: string) {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://casho.store";
  return `${appUrl.replace(/\/$/, "")}/dashboard${path}`;
}

export type EmailKind = "ORDER_NEW" | "ORDER_CONFIRMATION" | "ORDER_STATUS" | "LOW_STOCK" | "OUT_OF_STOCK" | "PAYMENT_FAILED" | "SHARKS_APPLICATION";

/** Waits before the 2nd and 3rd tries. */
export const RETRY_DELAYS_MS = [1_000, 4_000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 5xx = the server refused for good (bad address, rejected content) — trying again won't help. */
function isPermanent(error: unknown) {
  const code = (error as { responseCode?: number } | null)?.responseCode;
  return typeof code === "number" && code >= 500;
}

export async function deliver(
  mail: Parameters<typeof sendMail>[0],
  meta: { kind: EmailKind; storeId?: string | null; refId?: string | null },
): Promise<boolean> {
  let attempts = 0;
  let failure: unknown = null;

  while (true) {
    attempts += 1;
    try {
      await sendMail(mail);
      failure = null;
      break;
    } catch (error) {
      failure = error;
      if (attempts > RETRY_DELAYS_MS.length || isPermanent(error)) break;
      await sleep(RETRY_DELAYS_MS[attempts - 1]);
    }
  }

  if (failure) console.error(`[email] ${meta.kind} to ${mail.to} failed after ${attempts} tries`, failure);

  await prisma.emailLog
    .create({
      data: {
        kind: meta.kind,
        storeId: meta.storeId ?? null,
        refId: meta.refId ?? null,
        to: mail.to,
        subject: mail.subject.slice(0, 300),
        status: failure ? "FAILED" : "SENT",
        attempts,
        error: failure ? String((failure as Error)?.message ?? failure).slice(0, 500) : null,
      },
    })
    .catch((error) => console.error("[email] log", error));

  return !failure;
}

/** An alert of this kind about refId already went out within the window — don't repeat it. */
export async function sentWithin(kind: EmailKind, refId: string, hours: number) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const count = await prisma.emailLog.count({ where: { kind, refId, status: "SENT", createdAt: { gte: since } } });
  return count > 0;
}
