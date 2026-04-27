import Link from "next/link";
import { PackageOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  storeSlug: string;
};

const EmptyProductsState = ({ storeSlug }: Props) => {
  return (
    <div className="flex min-h-90 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center shadow-sm">
      <PackageOpen className="mb-4 size-14 text-primary/60" />
      <h3 className="mb-2 text-2xl font-semibold">لا توجد نتائج</h3>
      <p className="mb-5 max-w-md text-muted-foreground">
        لم نعثر على منتجات مطابقة للفلاتر الحالية. جرب تعديل البحث أو إزالة بعض
        الخيارات.
      </p>

      <Button asChild variant="outline">
        <Link href={`/store/${storeSlug}/products`}>
          <RotateCcw className="size-4" />
          إعادة تعيين الفلاتر
        </Link>
      </Button>
    </div>
  );
};

export default EmptyProductsState;
