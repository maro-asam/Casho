export type ReportPeriod = 7 | 30 | 90 | 365;

export type DailyDataPoint = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  visits: number;
};

export type StatusDataPoint = {
  name: string;
  value: number;
  status: string;
};

export type PaymentMethodData = {
  method: string;
  label: string;
  orders: number;
  revenue: number;
};

export type DayOfWeekData = {
  day: string;
  orders: number;
  revenue: number;
};

export type HourlyData = {
  hour: string;
  orders: number;
};

export type ProductStatItem = {
  id: string;
  name: string;
  category: string;
  sold: number;
  revenue: number;
  stock: number;
  performance: number;
};

export type CategoryData = {
  name: string;
  revenue: number;
  orders: number;
};

export type TopCustomer = {
  phone: string;
  name: string;
  orders: number;
  totalSpend: number;
};

export type LowStockProduct = {
  id: string;
  name: string;
  category: string;
  stock: number;
  threshold: number;
};

export type ReviewDistributionItem = {
  rating: number;
  count: number;
};

export type CouponReportItem = {
  id: string;
  code: string;
  type: string;
  value: number;
  usedThisPeriod: number;
  totalDiscount: number;
  isActive: boolean;
  expiresAt: Date | null;
};

export type ReportsData = {
  period: ReportPeriod;
  storeName: string;

  kpis: {
    revenue: { current: number; previous: number };
    netSales: { current: number; previous: number };
    orders: { current: number; previous: number };
    visits: { current: number; previous: number };
    conversionRate: { current: number; previous: number };
    aov: { current: number; previous: number };
    cancelRate: { current: number; previous: number };
    totalDiscount: { current: number; previous: number };
  };

  dailyData: DailyDataPoint[];
  statusData: StatusDataPoint[];
  paymentMethodData: PaymentMethodData[];
  dayOfWeekData: DayOfWeekData[];
  hourlyData: HourlyData[];

  topProductsByRevenue: ProductStatItem[];
  topProductsByQuantity: ProductStatItem[];
  categoryData: CategoryData[];
  productsWithNoSales: { id: string; name: string; category: string; stock: number }[];

  customerStats: {
    total: number;
    newThisPeriod: number;
    withOrders: number;
  };
  topCustomers: TopCustomer[];
  loyaltyStats: {
    totalEarned: number;
    totalRedeemed: number;
  };

  inventoryStats: {
    activeProducts: number;
    lowStock: number;
    outOfStock: number;
  };
  lowStockProducts: LowStockProduct[];

  reviewStats: {
    total: number;
    avgRating: number;
    distribution: ReviewDistributionItem[];
  };

  couponData: CouponReportItem[];
  totalDiscount: number;
  discountPercentage: number;
};
