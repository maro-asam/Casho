"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ProductGalleryProps = {
  productName: string;
  mainImage: string;
  images: string[];
};

export default function ProductGallery({
  productName,
  mainImage,
  images,
}: ProductGalleryProps) {
  const gallery = useMemo(() => {
    const merged = [mainImage, ...images];
    return [...new Set(merged.filter(Boolean))];
  }, [mainImage, images]);

  const [selectedImage, setSelectedImage] = useState(gallery[0] || mainImage);

  return (
    <div className="order-1 space-y-4 xl:order-1">
      <div className="h-fit overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
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
