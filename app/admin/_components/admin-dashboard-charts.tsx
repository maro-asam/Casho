/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MonthlyTopup = {
  month: string;
  amount: number;
  count: number;
};

type StatusBreakdown = {
  label: string;
  value: number;
};

type TopStoreByTopup = {
  name: string;
  amount: number;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function shortStoreName(name: string) {
  if (name.length <= 18) return name;
  return `${name.slice(0, 18)}...`;
}

export default function AdminDashboardCharts({
  monthlyTopups,
  statusBreakdown,
  topStoresByTopups,
}: {
  monthlyTopups: MonthlyTopup[];
  statusBreakdown: StatusBreakdown[];
  topStoresByTopups: TopStoreByTopup[];
}) {
  const monthlyAmountData = monthlyTopups.map((item) => ({
    ...item,
    amountLabel: formatPrice(item.amount),
  }));

  const monthlyCountData = monthlyTopups.map((item) => ({
    month: item.month,
    count: item.count,
  }));

  const topStoresData = topStoresByTopups.map((item) => ({
    ...item,
    shortName: shortStoreName(item.name),
  }));

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card className="rounded-[28px] border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">قيمة الشحنات المعتمدة</CardTitle>
          <CardDescription>
            إجمالي قيمة الشحنات المعتمدة خلال آخر 6 شهور.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {monthlyAmountData.every((item) => item.amount === 0) ? (
            <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              لا توجد بيانات كافية حاليًا
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyAmountData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value) => `${Math.round(value / 100)}ج`}
                  />
                  <Tooltip
                    // @ts-ignore
                    formatter={(value: number) => [
                      formatPrice(value),
                      "القيمة",
                    ]}
                    labelFormatter={(label) => `الشهر: ${label}`}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="amount"
                    radius={[12, 12, 0, 0]}
                    className="fill-primary"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">عدد الشحنات المعتمدة</CardTitle>
          <CardDescription>
            عدد عمليات الشحن المعتمدة خلال آخر 6 شهور.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {monthlyCountData.every((item) => item.count === 0) ? (
            <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              لا توجد بيانات كافية حاليًا
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyCountData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <Tooltip
                    // @ts-ignore

                    formatter={(value: number) => [value, "عدد الشحنات"]}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    className="stroke-sky-500"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">حالة المتاجر</CardTitle>
          <CardDescription>
            توزيع المتاجر حسب حالة الاشتراك الحالية.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {statusBreakdown.every((item) => item.value === 0) ? (
            <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              لا توجد بيانات كافية حاليًا
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusBreakdown}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  barSize={26}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    width={90}
                    fontSize={13}
                  />
                  <Tooltip
                    // @ts-ignore

                    formatter={(value: number) => [value, "عدد المتاجر"]}
                  />
                  <Bar
                    dataKey="value"
                    radius={[10, 10, 10, 10]}
                    className="fill-violet-500"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            أعلى المتاجر في الشحن المعتمد
          </CardTitle>
          <CardDescription>
            أكثر المتاجر حسب إجمالي الشحن المعتمد.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {topStoresData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              لا توجد بيانات كافية حاليًا
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topStoresData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  barSize={24}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value) => `${Math.round(value / 100)}ج`}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    tickLine={false}
                    axisLine={false}
                    width={130}
                    fontSize={12}
                  />
                  <Tooltip
                    // @ts-ignore

                    formatter={(value: number) => [
                      formatPrice(value),
                      "إجمالي الشحن",
                    ]}
                  />
                  <Bar
                    dataKey="amount"
                    radius={[10, 10, 10, 10]}
                    className="fill-emerald-500"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
