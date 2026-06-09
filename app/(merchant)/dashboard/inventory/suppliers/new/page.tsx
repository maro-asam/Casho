import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierForm } from "../_components/SupplierForm";

export default function NewSupplierPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inventory/suppliers">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowRight className="size-4" />
            الموردون
          </Button>
        </Link>
        <h1 className="text-xl font-bold">مورد جديد</h1>
      </div>
      <SupplierForm />
    </div>
  );
}
