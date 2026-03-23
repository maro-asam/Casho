import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";

const QuickActions = () => {
  return (
    <Card className="rounded-22xl">
      <CardHeader>
        <CardTitle className="text-primary">إجراءات سريعة</CardTitle>
        <CardDescription>أهم الاختصارات لإدارة المتجر</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Link href="/dashboard/products/new" className="block">
          <Button className="w-full justify-between rounded-xl">
            <span>إضافة منتج</span>
            <Plus className="size-4" />
          </Button>
        </Link>

        <Link href="/dashboard/products" className="block">
          <Button variant="outline" className="w-full rounded-xl">
            إدارة المنتجات
          </Button>
        </Link>

        <Link href="/dashboard/orders" className="block">
          <Button variant="outline" className="w-full rounded-xl">
            إدارة الطلبات
          </Button>
        </Link>

        <Link href="/dashboard/settings" className="block">
          <Button variant="outline" className="w-full rounded-xl">
            إعدادات المتجر
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
