import Link from "next/link";
import {
  Store,
  Package,
  FolderOpen,
  Home,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

import CashoLogo from "@/components/common/CashoLogo";

type StoreFooterProps = {
  storeName: string;
  storeSlug: string;
  showPoweredByCasho?: boolean;
};

const StoreFooter = ({
  storeName,
  storeSlug,
  showPoweredByCasho = true,
}: StoreFooterProps) => {
  const quickLinks = [
    {
      title: "الصفحة الرئيسية",
      href: `/store/${storeSlug}`,
      icon: Home,
    },
    {
      title: "كل المنتجات",
      href: `/store/${storeSlug}/products`,
      icon: Package,
    },
    {
      title: "التصنيفات",
      href: `/store/${storeSlug}/categories`,
      icon: FolderOpen,
    },
  ];

  return (
    <footer className="mt-16 border-t " dir="rtl">
      <div className="container mx-auto px-4 py-10 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
          <div className="border-b bg-linear-to-l from-primary/5 via-transparent to-primary/10 px-6 py-8 md:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Store className="size-5" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold tracking-tight">
                      {storeName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      متجر إلكتروني لعرض المنتجات وطلبها بسهولة
                    </p>
                  </div>
                </div>

                <p className="max-w-md text-sm leading-7 text-muted-foreground">
                  تصفح المنتجات، شوف التصنيفات، واطلب اللي يناسبك من خلال تجربة
                  شراء بسيطة وواضحة وسريعة.
                </p>

                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs text-muted-foreground">
                    <ShoppingBag className="size-3.5 text-primary" />
                    طلب بسهولة
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs text-muted-foreground">
                    <ShieldCheck className="size-3.5 text-primary" />
                    تجربة منظمة
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs text-muted-foreground">
                    <Sparkles className="size-3.5 text-primary" />
                    متجر حديث
                  </div>
                </div>
              </div>

              <div className="space-y-4 lg:col-span-3">
                <h4 className="font-semibold">روابط سريعة</h4>

                <div className="flex flex-col gap-2">
                  {quickLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm text-muted-foreground transition hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="size-4" />
                          {link.title}
                        </span>

                        <ExternalLink className="size-4" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 lg:col-span-4">
                <h4 className="font-semibold">عن المتجر</h4>

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-sm leading-7 text-muted-foreground">
                    جميع المنتجات المعروضة في هذا المتجر يتم توفيرها من قبل صاحب
                    المتجر مباشرة، والمنصة مسؤولة عن تشغيل المتجر وتقديم تجربة
                    شراء منظمة.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {storeName}. جميع الحقوق محفوظة.
            </p>

            {showPoweredByCasho ? (
              <Link
                href="https://casho.store"
                className="inline-flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5 text-sm transition hover:border-primary/20 hover:bg-primary/5"
              >
                <span className="text-muted-foreground">
                  يتم التشغيل بواسطة
                </span>
                <CashoLogo withSubTitle={false} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
