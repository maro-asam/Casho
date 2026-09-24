import Link from "next/link";
import { Metadata } from "next";
import { Layers, Pencil } from "lucide-react";
import { GetPlansForAdminAction } from "@/actions/admin/admin-plans.actions";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "الباقات — أدمن" };

export default async function AdminPlansPage() {
  const plans = await GetPlansForAdminAction();

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Layers className="size-6" />
            الباقات
          </h1>
          <p className="text-sm text-muted-foreground">إدارة أسعار الباقات ومميزاتها من مكان واحد.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/features">إدارة الميزات</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>كل الباقات</CardTitle>
          <CardDescription>
            الأسعار المعروضة قد تكون قيم مبدئية غير مؤكدة — راجع شارة &quot;غير مؤكدة&quot; قبل الإطلاق.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الباقة</TableHead>
                <TableHead>السعر الشهري</TableHead>
                <TableHead>السعر السنوي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التسعير</TableHead>
                <TableHead>المتاجر المشتركة</TableHead>
                <TableHead>الترتيب</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{formatMoneyFromPiasters(plan.monthlyPrice)}</TableCell>
                  <TableCell>{formatMoneyFromPiasters(plan.yearlyPrice)}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "مفعّلة" : "معطّلة"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {plan.pricingConfigured ? (
                      <Badge variant="secondary">مؤكدة</Badge>
                    ) : (
                      <Badge variant="destructive">غير مؤكدة</Badge>
                    )}
                  </TableCell>
                  <TableCell>{plan._count.stores.toLocaleString("ar-EG")}</TableCell>
                  <TableCell>{plan.sortOrder}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/plans/${plan.id}`}>
                        <Pencil className="size-3.5" />
                        تعديل
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
