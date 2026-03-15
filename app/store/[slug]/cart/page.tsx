import Link from "next/link";
import {
  GetCartItemsAction,
  RemoveCartItemAction,
  UpdateCartItemQtyAction,
} from "@/actions/store/cart.actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function CartPage({
  params,
}: {
  params: { slug: string };
}) {
  const { store, items } = await GetCartItemsAction(params.slug);

  const total = items.reduce((acc, item) => {
    return acc + item.product.price * item.quantity;
  }, 0);

  return (
    <div className="wrapper py-10" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">سلة المشتريات</h1>
          <p className="text-sm text-muted-foreground">متجر: {store.name}</p>
        </div>

        {items.length > 0 && (
          <Button asChild>
            <Link href={`/store/${store.slug}/checkout`}>إتمام الشراء</Link>
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>السلة فاضية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              مفيش منتجات مضافة للسلة حاليًا.
            </p>
            <Button asChild variant="outline">
              <Link href={`/store/${store.slug}`}>رجوع للمتجر</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Items */}
          <div className="space-y-4">
            {items.map((item) => {
              const lineTotal = item.product.price * item.quantity;

              return (
                <Card key={item.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        الكمية: {item.quantity} — السعر: {item.product.price} جنيه
                      </p>
                    </div>

                    {/* Line total */}
                    <div className="font-bold min-w-[130px] text-left sm:text-center">
                      {lineTotal} جنيه
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await UpdateCartItemQtyAction(
                            item.id,
                            store.slug,
                            "decrement",
                          );
                        }}
                      >
                        <Button
                          type="submit"
                          variant="outline"
                          size="icon"
                          aria-label="تقليل الكمية"
                        >
                          -
                        </Button>
                      </form>

                      <span className="min-w-[28px] text-center font-semibold">
                        {item.quantity}
                      </span>

                      <form
                        action={async () => {
                          "use server";
                          await UpdateCartItemQtyAction(
                            item.id,
                            store.slug,
                            "increment",
                          );
                        }}
                      >
                        <Button
                          type="submit"
                          variant="outline"
                          size="icon"
                          aria-label="زيادة الكمية"
                        >
                          +
                        </Button>
                      </form>
                    </div>

                    {/* Remove */}
                    <form
                      action={async () => {
                        "use server";
                        await RemoveCartItemAction(item.id, store.slug);
                      }}
                    >
                      <Button type="submit" variant="destructive">
                        حذف
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Total */}
          <Card className="mt-8">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-xl font-bold">
                  الإجمالي: {total} جنيه
                </div>

                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/store/${store.slug}/checkout`}>
                    المتابعة لإتمام الشراء
                  </Link>
                </Button>
              </div>

              <Separator className="my-4" />

              <p className="text-xs text-muted-foreground">
                ملاحظة: الدفع والتأكيد هيتم عن طريق التواصل مع التاجر بعد إرسال
                بيانات الطلب.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}