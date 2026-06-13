import { withApiAuth } from "@/lib/api/middleware";
import { ok, err } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";
import type { ApiContext } from "@/lib/api/types";
import { z } from "zod";

// ─── PATCH /api/v1/webhooks/:id ───────────────────────────────────────────

const UpdateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

async function updateWebhook(req: Request, ctx: ApiContext, params: { id: string }) {
  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: { id: params.id, storeId: ctx.store.id },
    select: { id: true },
  });

  if (!endpoint) return err("Webhook endpoint not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const parsed = UpdateWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Validation error", 422);
  }

  const updated = await prisma.webhookEndpoint.update({
    where: { id: params.id },
    data: parsed.data,
    select: {
      id: true,
      url: true,
      events: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return ok(updated);
}

// ─── DELETE /api/v1/webhooks/:id ──────────────────────────────────────────

async function deleteWebhook(req: Request, ctx: ApiContext, params: { id: string }) {
  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: { id: params.id, storeId: ctx.store.id },
    select: { id: true },
  });

  if (!endpoint) return err("Webhook endpoint not found", 404);

  await prisma.webhookEndpoint.delete({ where: { id: params.id } });

  return ok({ deleted: true, id: params.id });
}

export const PATCH = withApiAuth(
  (req, ctx, params: { id: string }) => updateWebhook(req, ctx, params),
  { scope: "webhooks:write" },
);

export const DELETE = withApiAuth(
  (req, ctx, params: { id: string }) => deleteWebhook(req, ctx, params),
  { scope: "webhooks:write" },
);
