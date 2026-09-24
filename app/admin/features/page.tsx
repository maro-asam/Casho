import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";
import { GetFeaturesForAdminAction } from "@/actions/admin/admin-plans.actions";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FeatureRow } from "./_components/FeatureRow";

export const metadata: Metadata = { title: "الميزات — أدمن" };

export default async function AdminFeaturesPage() {
  const features = await GetFeaturesForAdminAction();

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <Link href="/admin/plans" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="size-3.5" />
          الباقات
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ListChecks className="size-6" />
          سجل الميزات
        </h1>
        <p className="text-sm text-muted-foreground">
          الميزات المعطّلة هنا لا تظهر في صفحة مقارنة الباقات للعملاء — فعّلها فقط بعد بناء الميزة فعليًا في المنتج.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>كل الميزات</CardTitle>
          <CardDescription>الاسم والوصف يظهران للعميل في صفحة الباقات (إن كانت الميزة مفعّلة).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المفتاح</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الوحدة</TableHead>
                <TableHead>مفعّلة للعرض</TableHead>
                <TableHead>الترتيب</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature) => (
                <FeatureRow key={feature.id} feature={feature} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
