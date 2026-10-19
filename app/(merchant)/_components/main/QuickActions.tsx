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
import { tr } from "@/lib/i18n/dashboard";

const QuickActions = () => {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-primary">{tr("إجراءات سريعة")}</CardTitle>
        <CardDescription>{tr("أهم الاختصارات لإدارة المتجر")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Link href="/products/new" className="block">
          <Button className="w-full justify-between rounded-xl">
            <span>{tr("إضافة منتج")}</span>
            <Plus className="size-4" />
          </Button>
        </Link>

        <Link href="/products" className="block">
          <Button variant="outline" className="w-full rounded-xl">
            {tr("إدارة المنتجات")}
          </Button>
        </Link>

        <Link href="/orders" className="block">
          <Button variant="outline" className="w-full rounded-xl">
            {tr("إدارة الطلبات")}
          </Button>
        </Link>

        <Link href="/settings" className="block">
          <Button variant="outline" className="w-full rounded-xl">
            {tr("إعدادات المتجر")}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
