import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";
import StoreSectionHeader from "@/app/store/[slug]/_components/shared/StoreSectionHeader";

type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
};

type StoreCategoriesProps = {
  categories: Category[];
  storeSlug: string;
};

const StoreCategories = ({ categories, storeSlug }: StoreCategoriesProps) => {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="mb-10 space-y-5" dir="rtl">
      <StoreSectionHeader
        btn="كل التصنيفات"
        href={`/store/${storeSlug}/categories`}
        title="التصنيفات"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {categories.slice(0, 6).map((category) => (
          <Link
            key={category.id}
            href={`/store/${storeSlug}/category/${category.slug}`}
          >
            <Card className="p-0">
              <div className="group flex h-22 cursor-pointer items-center justify-start gap-2 rounded-lg transition  p-2">
                <div className="relative flex h-full w-22  items-center justify-center overflow-hidden rounded-lg">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <FolderOpen className="size-5 text-muted-foreground" />
                  )}
                </div>

                <span className="line-clamp-2 text-center text-lg font-bold ">
                  {category.name}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default StoreCategories;
