"use client";

import { useRef, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string };

export default function ProductFilters({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handleSearch = (value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => update("q", value), 400);
  };

  const clearAll = () => {
    startTransition(() => router.push(pathname));
  };

  const hasFilters = q || category || status;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-52 flex-1">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="rounded-xl ps-9"
          placeholder="ابحث باسم المنتج..."
          defaultValue={q}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <Select
        value={category || "all"}
        onValueChange={(val) => update("category", val === "all" ? "" : val)}
      >
        <SelectTrigger className="w-44 rounded-xl">
          <SelectValue placeholder="كل التصنيفات" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل التصنيفات</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status || "all"}
        onValueChange={(val) => update("status", val === "all" ? "" : val)}
      >
        <SelectTrigger className="w-36 rounded-xl">
          <SelectValue placeholder="كل الحالات" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الحالات</SelectItem>
          <SelectItem value="active">نشط فقط</SelectItem>
          <SelectItem value="inactive">غير نشط</SelectItem>
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
