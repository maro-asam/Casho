import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierForm } from "../_components/SupplierForm";
import { tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function NewSupplierPage() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inventory/suppliers">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowRight className="size-4 ltr:-scale-x-100" />
            {tr("الموردون")}
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{tr("مورد جديد")}</h1>
      </div>
      <SupplierForm />
    </div>
  );
}
