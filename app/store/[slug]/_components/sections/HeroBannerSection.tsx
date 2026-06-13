import type { HeroBannerSettings } from "@/types/store-theme.types";
import { cn } from "@/lib/utils";

interface Props {
  content?: HeroBannerSettings;
}

export default function HeroBannerSection({ content }: Props) {
  const {
    backgroundImage,
    headline = "مرحباً بك في متجرنا",
    subheadline = "اكتشف أفضل المنتجات بأسعار تنافسية",
    buttonText = "تسوق الآن",
    buttonLink = "/products",
    textAlign = "center",
    overlayOpacity = 50,
  } = content ?? {};

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "clamp(320px, 50vw, 560px)" }}
    >
      {/* Background */}
      {backgroundImage ? (
        <img
          src={backgroundImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--store-primary, #2563eb) 0%, color-mix(in srgb, var(--store-primary, #2563eb) 55%, #000) 100%)",
          }}
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: (overlayOpacity ?? 50) / 100 }}
      />

      {/* Content */}
      <div
        className={cn(
          "relative z-10 flex flex-col justify-center gap-5",
          "min-h-[clamp(320px,50vw,560px)] px-6 py-16 md:px-16 lg:px-24",
          textAlign === "center" && "items-center text-center",
          textAlign === "left"   && "items-start text-left",
          textAlign === "right"  && "items-end text-right",
        )}
      >
        {headline && (
          <h2 className="max-w-3xl text-3xl font-bold leading-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl">
            {headline}
          </h2>
        )}

        {subheadline && (
          <p className="max-w-2xl text-base text-white/80 drop-shadow sm:text-xl">
            {subheadline}
          </p>
        )}

        {buttonText && (
          <a
            href={buttonLink ?? "#"}
            className={cn(
              "mt-2 inline-flex items-center justify-center",
              "px-8 py-3 font-bold text-base transition-all",
              "rounded-[var(--store-btn-radius,0.5rem)]",
              "bg-white text-[var(--store-primary,#2563eb)]",
              "shadow-xl hover:shadow-2xl hover:bg-white/90",
            )}
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
}
