/**
 * Accounting integration event stream.
 *
 * All financial events (invoices, payments, refunds) are emitted through this
 * module so they can be:
 *   1. Dispatched as webhooks to accounting integrations (QuickBooks, Xero, Odoo)
 *   2. Exported as normalized JSON for batch processing
 *
 * To integrate with an accounting platform, subscribe a WebhookEndpoint to the
 * relevant accounting events (invoice.created / payment.received / refund.issued).
 */

import { dispatchWebhookEvent } from "@/lib/webhooks/events";

// ─── Normalized financial models ──────────────────────────────────────────

export interface AccountingLineItem {
  description: string;
  quantity: number;
  unitAmountPiasters: number;
  totalAmountPiasters: number;
  productId?: string;
  sku?: string;
}

export interface AccountingInvoice {
  invoice_id: string;        // internal order ID
  external_reference?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  line_items: AccountingLineItem[];
  subtotal_piasters: number;
  discount_piasters: number;
  shipping_piasters: number;
  total_piasters: number;
  currency: "EGP";
  issued_at: string;         // ISO 8601
  due_at?: string;
}

export interface AccountingPayment {
  payment_id: string;
  invoice_id: string;
  amount_piasters: number;
  currency: "EGP";
  method: string;            // "cash_on_delivery" | "card" | "wallet" | ...
  reference?: string;        // gateway reference / transaction ID
  paid_at: string;           // ISO 8601
}

export interface AccountingRefund {
  refund_id: string;
  invoice_id: string;
  amount_piasters: number;
  currency: "EGP";
  reason?: string;
  refunded_at: string;       // ISO 8601
}

// ─── Emit helpers ─────────────────────────────────────────────────────────

export async function emitInvoiceCreated(
  storeId: string,
  invoice: AccountingInvoice,
): Promise<void> {
  await dispatchWebhookEvent(storeId, "invoice.created", invoice as unknown as Record<string, unknown>);
}

export async function emitPaymentReceived(
  storeId: string,
  payment: AccountingPayment,
): Promise<void> {
  await dispatchWebhookEvent(storeId, "payment.received", payment as unknown as Record<string, unknown>);
}

export async function emitRefundIssued(
  storeId: string,
  refund: AccountingRefund,
): Promise<void> {
  await dispatchWebhookEvent(storeId, "refund.issued", refund as unknown as Record<string, unknown>);
}

// ─── Normalizers — convert internal models to accounting format ───────────

export function normalizeOrderToInvoice(order: {
  id: string;
  fullName: string;
  phone: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  createdAt: Date;
  items: Array<{
    price: number;
    quantity: number;
    product: { name: string; sku?: string | null; id: string };
  }>;
}): AccountingInvoice {
  return {
    invoice_id: order.id,
    customer_name: order.fullName,
    customer_phone: order.phone,
    line_items: order.items.map((item) => ({
      description: item.product.name,
      quantity: item.quantity,
      unitAmountPiasters: item.price,
      totalAmountPiasters: item.price * item.quantity,
      productId: item.product.id,
      sku: item.product.sku ?? undefined,
    })),
    subtotal_piasters: order.subtotal,
    discount_piasters: order.discount,
    shipping_piasters: order.shipping,
    total_piasters: order.total,
    currency: "EGP",
    issued_at: order.createdAt.toISOString(),
  };
}
