"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Check, X, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UnsplashPhoto = {
  id: string;
  urls: { regular: string; small: string; thumb: string };
  user: { name: string };
  links: { download_location: string };
  alt_description?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export default function UnsplashPickerModal({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UnsplashPhoto | null>(null);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setPhotos([]);
    setSelected(null);
    setError("");
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setPhotos([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query.trim()), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function search(q: string) {
    setLoading(true);
    setError("");
    setSelected(null);
    try {
      const res = await fetch(`/api/unsplash/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل البحث");
      setPhotos(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل البحث");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!selected) return;
    // Trigger Unsplash download (required by API guidelines)
    fetch("/api/unsplash/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadLocation: selected.links.download_location }),
    }).catch(() => {});
    onSelect(selected.urls.regular);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            اختر صورة من Unsplash
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث عن صورة... (مثال: nature, food, fashion)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pe-10"
            autoFocus
          />
        </div>

        {/* Results Grid */}
        <div className="h-80 overflow-y-auto rounded-xl border bg-muted/20">
          {loading && (
            <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">جاري البحث...</span>
            </div>
          )}
          {!loading && error && (
            <div className="flex h-full items-center justify-center text-sm text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && photos.length === 0 && query.trim() && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              لا توجد نتائج
            </div>
          )}
          {!loading && !error && photos.length === 0 && !query.trim() && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              اكتب كلمة للبحث عن صور
            </div>
          )}
          {!loading && photos.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 p-1.5">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelected(photo)}
                  className="group relative overflow-hidden rounded-lg focus:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.urls.small}
                    alt={photo.alt_description ?? "Unsplash photo"}
                    className="h-28 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  {/* Hover overlay with photographer name */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-end p-1.5">
                    <span className="text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">
                      {photo.user.name}
                    </span>
                  </div>
                  {/* Selected overlay */}
                  {selected?.id === photo.id && (
                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                      <div className="rounded-full bg-primary p-1.5">
                        <Check className="size-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`absolute inset-0 rounded-lg ring-2 ring-inset transition-colors ${
                      selected?.id === photo.id
                        ? "ring-primary"
                        : "ring-transparent group-hover:ring-primary/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attribution */}
        <p className="text-center text-xs text-muted-foreground">
          الصور من{" "}
          <a
            href="https://unsplash.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Unsplash
          </a>
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="size-4" />
            إلغاء
          </Button>
          <Button onClick={handleConfirm} disabled={!selected} className="gap-2">
            <Check className="size-4" />
            اختيار
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
