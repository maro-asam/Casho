import Link from "next/link";
import { Card } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";
import StoreSectionHeader from "@/app/store/[slug]/_components/shared/StoreSectionHeader";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type StoreCategoriesProps = {
  categories: Category[];
  storeSlug: string;
};

const StoreCategories = ({ categories, storeSlug }: StoreCategoriesProps) => {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="mb-10 space-y-5" dir="rtl">
      {/* Header */}
      <StoreSectionHeader
        btn="كل التصنيفات"
        href={`/store/${storeSlug}/categories`}
        title="التصنيفات"
      />

      {/* Categories Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {categories.slice(0, 6).map((category) => (
          <Link
            key={category.id}
            href={`/store/${storeSlug}/category/${category.slug}`}
          >
            <Card className="group flex h-27.5 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <FolderOpen className="size-5 text-muted-foreground" />
              </div>

              <span className="text-sm font-medium text-center line-clamp-2">
                {category.name}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default StoreCategories;
