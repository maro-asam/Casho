import { withApiAuth } from "@/lib/api/middleware";
import { ok, err, paginated } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { dispatchWebhookEvent } from "@/lib/webhooks/events";
import { emitInvoiceCreated, normalizeOrderToInvoice } from "@/lib/accounting/events";
import type { ApiContext } from "@/lib/api/types";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";

// ─── GET /api/v1/orders ───────────────────────────────────────────────────

async function listOrders(req: Request, ctx: ApiContext) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const statusParam = url.searchParams.get("status")?.toUpperCase();
  const status =
    statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined;

  const where = {
    storeId: ctx.store.id,
    ...(status && { status }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        status: true,
        source: true,
        paymentMethod: true,
        subtotal: true,
        shipping: true,
        discount: true,
        total: true,
        fullName: true,
        phone: true,
        address: true,
        notes: true,
        couponCode: true,
        paymentStatus: true,
        paymentReference: true,
        paidAt: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: { select: { id: true, name: true, slug: true, sku: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return paginated({
    data: orders,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// ─── POST /api/v1/orders ──────────────────────────────────────────────────

const CreateOrderSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(5),
  paymentMethod: z.string(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
});

async function createOrder(req: Request, ctx: ApiContext) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Validation error", 422, "VALIDATION_ERROR");
  }

  const { fullName, phone, address, paymentMethod, notes, items } = parsed.data;

  // Validate products belong to this store
  const products = await prisma.product.findMany({
    where: {
      id: { in: items.map((i) => i.productId) },
      storeId: ctx.store.id,
      isActive: true,
    },
    select: { id: true, name: true, price: true, stock: true, sku: true },
  });

  if (products.length !== items.length) {
    return err("One or more products not found or inactive", 422);
  }

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  // Check stock
  for (const item of items) {
    const product = productMap[item.productId]!;
    if (product.stock < item.quantity) {
      return err(`Insufficient stock for product: ${product.name}`, 422, "OUT_OF_STOCK");
    }
  }

  const orderItems = items.map((item) => {
    const product = productMap[item.productId]!;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: Math.round(product.price),
    };
  });

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal; // no shipping/discount via API for now

  const order = await prisma.order.create({
    data: {
      storeId: ctx.store.id,
      guestSessionId: `api_${Date.now()}`,
      fullName,
      phone,
      address,
      paymentMethod,
      notes,
      subtotal,
      total,
      source: "ONLINE",
      items: { create: orderItems },
    },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, sku: true } } },
      },
    },
  });

  // Webhook + accounting events (fire-and-forget)
  await Promise.allSettled([
    dispatchWebhookEvent(ctx.store.id, "order.created", {
      order_id: order.id,
      status: order.status,
      total: order.total,
      customer_name: order.fullName,
      customer_phone: order.phone,
    }),
    emitInvoiceCreated(ctx.store.id, normalizeOrderToInvoice(order)),
  ]);

  return ok(order, 201);
}

export const GET = withApiAuth(
  (req, ctx) => listOrders(req, ctx),
  { scope: "orders:read" },
);

export const POST = withApiAuth(
  (req, ctx) => createOrder(req, ctx),
  { scope: "orders:write" },
);
