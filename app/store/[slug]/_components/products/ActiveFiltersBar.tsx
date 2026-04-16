import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductsQuery } from "@/lib/products-query";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  storeSlug: string;
  currentQuery: ProductsQuery;
  categories: CategoryItem[];
};

const ActiveFiltersBar = ({ storeSlug, currentQuery, categories }: Props) => {
  const currentCategory = categories.find(
    (item) => item.slug === currentQuery.category,
  );

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-4 shadow-sm">
      <span className="text-sm font-medium text-muted-foreground">
        الفلاتر المفعلة:
      </span>

      {currentQuery.search && <Badge variant="secondary">بحث: {currentQuery.search}</Badge>}

      {currentCategory && (
        <Badge variant="secondary">تصنيف: {currentCategory.name}</Badge>
      )}

      {currentQuery.featured && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="size-3" />
          مميزة فقط
        </Badge>
      )}

      {currentQuery.minPrice > 0 && (
        <Badge variant="secondary">من: {currentQuery.minPrice} ج.م</Badge>
      )}

      {currentQuery.maxPrice > 0 && (
        <Badge variant="secondary">إلى: {currentQuery.maxPrice} ج.م</Badge>
      )}

      <Button asChild variant="ghost" size="sm" className="ms-auto">
        <Link href={`/store/${storeSlug}/products`}>
          <X className="size-4" />
          مسح الكل
        </Link>
      </Button>
    </div>
  );
};

export default ActiveFiltersBar;