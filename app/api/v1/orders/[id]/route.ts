import { withApiAuth } from "@/lib/api/middleware";
import { ok, err } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { dispatchWebhookEvent } from "@/lib/webhooks/events";
import { emitPaymentReceived } from "@/lib/accounting/events";
import type { ApiContext } from "@/lib/api/types";
import { z } from "zod";

const ORDER_FIELDS = {
  id: true,
  status: true,
  source: true,
  paymentMethod: true,
  paymentStatus: true,
  paymentReference: true,
  paidAt: true,
  subtotal: true,
  shipping: true,
  discount: true,
  total: true,
  fullName: true,
  phone: true,
  address: true,
  notes: true,
  couponCode: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      quantity: true,
      price: true,
      product: { select: { id: true, name: true, slug: true, sku: true } },
    },
  },
} as const;

// ─── GET /api/v1/orders/:id ───────────────────────────────────────────────

async function getOrder(req: Request, ctx: ApiContext, params: { id: string }) {
  const order = await prisma.order.findFirst({
    where: { id: params.id, storeId: ctx.store.id },
    select: ORDER_FIELDS,
  });

  if (!order) return err("Order not found", 404);
  return ok(order);
}

// ─── PATCH /api/v1/orders/:id ─────────────────────────────────────────────

const UpdateOrderSchema = z.object({
  status: z
    .enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELED"])
    .optional(),
  paymentStatus: z.string().optional(),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

async function updateOrder(req: Request, ctx: ApiContext, params: { id: string }) {
  const existing = await prisma.order.findFirst({
    where: { id: params.id, storeId: ctx.store.id },
    select: { id: true, status: true, paymentMethod: true, total: true, storeId: true },
  });

  if (!existing) return err("Order not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const parsed = UpdateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Validation error", 422);
  }

  const { status, paymentStatus, paymentReference, notes } = parsed.data;

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: {
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(paymentReference && { paymentReference }),
      ...(notes !== undefined && { notes }),
      ...(status === "PAID" && { paidAt: new Date() }),
    },
    select: ORDER_FIELDS,
  });

  // Emit events based on new status
  const events: Promise<unknown>[] = [
    dispatchWebhookEvent(ctx.store.id, "order.updated", {
      order_id: updated.id,
      status: updated.status,
      previous_status: existing.status,
    }),
  ];

  if (status === "PAID" && existing.status !== "PAID") {
    events.push(
      dispatchWebhookEvent(ctx.store.id, "order.paid", {
        order_id: updated.id,
        total: updated.total,
        payment_method: updated.paymentMethod,
        payment_reference: paymentReference,
      }),
      emitPaymentReceived(ctx.store.id, {
        payment_id: `${updated.id}_pay`,
        invoice_id: updated.id,
        amount_piasters: updated.total,
        currency: "EGP",
        method: updated.paymentMethod,
        reference: paymentReference,
        paid_at: new Date().toISOString(),
      }),
    );
  }

  await Promise.allSettled(events);

  return ok(updated);
}

export const GET = withApiAuth(
  (req, ctx, params: { id: string }) => getOrder(req, ctx, params),
  { scope: "orders:read" },
);

export const PATCH = withApiAuth(
  (req, ctx, params: { id: string }) => updateOrder(req, ctx, params),
  { scope: "orders:write" },
);
