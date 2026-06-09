"use client";

import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";

type Analytics = {
  healthDistribution: { HEALTHY: number; ACTIVE: number; AT_RISK: number; LOST: number };
  retentionRate: number;
  churnRate: number;
  repeatPurchaseRate: number;
  avgLTV: number;
  totalLTV: number;
  monthlyGrowth: { month: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  activeCurrent: number;
  activePrev: number;
  retained: number;
};

type Stats = {
  totalCustomers: number;
  newThisMonth: number;
  newGrowthPct: number;
  activeCustomers: number;
  vipCustomers: number;
  atRiskCount: number;
  loyaltyStats: { totalEarned: number; totalRedeemed: number };
  topCustomers: {
    customerId: string | null;
    totalSpend: number;
    orderCount: number;
    customer: { id: string; name: string | null; phone: string; status: string } | null;
  }[];
  growthData: { date: string; count: number }[];
};

const HEALTH_COLORS = {
  HEALTHY: "#10B981",
  ACTIVE: "#3B82F6",
  AT_RISK: "#F59E0B",
  LOST: "#EF4444",
};
const HEALTH_LABELS = {
  HEALTHY: "صحي",
  ACTIVE: "نشط",
  AT_RISK: "في خطر",
  LOST: "خامل",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#10B981",
  VIP: "#F59E0B",
  INACTIVE: "#6B7280",
  BLOCKED: "#EF4444",
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  VIP: "VIP",
  INACTIVE: "غير نشط",
  BLOCKED: "محظور",
};

const PERIODS = [
  { label: "30 يوم", value: 30 },
  { label: "60 يوم", value: 60 },
  { label: "90 يوم", value: 90 },
  { label: "سنة", value: 365 },
];

export function CRMAnalyticsClient({
  analytics,
  stats,
  currentPeriod,
}: {
  analytics: Analytics;
  stats: Stats;
  currentPeriod: number;
}) {
  const router = useRouter();

  const healthPieData = Object.entries(analytics.healthDistribution)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: HEALTH_LABELS[k as keyof typeof HEALTH_LABELS],
      value: v,
      color: HEALTH_COLORS[k as keyof typeof HEALTH_COLORS],
    }));

  const statusPieData = analytics.statusDistribution
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] ?? s.status,
      value: s.count,
      color: STATUS_COLORS[s.status] ?? "#6B7280",
    }));

  const monthLabels: Record<string, string> = {
    "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
    "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
    "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
  };

  const monthlyData = analytics.monthlyGrowth.map((m) => ({
    month: monthLabels[m.month.split("-")[1]] ?? m.month,
    عملاء: m.count,
  }));

  const dailyGrowth = stats.growthData.map((d) => ({
    date: d.date,
    عملاء: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">الفترة:</span>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => router.push(`/dashboard/crm/analytics?period=${p.value}`)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                currentPeriod === p.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="معدل الاحتفاظ"
          value={`${analytics.retentionRate}%`}
          color="emerald"
          hint="العملاء الذين أعادوا الشراء"
        />
        <MetricCard
          label="معدل الفقد"
          value={`${analytics.churnRate}%`}
          color="rose"
          hint="العملاء الذين توقفوا"
        />
        <MetricCard
          label="معدل التكرار"
          value={`${analytics.repeatPurchaseRate}%`}
          color="blue"
          hint="العملاء بأكثر من طلب"
        />
        <MetricCard
          label="متوسط LTV"
          value={formatMoneyFromPiasters(analytics.avgLTV)}
          color="violet"
          hint="متوسط قيمة العميل مدى الحياة"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">نمو العملاء الشهري (6 أشهر)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="عملاء" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily growth last 30 days */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">عملاء جدد — آخر 30 يوم</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyGrowth.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                لا توجد بيانات كافية
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyGrowth}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="عملاء"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#growthGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Health Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">توزيع صحة العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            {healthPieData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                لا توجد بيانات
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie
                      data={healthPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {healthPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {healthPieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span>{d.name}</span>
                      </div>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">توزيع حالة العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            {statusPieData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                لا توجد بيانات
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {statusPieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span>{d.name}</span>
                      </div>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">أعلى العملاء قيمةً (LTV)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stats.topCustomers.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              لا توجد بيانات
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">العميل</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">الطلبات</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">إجمالي الإنفاق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.topCustomers.map((c, i) => (
                  <tr key={c.customerId ?? i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-bold text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.customer?.name ?? c.customer?.phone ?? "—"}</p>
                      {c.customer?.phone && c.customer.name && (
                        <p className="text-xs text-muted-foreground">{c.customer.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{c.orderCount}</td>
                    <td className="px-4 py-3 font-semibold text-primary">
                      {formatMoneyFromPiasters(c.totalSpend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: string;
  color: "emerald" | "rose" | "blue" | "violet";
  hint?: string;
}) {
  const colorMap = {
    emerald: "text-emerald-600 bg-emerald-500/10",
    rose: "text-rose-600 bg-rose-500/10",
    blue: "text-blue-600 bg-blue-500/10",
    violet: "text-violet-600 bg-violet-500/10",
  };
  return (
    <Card className={`p-4 ${colorMap[color]}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] opacity-60">{hint}</p>}
    </Card>
  );
}
