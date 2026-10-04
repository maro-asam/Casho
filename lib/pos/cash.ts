type ShiftOrder = {
  total: number;
  paymentMethod: string;
  splitPayments: { paymentMethod: string; amount: number }[];
};

/**
 * Cash a sale left in the drawer: the total minus whatever was paid by other
 * methods (change handed back is already excluded that way).
 */
export function cashKeptFromSale(order: ShiftOrder) {
  if (!order.splitPayments.length) return order.paymentMethod === "cash" ? order.total : 0;
  if (!order.splitPayments.some((p) => p.paymentMethod === "cash")) return 0;
  const nonCash = order.splitPayments.filter((p) => p.paymentMethod !== "cash").reduce((s, p) => s + p.amount, 0);
  return Math.max(0, order.total - nonCash);
}

/** Drawer count expected at close: float + cash sales + cash in/out − cash refunds (all piasters). */
export function expectedDrawerCash(input: {
  openingBalance: number;
  orders: ShiftOrder[];
  /** Sum of CASH_IN (positive) and CASH_OUT (negative) entries. */
  cashMovements: number;
  cashRefunds: number;
}) {
  const cashSales = input.orders.reduce((s, o) => s + cashKeptFromSale(o), 0);
  return input.openingBalance + cashSales + input.cashMovements - input.cashRefunds;
}
