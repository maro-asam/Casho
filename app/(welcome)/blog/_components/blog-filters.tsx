"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useCallback } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

type BlogFiltersProps = {
  categories: Category[];
  activeCategory?: string;
  searchQuery?: string;
};

export function BlogFilters({
  categories,
  activeCategory,
  searchQuery,
}: BlogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page"); // reset to page 1 on filter change
      router.push(`/blog?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value || undefined });
    }, 350);
  };

  return (
    <>
      <div className="mx-auto mt-10 max-w-xl">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="ابحث عن مقال..."
            className="h-12 w-full rounded-xl border bg-background pr-11 pl-4 text-sm outline-none transition focus:border-primary"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() =>
              updateParams({ category: undefined, q: searchQuery || undefined })
            }
            className={`rounded-xl px-4 py-2 text-sm font-medium transition cursor-pointer ${
              !activeCategory
                ? "bg-primary text-primary-foreground"
                : "border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            الكل
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() =>
                updateParams({
                  category: category.slug,
                  q: searchQuery || undefined,
                })
              }
              className={`rounded-xl px-4 py-2 text-sm font-medium transition cursor-pointer ${
                activeCategory === category.slug
                  ? "bg-primary text-primary-foreground"
                  : "border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
