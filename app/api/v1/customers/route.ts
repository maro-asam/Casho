import { withApiAuth } from "@/lib/api/middleware";
import { ok, err, paginated } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { dispatchWebhookEvent } from "@/lib/webhooks/events";
import type { ApiContext } from "@/lib/api/types";
import { z } from "zod";

// ─── GET /api/v1/customers ────────────────────────────────────────────────

async function listCustomers(req: Request, ctx: ApiContext) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const search = url.searchParams.get("q");

  const where = {
    storeId: ctx.store.id,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        address: true,
        status: true,
        points: true,
        walletBalance: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return paginated({
    data: customers,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// ─── POST /api/v1/customers ───────────────────────────────────────────────

const CreateCustomerSchema = z.object({
  phone: z.string().min(8),
  name: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

async function createCustomer(req: Request, ctx: ApiContext) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const parsed = CreateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Validation error", 422);
  }

  const { phone, name, email, address } = parsed.data;

  // Upsert — update if phone exists for this store
  const existing = await prisma.customer.findUnique({
    where: { storeId_phone: { storeId: ctx.store.id, phone } },
  });

  if (existing) {
    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(address && { address }),
      },
    });
    return ok(updated);
  }

  const customer = await prisma.customer.create({
    data: {
      storeId: ctx.store.id,
      phone,
      name,
      email,
      address,
    },
  });

  await dispatchWebhookEvent(ctx.store.id, "customer.created", {
    customer_id: customer.id,
    phone: customer.phone,
    name: customer.name,
  });

  return ok(customer, 201);
}

export const GET = withApiAuth(
  (req, ctx) => listCustomers(req, ctx),
  { scope: "customers:read" },
);

export const POST = withApiAuth(
  (req, ctx) => createCustomer(req, ctx),
  { scope: "customers:write" },
);
