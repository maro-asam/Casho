// Digital products (Product.isDigital): never run out, never ship, and their
// file/link is handed over on the order page once the order is paid.

/** What a digital product reports as stock wherever a number is expected. */
export const DIGITAL_STOCK = 1_000_000;

export function stockOf(product: { stock: number; isDigital?: boolean | null }) {
  return product.isDigital ? DIGITAL_STOCK : product.stock;
}

/**
 * Paid online, marked paid by the merchant, or delivered (cash collected).
 * Same rule the dashboard's order page uses for "مدفوع".
 */
export function isOrderPaid(order: { paidAt?: Date | null; paymentStatus?: string | null; paymentMethod: string; status: string }) {
  return (
    Boolean(order.paidAt) ||
    order.paymentStatus === "PAID" ||
    (order.paymentMethod !== "cash_on_delivery" && ["PAID", "SHIPPED", "DELIVERED"].includes(order.status)) ||
    order.status === "DELIVERED"
  );
}

export const DIGITAL_ADDRESS = "منتج رقمي — من غير شحن";
