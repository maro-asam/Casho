import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CTA = () => {
  return (
    <section className="w-full py-20">
      <div className="mx-auto  px-6">
        <Card className="rounded-3xl bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center text-center gap-6 py-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              ابدأ متجرك الإلكتروني دلوقتي...
            </h2>

            <p className="max-w-xl text-primary-foreground/80">
              أنشئ متجرك في دقائق وابدأ استقبال الطلبات من عملائك مباشرة. بدون
              تعقيد وبدون خبرة تقنية.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">ابدأ متجرك دلوقتي</Link>
              </Button>

              <Button size="lg" variant="outline" className="bg-transparent" asChild>
                <Link href="#pricing">شوف الأسعار</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CTA;
