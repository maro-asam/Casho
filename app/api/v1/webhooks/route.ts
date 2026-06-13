import { withApiAuth } from "@/lib/api/middleware";
import { ok, err, paginated } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";
import type { ApiContext } from "@/lib/api/types";
import { z } from "zod";
import { randomBytes } from "crypto";

const MAX_ENDPOINTS_PER_STORE = 20;

// ─── GET /api/v1/webhooks ─────────────────────────────────────────────────

async function listWebhooks(req: Request, ctx: ApiContext) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

  const [endpoints, total] = await Promise.all([
    prisma.webhookEndpoint.findMany({
      where: { storeId: ctx.store.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        url: true,
        events: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // Never return the signing secret in list
        _count: { select: { deliveries: true } },
      },
    }),
    prisma.webhookEndpoint.count({ where: { storeId: ctx.store.id } }),
  ]);

  return paginated({
    data: endpoints,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// ─── POST /api/v1/webhooks ────────────────────────────────────────────────

const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z
    .array(z.enum(WEBHOOK_EVENTS))
    .min(1, "At least one event is required"),
});

async function createWebhook(req: Request, ctx: ApiContext) {
  const count = await prisma.webhookEndpoint.count({
    where: { storeId: ctx.store.id },
  });
  if (count >= MAX_ENDPOINTS_PER_STORE) {
    return err(
      `Maximum of ${MAX_ENDPOINTS_PER_STORE} webhook endpoints per store`,
      409,
      "LIMIT_REACHED",
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const parsed = CreateWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Validation error", 422);
  }

  // Generate a random signing secret
  const secret = randomBytes(32).toString("hex");

  const endpoint = await prisma.webhookEndpoint.create({
    data: {
      storeId: ctx.store.id,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
    },
    select: {
      id: true,
      url: true,
      events: true,
      status: true,
      secret: true, // Return secret ONCE at creation time
      createdAt: true,
    },
  });

  return ok(
    {
      ...endpoint,
      _note: "Store this secret securely — it will not be shown again.",
    },
    201,
  );
}

export const GET = withApiAuth(
  (req, ctx) => listWebhooks(req, ctx),
  { scope: "webhooks:read" },
);

export const POST = withApiAuth(
  (req, ctx) => createWebhook(req, ctx),
  { scope: "webhooks:write" },
);
