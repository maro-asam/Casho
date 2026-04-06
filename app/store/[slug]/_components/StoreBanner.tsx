"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Sparkles } from "lucide-react";

type BannerItem = {
  id: string;
  title: string;
  image: string;
};

type StoreBannerProps = {
  banners: BannerItem[];
  storeSlug: string;
};

const StoreBanner = ({ banners, storeSlug }: StoreBannerProps) => {
  const plugin = React.useRef(
    Autoplay({
      delay: 3500,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    }),
  );

  if (!banners || banners.length === 0) return null;

  const heroBanners = banners.slice(0, 3);
  const sideBanners = banners.slice(3, 7);

  return (
    <section className="mb-8 w-full" dir="rtl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight md:text-2xl text-primary">
            أفضل العروض
          </h2>
        </div>

        <Badge
          variant="default"
          className="w-fit rounded-md p-4 bg-primary/10 text-primary text-xs sm:text-sm"
        >
          <Sparkles className="me-1 size-4" />
          عروض حصرية
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="w-full">
          <Carousel
            plugins={[plugin.current]}
            opts={{
              loop: true,
              align: "start",
              direction: "rtl",
            }}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent>
              {heroBanners.map((banner) => (
                <CarouselItem key={banner.id}>
                  <div className="relative h-55 w-full overflow-hidden rounded-3xl sm:h-70 md:h-85 xl:h-105">
                    <Image
                      src={banner.image || "/placeholder-banner.jpg"}
                      alt={banner.title}
                      fill
                      priority
                      className="object-cover"
                    />

                    <div className="absolute inset-0 bg-linear-to-l from-black/75 via-black/35 to-transparent" />

                    <div className="absolute inset-0 flex items-end">
                      <div className="w-full p-4 sm:p-6 md:p-8 xl:p-10">
                        <div className="max-w-2xl space-y-3 text-white">
                          <Badge className="rounded-md bg-white/15 text-white hover:bg-white/15">
                            عرض خاص
                          </Badge>

                          <h3 className="text-xl font-extrabold leading-snug sm:text-2xl md:text-4xl xl:text-5xl">
                            {banner.title}
                          </h3>

                          <p className="max-w-xl text-xs leading-6 text-white/85 sm:text-sm md:text-base">
                            اكتشف أفضل المنتجات والعروض المتاحة الآن داخل المتجر
                            وابدأ التسوق بسهولة.
                          </p>

                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            <Button
                              asChild
                              size="lg"
                              className="rounded-xl px-5 sm:px-6"
                            >
                              <Link
                                href={`/store/${storeSlug}/categories`}
                                className="inline-flex items-center gap-2"
                              >
                                <ShoppingBag className="size-4" />
                                ابدأ التسوق
                              </Link>
                            </Button>

                            <Button
                              asChild
                              size="lg"
                              variant="secondary"
                              className="rounded-xl px-5 sm:px-6"
                            >
                              <Link href={`/store/${storeSlug}`}>
                                عرض المنتجات
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {sideBanners.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sideBanners.map((banner) => (
              <div
                key={banner.id}
                className="group relative h-42.5 w-full overflow-hidden rounded-xl sm:h-47.5 lg:h-52.5"
              >
                <Image
                  src={banner.image || "/placeholder-banner.jpg"}
                  alt={banner.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-linear-to-l from-black/70 via-black/30 to-transparent" />

                <div className="absolute inset-0 flex items-end p-4">
                  <div className="space-y-2 text-white">
                    <h4 className="line-clamp-2 text-sm font-bold leading-6 sm:text-base">
                      {banner.title}
                    </h4>

                    <Button
                      asChild
                      size="sm"
                      variant="secondary"
                      className="rounded-lg"
                    >
                      <Link href={`/store/${storeSlug}/categories`}>
                        تسوق الآن
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default StoreBanner;
