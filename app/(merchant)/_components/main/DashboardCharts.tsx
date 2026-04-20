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
import { BarChart3, Wallet2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function hasAnyData(data: ChartDataItem[]) {
  return data.some(
    (item) => item.revenue > 0 || item.orders > 0 || item.visits > 0,
  );
}

const tooltipStyle = {
  direction: "rtl" as const,
  borderRadius: "16px",
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--background))",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const DashboardCharts = ({ data }: DashboardChartsProps) => {
  const hasData = hasAnyData(data);

  return (
    <div className="grid gap-6 xl:grid-cols-2" dir="rtl">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet2 className="size-5" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-lg">الأرباح</CardTitle>
              <p className="text-sm text-muted-foreground">
                إجمالي الأرباح خلال آخر 30 يوم
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {!hasData ? (
            <EmptyChartState text="لا توجد بيانات أرباح كافية خلال آخر 30 يوم." />
          ) : (
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
                        stopOpacity={0.28}
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
                    contentStyle={tooltipStyle}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#revenueFill)"
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BarChart3 className="size-5" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-lg">الطلبات</CardTitle>
              <p className="text-sm text-muted-foreground">
                عدد الطلبات خلال آخر 30 يوم
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {!hasData ? (
            <EmptyChartState text="لا توجد بيانات طلبات كافية خلال آخر 30 يوم." />
          ) : (
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
                    contentStyle={tooltipStyle}
                  />

                  <Bar
                    dataKey="orders"
                    fill="var(--primary)"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function EmptyChartState({ text }: { text: string }) {
  return (
    <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
      <div className="space-y-2">
        <p className="font-medium text-foreground">لا توجد بيانات كافية</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

export default DashboardCharts;