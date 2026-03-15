import Image from "next/image";

const logos = [
  "/payment/vfcash.svg",
  "/payment/ogcash.svg",
  "/payment/ecash.svg",
  "/payment/wepay.svg",
  "/payment/instapay.svg",
  "/payment/fawry.svg",
  "/payment/cod.svg",
  "/payment/paypal.svg",
  "/payment/bank.svg",
];

const LogosTicker = () => {
  return (
    <section className="w-full border-y bg-gray-50 py-12">
      <div className="mx-auto px-6">
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-6 text-muted-foreground md:text-base">
          دلوقتي تقدر تدفع وتتعامل مع العملاء بمنتهى السهولة عن طريق طرق دفع
          مصرية متعددة
        </p>

        <div className="grid grid-cols-3 gap-10 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 items-center justify-items-center">
          {logos.map((logo, index) => (
            <div key={index} className="relative h-16 w-[150px]">
              <Image
                src={logo}
                alt={`payment-${index}`}
                fill
                className="object-contain opacity-80 transition hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogosTicker;
