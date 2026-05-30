"use client";

import { useRef, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Product = { id: string; name: string };

export default function ReviewFilters({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = searchParams.get("q") ?? "";
  const productFilter = searchParams.get("product") ?? "";
  const ratingFilter = searchParams.get("rating") ?? "";

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handleSearch = (value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => update("q", value), 400);
  };

  const clearAll = () => startTransition(() => router.push(pathname));
  const hasFilters = q || productFilter || ratingFilter;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-52 flex-1">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="rounded-xl ps-9"
          placeholder="ابحث باسم العميل أو محتوى المراجعة..."
          defaultValue={q}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <Select
        value={productFilter || "all"}
        onValueChange={(val) => update("product", val === "all" ? "" : val)}
      >
        <SelectTrigger className="w-48 rounded-xl">
          <SelectValue placeholder="كل المنتجات" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل المنتجات</SelectItem>
          {products.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={ratingFilter || "all"}
        onValueChange={(val) => update("rating", val === "all" ? "" : val)}
      >
        <SelectTrigger className="w-40 rounded-xl">
          <SelectValue placeholder="كل التقييمات" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل التقييمات</SelectItem>
          <SelectItem value="5">⭐⭐⭐⭐⭐ 5 نجوم</SelectItem>
          <SelectItem value="4">⭐⭐⭐⭐ 4 نجوم</SelectItem>
          <SelectItem value="3">⭐⭐⭐ 3 نجوم</SelectItem>
          <SelectItem value="2">⭐⭐ 2 نجوم</SelectItem>
          <SelectItem value="1">⭐ 1 نجمة</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="gap-1.5 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
          مسح الفلاتر
        </Button>
      )}
    </div>
  );
}
