"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

type RevenuePoint = {
  day: string;
  sales: number;
  orders: number;
  visits: number;
};

type StatusPoint = {
  name: string;
  value: number;
  status: string;
};

type MerchantReportsChartsProps = {
  revenueData: RevenuePoint[];
  statusData: StatusPoint[];
};

const numberFormatter = new Intl.NumberFormat("ar-EG");

const moneyFormatter = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const formatMoney = (amountInPiasters: number) =>
  moneyFormatter.format(amountInPiasters / 100);

const statusColors: Record<string, string> = {
  PENDING: "hsl(38 92% 50%)",
  PAID: "hsl(217 91% 60%)",
  SHIPPED: "hsl(262 83% 58%)",
  DELIVERED: "hsl(160 84% 39%)",
  CANCELED: "hsl(0 84% 60%)",
};

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  direction: "rtl" as const,
  textAlign: "right" as const,
  fontSize: 13,
};

export const MerchantReportsCharts = ({
  revenueData,
  statusData,
}: MerchantReportsChartsProps) => {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
      {/* Area chart */}
      <Card className="... border-border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-4" />
            </span>
            المبيعات اليومية
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            مقارنة يومية للمبيعات خلال آخر 7 أيام
          </p>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(v) =>
                    `${numberFormatter.format(Number(v) / 1000)}k`
                  }
                />

                <Tooltip
                  formatter={(value, name) =>
                    name === "sales"
                      ? [formatMoney(Number(value)), "المبيعات"]
                      : [numberFormatter.format(Number(value)), name]
                  }
                  labelStyle={{ color: "hsl(var(--primary))", fontWeight: 700 }}
                  contentStyle={tooltipStyle}
                />

                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie chart */}
      <Card className="... border-border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="size-4" />
            </span>
            حالة الطلبات
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            توزيع الطلبات حسب الحالة
          </p>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={84}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={statusColors[entry.status] || "hsl(var(--muted))"}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => [
                    numberFormatter.format(Number(value)),
                    "طلب",
                  ]}
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-2">
            {statusData.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor:
                        statusColors[item.status] || "hsl(var(--muted))",
                    }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-bold">
                  {numberFormatter.format(item.value)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bar chart — full width */}
      <Card className="... border-border shadow-sm xl:col-span-2">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="size-4" />
            </span>
            الزيارات مقابل الطلبات
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            راقب تأثير زيارات المتجر على عدد الطلبات اليومية
          </p>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />

                <Tooltip
                  formatter={(value, name) => [
                    numberFormatter.format(Number(value)),
                    name === "orders" ? "طلبات" : "زيارات",
                  ]}
                  contentStyle={tooltipStyle}
                />

                <Bar
                  dataKey="visits"
                  radius={[8, 8, 0, 0]}
                  fill="var(--primary)"
                  opacity={0.25}
                />

                <Bar
                  dataKey="orders"
                  radius={[8, 8, 0, 0]}
                  fill="var(--primary)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
