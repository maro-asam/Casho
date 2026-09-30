import type { OrderSource, OrderStatus } from "@prisma/client";
import type { Granularity, RangePreset } from "./range";

// All money values are piasters.

export type ReportTab = "overview" | "sales" | "products" | "customers" | "inventory" | "pos" | "coupons";

export type Delta = { current: number; previous: number };

export type SeriesPoint = {
  key: string;
  label: string;
  netSales: number;
  orders: number;
  profit: number;
  visitors: number;
  prevNetSales: number;
  prevOrders: number;
  prevProfit: number;
  prevVisitors: number;
};

export type Insight = { tone: "positive" | "warning" | "info"; text: string };

export type ProductRow = {
  id: string;
  name: string;
  image: string;
  category: string;
  units: number;
  netSales: number;
  /** null when the product has no cost price. */
  profit: number | null;
  margin: number | null;
  share: number;
  stock: number;
};

export type InventoryRow = {
  id: string;
  name: string;
  image: string;
  stock: number;
  /** Units sold per day over the last 90 days. */
  dailyRate: number;
  daysLeft: number | null;
  valueCost: number | null;
  valueRetail: number;
  lastSoldAt: Date | null;
};

export type TopCustomer = {
  key: string;
  customerId: string | null;
  name: string;
  phone: string;
  orders: number;
  spend: number;
  lastOrderAt: Date;
  isNew: boolean;
};

export type ReportsData = {
  range: {
    preset: RangePreset;
    fromKey: string;
    toKey: string;
    days: number;
    granularity: Granularity;
    label: string;
    previousLabel: string;
  };
  /** False only for a store that has never received an order. */
  hasEverSold: boolean;

  kpis: {
    netSales: Delta;
    grossProfit: Delta;
    orders: Delta;
    aov: Delta;
    visitors: Delta;
    conversion: Delta;
    customers: Delta;
    cancelRate: Delta;
  };

  pnl: {
    grossSales: Delta;
    discounts: Delta;
    returns: Delta;
    netSales: Delta;
    cogs: number;
    grossProfit: Delta;
    margin: Delta;
    shipping: number;
    /** Share (0–1) of net sales whose cost is known. */
    costCoverage: number;
    productsMissingCost: number;
    units: Delta;
    itemsPerOrder: number;
    collected: number;
    outstanding: number;
    outstandingOrders: number;
    canceledOrders: number;
    canceledValue: number;
    visits: number;
  };

  series: SeriesPoint[];
  channels: { source: OrderSource; orders: number; netSales: number; aov: number; share: number }[];
  payments: { method: string; label: string; amount: number; count: number; share: number }[];
  statuses: { status: OrderStatus; count: number; value: number }[];
  /** [weekday 0=Sunday][hour 0–23] → orders. */
  heatmap: number[][];
  weekdays: { weekday: number; orders: number; netSales: number }[];

  products: ProductRow[];
  productsSoldCount: number;
  /** How many products make 80% of net sales. */
  concentration: { products: number; share: number } | null;
  categories: { name: string; units: number; netSales: number; profit: number | null; share: number }[];
  unsold: { id: string; name: string; image: string; category: string; stock: number; valueRetail: number }[];
  unsoldCount: number;

  customers: {
    unique: Delta;
    new: number;
    returning: number;
    repeatRate: number;
    avgSpend: number;
    newRevenue: number;
    returningRevenue: number;
    walkInOrders: number;
    walkInSales: number;
    crmTotal: number;
    crmNew: number;
  };
  topCustomers: TopCustomer[];
  loyalty: { earned: number; redeemed: number };

  inventory: {
    activeProducts: number;
    units: number;
    valueCost: number;
    valueRetail: number;
    productsMissingCost: number;
    outOfStock: number;
    lowStock: number;
    deadStockValue: number;
    deadStockCount: number;
  };
  runningOut: InventoryRow[];
  deadStock: InventoryRow[];
  outOfStock: { id: string; name: string; image: string; lastSoldAt: Date | null; dailyRate: number }[];

  reviews: { periodCount: number; total: number; average: number; distribution: { rating: number; count: number }[] };

  pos: {
    orders: number;
    netSales: number;
    cashiers: { id: string; name: string; orders: number; netSales: number; aov: number; discounts: number }[];
    shifts: { count: number; open: number; netDifference: number; shortageShifts: number; shortage: number; overage: number };
    returns: { count: number; amount: number; rate: number; topProducts: { name: string; quantity: number; amount: number }[] };
  } | null;

  coupons: {
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    status: "active" | "inactive" | "expired" | "used_up";
    uses: number;
    discount: number;
    sales: number;
    customers: number;
  }[];
  couponShare: number;

  insights: Insight[];
};
