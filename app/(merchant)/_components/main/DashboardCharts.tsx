"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";

type ChartDataItem = {
  name: string;
  revenue: number;
  orders: number;
  visits: number;
};

type DashboardChartsProps = {
  data: ChartDataItem[];
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}

const DashboardCharts = ({ data }: DashboardChartsProps) => {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="border border-border/20 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-6 space-y-1" dir="rtl">
            <h3 className="text-lg font-semibold">الأرباح</h3>
            <p className="text-sm text-muted-foreground">
              إجمالي الأرباح خلال آخر 30 يوم
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.3}
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
                  className="stroke-muted"
                />

                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  reversed
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  width={80}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("ar-EG", {
                      notation: "compact",
                    }).format(Number(value))
                  }
                />

                <Tooltip
                  formatter={(value) => {
                    const numericValue =
                      typeof value === "number" ? value : Number(value ?? 0);
                    return [formatPrice(numericValue), "الأرباح"];
                  }}
                  labelFormatter={(label) => `اليوم: ${label}`}
                  labelStyle={{ direction: "rtl" }}
                  contentStyle={{
                    direction: "rtl",
                    borderRadius: "16px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--background))",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#revenueFill)"
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/20 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-6 space-y-1" dir="rtl">
            <h3 className="text-lg font-semibold">الطلبات</h3>
            <p className="text-sm text-muted-foreground">
              عدد الطلبات خلال آخر 30 يوم
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-muted"
                />

                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  reversed
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  allowDecimals={false}
                />

                <Tooltip
                  formatter={(value) => {
                    const numericValue =
                      typeof value === "number" ? value : Number(value ?? 0);
                    return [`${numericValue} طلب`, "الطلبات"];
                  }}
                  labelFormatter={(label) => `اليوم: ${label}`}
                  labelStyle={{ direction: "rtl" }}
                  contentStyle={{
                    direction: "rtl",
                    borderRadius: "16px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--background))",
                  }}
                />

                <Bar
                  dataKey="orders"
                  fill="var(--primary)"
                  radius={[10, 10, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;