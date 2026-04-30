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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

export const MerchantReportsCharts = ({
  revenueData,
  statusData,
}: MerchantReportsChartsProps) => {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle>المبيعات والطلبات</CardTitle>
          <CardDescription>
            مقارنة يومية بين المبيعات وعدد الطلبات خلال آخر 7 أيام.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="h-85">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.25}
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
                  stroke="hsl(var(--primary))"
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                  tickFormatter={(value) =>
                    `${numberFormatter.format(Number(value) / 1000)}k`
                  }
                />

                <Tooltip
                  formatter={(value, name) => {
                    if (name === "sales") {
                      return [formatMoney(Number(value)), "المبيعات"];
                    }

                    return [numberFormatter.format(Number(value)), name];
                  }}
                  labelStyle={{ color: "var(--primary)" }}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid var(--primary)",
                    background: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                    direction: "rtl",
                    textAlign: "right",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle>حالة الطلبات</CardTitle>
          <CardDescription>توزيع الطلبات حسب الحالة الحالية.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="h-57.5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={68}
                  outerRadius={92}
                  paddingAngle={4}
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
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid hsl(var(--primary))",
                    background: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                    direction: "rtl",
                    textAlign: "right",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {statusData.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        statusColors[item.status] || "hsl(var(--muted))",
                    }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>

                <span className="font-semibold">
                  {numberFormatter.format(item.value)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm xl:col-span-2">
        <CardHeader>
          <CardTitle>الزيارات مقابل الطلبات</CardTitle>
          <CardDescription>
            راقب تأثير زيارات المتجر على عدد الطلبات اليومية.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--primary))"
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  formatter={(value, name) => [
                    numberFormatter.format(Number(value)),
                    name === "orders" ? "طلبات" : "زيارات",
                  ]}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid hsl(var(--primary))",
                    background: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                    direction: "rtl",
                    textAlign: "right",
                  }}
                />

                <Bar
                  dataKey="visits"
                  radius={[12, 12, 0, 0]}
                  fill="var(--primary)"
                  opacity={0.35}
                />

                <Bar
                  dataKey="orders"
                  radius={[12, 12, 0, 0]}
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