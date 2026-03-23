import { PAYMENT_LOGOS } from "@/constants";
import Image from "next/image";

const LogosTicker = () => {
  return (
    <section className="w-full border-y bg-muted/30 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mx-auto mb-10 max-w-2xl text-center leading-normal text-muted-foreground text-lg">
          دلوقتي تقدر تدفع وتتعامل مع العملاء بسهولة عن طريق وسائل دفع مصرية
          متعددة تناسب طبيعة شغلك وعملاءك
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9">
          {PAYMENT_LOGOS.map((logo) => (
            <div
              key={logo.name}
              className="group flex h-24 items-center justify-center rounded-22xl border bg-background/70 px-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm"
            >
              <div className="relative h-10 w-27.5 md:h-12 md:w-30">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  className="object-contain opacity-80 transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogosTicker;
