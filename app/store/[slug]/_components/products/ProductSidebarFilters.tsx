import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter, Tag, Sparkles } from "lucide-react";
import { buildProductsUrl, ProductsQuery } from "@/lib/products-query";
import Link from "next/link";
import PriceRangeFilter from "./PriceRangeFilter";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
};

type Props = {
  storeSlug: string;
  categories: CategoryItem[];
  currentQuery: ProductsQuery;
};

const ProductsSidebarFilters = ({
  storeSlug,
  categories,
  currentQuery,
}: Props) => {
  return (
    <Card className="rounded-3xl border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="size-5" />
          الفلاتر
        </CardTitle>
        <CardDescription>خصص النتائج حسب احتياجك</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="search">بحث</Label>
            <Input
              id="search"
              name="search"
              defaultValue={currentQuery.search}
              placeholder="ابحث عن منتج..."
            />
          </div>

          <div className="space-y-3">
            <Label>التصنيفات</Label>

            <div className="space-y-2">
              <Link
                href={buildProductsUrl(storeSlug, {
                  ...currentQuery,
                  category: "",
                  page: 1,
                })}
                className={`block rounded-xl border px-4 py-3 text-sm transition ${
                  !currentQuery.category
                    ? "border-primary bg-primary/5 text-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                كل التصنيفات
              </Link>

              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={buildProductsUrl(storeSlug, {
                    ...currentQuery,
                    category: category.slug,
                    page: 1,
                  })}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                    currentQuery.category === category.slug
                      ? "border-primary bg-primary/5 text-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {category._count.products}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <PriceRangeFilter
            minDefault={currentQuery.minPrice}
            maxDefault={currentQuery.maxPrice}
          />

          <div className="space-y-3">
            <Label>خيارات إضافية</Label>

            <div className="flex items-center gap-2 rounded-xl border px-3 py-3">
              <Checkbox
                id="featured"
                name="featured"
                value="true"
                defaultChecked={currentQuery.featured}
              />
              <Label
                htmlFor="featured"
                className="flex cursor-pointer items-center gap-2"
              >
                <Sparkles className="size-4" />
                المنتجات المميزة فقط
              </Label>
            </div>
          </div>

          <input type="hidden" name="category" value={currentQuery.category} />

          <div className="space-y-2">
            <Label htmlFor="sort">الترتيب</Label>
            <select
              id="sort"
              name="sort"
              defaultValue={currentQuery.sort}
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
            >
              <option value="newest">الأحدث أولًا</option>
              <option value="oldest">الأقدم أولًا</option>
              <option value="price-asc">السعر من الأقل للأعلى</option>
              <option value="price-desc">السعر من الأعلى للأقل</option>
              <option value="name-asc">الاسم أ - ي</option>
              <option value="name-desc">الاسم ي - أ</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              تطبيق
            </Button>

            <Button asChild type="button" variant="outline" className="flex-1">
              <Link href={`/store/${storeSlug}/products`}>مسح الكل</Link>
            </Button>
          </div>
        </form>

        <div className="rounded-xl border bg-muted/40 p-4">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <Tag className="size-4" />
            نصيحة
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            استخدم البحث مع التصنيف والسعر لتحصل على نتائج أدق.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductsSidebarFilters;
