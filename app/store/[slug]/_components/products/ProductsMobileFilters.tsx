"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProductsQuery } from "@/lib/products-query";
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

const ProductsMobileFilters = ({ categories, currentQuery }: Props) => {
  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="rounded-lg">
            <SlidersHorizontal className="size-4" />
            الفلاتر
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
          <SheetHeader className="text-right">
            <SheetTitle>فلترة المنتجات</SheetTitle>
            <SheetDescription>
              عدل البحث والتصنيف والسعر والترتيب
            </SheetDescription>
          </SheetHeader>

          <form className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="search-mobile">بحث</Label>
              <Input
                id="search-mobile"
                name="search"
                defaultValue={currentQuery.search}
                placeholder="ابحث عن منتج..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-mobile">التصنيف</Label>
              <select
                id="category-mobile"
                name="category"
                defaultValue={currentQuery.category}
                className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
              >
                <option value="">كل التصنيفات</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name} ({category._count.products})
                  </option>
                ))}
              </select>
            </div>

            <PriceRangeFilter
              minDefault={currentQuery.minPrice}
              maxDefault={currentQuery.maxPrice}
            />

            <div className="flex items-center gap-2 rounded-lg border px-3 py-3">
              <Checkbox
                id="featured-mobile"
                name="featured"
                value="true"
                defaultChecked={currentQuery.featured}
              />
              <Label htmlFor="featured-mobile">المنتجات المميزة فقط</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-mobile">الترتيب</Label>
              <select
                id="sort-mobile"
                name="sort"
                defaultValue={currentQuery.sort}
                className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
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
                تطبيق الفلاتر
              </Button>
              <Button
                asChild
                type="button"
                variant="outline"
                className="flex-1"
              >
                <a href="./products">مسح الكل</a>
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProductsMobileFilters;
