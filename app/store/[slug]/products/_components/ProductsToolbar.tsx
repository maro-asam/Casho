import { Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductsQuery } from "@/lib/products-query";

type Props = {
  storeSlug: string;
  currentQuery: ProductsQuery;
};

const ProductsToolbar = ({ currentQuery }: Props) => {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <form className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={currentQuery.search}
            placeholder="ابحث باسم المنتج..."
            className="pr-9"
          />
        </div>

        <input type="hidden" name="category" value={currentQuery.category} />
        <input
          type="hidden"
          name="featured"
          value={currentQuery.featured ? "true" : ""}
        />
        <input type="hidden" name="minPrice" value={currentQuery.minPrice} />
        <input type="hidden" name="maxPrice" value={currentQuery.maxPrice} />

        <div className="flex items-center gap-2 md:w-60">
          <ArrowUpDown className="size-4 text-muted-foreground" />
          <select
            name="sort"
            defaultValue={currentQuery.sort}
            className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="newest">الأحدث أولًا</option>
            <option value="oldest">الأقدم أولًا</option>
            <option value="price-asc">السعر من الأقل للأعلى</option>
            <option value="price-desc">السعر من الأعلى للأقل</option>
            <option value="name-asc">الاسم أ - ي</option>
            <option value="name-desc">الاسم ي - أ</option>
          </select>
        </div>
      </form>
    </div>
  );
};

export default ProductsToolbar;