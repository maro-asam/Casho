"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  placeholder: string;
  /** Search param to write, default "q". */
  param?: string;
  className?: string;
};

/** Debounced search box that keeps its value in the URL (`?q=`) and resets paging. */
export function SearchInput({ placeholder, param = "q", className }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(param) ?? "";
  const [value, setValue] = useState(urlValue);
  const [syncedUrl, setSyncedUrl] = useState(urlValue);
  const [pending, startTransition] = useTransition();

  // Follow back/forward navigation and "clear filters" links (not our own pushes).
  if (urlValue !== syncedUrl) {
    setSyncedUrl(urlValue);
    if (urlValue !== value.trim()) setValue(urlValue);
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === (searchParams.get(param) ?? "")) return;

    const id = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (trimmed) next.set(param, trimmed);
      else next.delete(param);
      next.delete("page");
      const query = next.toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    }, 350);

    return () => window.clearTimeout(id);
  }, [value, param, pathname, router, searchParams]);

  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      {pending ? (
        <Loader2 className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border border-input bg-background ps-9 pe-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="مسح البحث"
          className="absolute inset-e-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
