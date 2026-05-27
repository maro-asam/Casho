"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ProductGalleryProps = {
  productName: string;
  mainImage: string;
  images: string[];
  className?: string;
  portrait?: boolean;
};

export default function ProductGallery({
  productName,
  mainImage,
  images,
  className,
  portrait,
}: ProductGalleryProps) {
  const gallery = useMemo(() => {
    const merged = [mainImage, ...images];
    return [...new Set(merged.filter(Boolean))];
  }, [mainImage, images]);

  const [selectedImage, setSelectedImage] = useState(gallery[0] || mainImage);

  if (portrait) {
    return (
      <div className={`flex h-full flex-col gap-2 ${className ?? ""}`}>
        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/20">
          <Image
            src={selectedImage}
            alt={productName}
            fill
            priority
            className="object-cover transition duration-300"
          />
        </div>
        {gallery.length > 1 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto px-2 pb-2">
            {gallery.map((img, index) => {
              const isActive = selectedImage === img;
              return (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative h-16 w-12 shrink-0 overflow-hidden border transition cursor-pointer ${
                    isActive ? "ring-2 ring-black border-black" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`${productName}-${index + 1}`} fill className="object-cover" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`order-1 space-y-4 xl:order-1 ${className ?? ""}`}>
      <div className="h-fit overflow-hidden rounded-xl border border-border/20 bg-card shadow-sm">
        <div className="p-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/30">
            <Image
              src={selectedImage}
              alt={productName}
              fill
              priority
              className="object-cover transition duration-300"
            />
          </div>
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="flex flex-row flex-wrap items-center justify-start gap-4">
          {gallery.map((img, index) => {
            const isActive = selectedImage === img;

            return (
              <button
                key={`${img}-${index}`}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`relative h-28 w-28 overflow-hidden rounded-xl border bg-muted/30 transition cursor-pointer ${
                  isActive
                    ? "ring-1 ring-primary border-primary"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`${productName}-${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
