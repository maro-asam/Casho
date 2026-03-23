import Link from "next/link";
import { Store, Package, FolderOpen, Home } from "lucide-react";

type StoreFooterProps = {
  storeName: string;
  storeSlug: string;
};

const StoreFooter = ({ storeName, storeSlug }: StoreFooterProps) => {
  return (
    <footer className="border-t bg-muted/30 mt-16" dir="rtl">
      <div className="container mx-auto px-4 py-10 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* المتجر */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Store className="size-5 text-primary" />
              {storeName}
            </h3>

            <p className="text-sm text-muted-foreground leading-6">
              متجر إلكتروني لعرض المنتجات وطلبها بسهولة. تصفح المنتجات واختر ما
              يناسبك.
            </p>
          </div>

          {/* روابط سريعة */}
          <div className="space-y-3">
            <h4 className="font-semibold">روابط سريعة</h4>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link
                href={`/store/${storeSlug}`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <Home className="size-4" />
                الصفحة الرئيسية
              </Link>

              <Link
                href={`/store/${storeSlug}/products`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <Package className="size-4" />
                كل المنتجات
              </Link>

              <Link
                href={`/store/${storeSlug}/categories`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <FolderOpen className="size-4" />
                التصنيفات
              </Link>
            </div>
          </div>

          {/* معلومات */}
          <div className="space-y-3">
            <h4 className="font-semibold">عن المتجر</h4>

            <p className="text-sm text-muted-foreground leading-6">
              جميع المنتجات المعروضة في هذا المتجر يتم توفيرها من قبل صاحب
              المتجر مباشرة.
            </p>
          </div>
        </div>

        {/* copyright */}
        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} منصة كشك للمتاجر الالكترونية. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
