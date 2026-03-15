import { AvatarCircles } from "@/components/ui/avatar-circles";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="w-full py-20">
      <div className=" mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-relaxed">
            افتح <span className="text-primary font-extrabold">متجرك أونلاين</span>
            <br />
            في دقائق وابدأ البيع فورًا
          </h1>

          <p className="text-gray-600 text-lg">
            <span className="text-primary font-bold">كُشــك</span> منصة سهلة للتجار وأصحاب البيزنس الصغير والكبير، تساعدك تعرض
            منتجاتك، تستقبل طلباتك، وتشارك لينك متجرك مع عملائك بسهولة — بداية
            من
            <span className="text-primary font-bold"> 299 جنيه</span> شهريًا.
          </p>

          <div className="flex gap-4 flex-wrap">
            <Button>
              افتح متجر دلوقتي <Store />
            </Button>

            <Link
              href="#features"
              className="px-6 py-3 border rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              ازاي تبدأ ؟
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            أول 50 مشترك بسعر 299 جنيه شهريًا مدى الحياة، وبعدها الاشتراك هيكون
            399 جنيه شهريًا. العرض محدود.
          </p>
          <AvatarCircles
            numPeople={44}
            avatarUrls={[
              {
                imageUrl: "https://avatars.githubusercontent.com/u/16860528",
                profileUrl: "https://github.com/dillionverma",
              },
              {
                imageUrl: "https://avatars.githubusercontent.com/u/16860528",
                profileUrl: "https://github.com/dillionverma",
              },
              {
                imageUrl: "https://avatars.githubusercontent.com/u/16860528",
                profileUrl: "https://github.com/dillionverma",
              },
              {
                imageUrl: "https://avatars.githubusercontent.com/u/16860528",
                profileUrl: "https://github.com/dillionverma",
              },
              {
                imageUrl: "https://avatars.githubusercontent.com/u/16860528",
                profileUrl: "https://github.com/dillionverma",
              },
              {
                imageUrl: "https://avatars.githubusercontent.com/u/16860528",
                profileUrl: "https://github.com/dillionverma",
              },
            ]}
          />
        </div>

        {/* Image / Mockup */}
        <div className="relative">
          <div className="bg-gray-100 rounded-2xl h-105 flex items-center justify-center text-gray-400">
            <Image src={`/hero.svg`} alt="Hero Image" fill />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
