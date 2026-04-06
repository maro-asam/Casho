import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgePercent,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TicketPercent,
  Trash2,
} from "lucide-react";

import {
  GetCartItemsAction,
  RemoveCartItemAction,
  UpdateCartItemQtyAction,
} from "@/actions/store/cart.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { store, items } = await GetCartItemsAction(slug);

  const subtotal = items.reduce((acc, item) => {
    return acc + item.product.price * item.quantity;
  }, 0);

  const shipping = items.length > 0 ? 0 : 0;
  const discount = 0;
  const total = subtotal + shipping - discount;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted/30" dir="rtl">
      <div className="mx-auto w-full py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border bg-background p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="size-5" />
              <span className="text-sm">سلة المشتريات</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-primary">
              مراجعة الطلب
            </h1>

            <p className="text-sm text-muted-foreground">
              أنت بتتسوق الآن من متجر{" "}
              <span className="font-semibold text-foreground">
                {store.name}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-sm"
            >
              {items.length} منتج
            </Badge>

            <Button asChild variant="outline" className="rounded-xl">
              <Link href={`/store/${slug}`}>
                <ArrowLeft className="size-4" />
                الرجوع للمتجر
              </Link>
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="overflow-hidden rounded-3xl border-0">
            <CardContent className="flex min-h-105 flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-primary/10">
                <ShoppingBag className="size-10 text-primary" />
              </div>

              <h2 className="mb-2 text-2xl font-bold">السلة فاضية</h2>

              <p className="mb-6 max-w-md text-sm leading-6 text-muted-foreground">
                لسه ما ضفتش أي منتجات. ابدأ التصفح واختار المنتجات اللي تناسبك
                وبعدها ارجع هنا لإتمام الطلب.
              </p>

              <Button asChild size="lg" className="rounded-xl px-8">
                <Link href={`/store/${slug}`}>ابدأ التسوق</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => {
                const lineTotal = item.product.price * item.quantity;

                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden rounded-3xl border bg-background transition-shadow hover:shadow-sm"
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center">
                        {/* Product Image */}
                        <div className="relative h-28 w-full overflow-hidden rounded-xl bg-muted sm:h-32 lg:h-28 lg:w-32">
                          {item.product.image ? (
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                              لا توجد صورة
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <h3 className="line-clamp-1 text-lg font-bold">
                                {item.product.name}
                              </h3>

                              <p className="text-sm text-muted-foreground">
                                سعر القطعة: {formatPrice(item.product.price)}
                              </p>
                            </div>

                            <div className="text-left">
                              <p className="text-xs text-muted-foreground">
                                إجمالي المنتج
                              </p>
                              <p className="text-lg font-extrabold">
                                {formatPrice(lineTotal)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                الكمية:
                              </span>

                              <div className="flex items-center rounded-xl border bg-muted/40 p-1">
                                <form
                                  action={async () => {
                                    "use server";
                                    await UpdateCartItemQtyAction(
                                      item.id,
                                      slug,
                                      "decrement",
                                    );
                                  }}
                                >
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-lg"
                                    aria-label="تقليل الكمية"
                                  >
                                    <Minus className="size-4" />
                                  </Button>
                                </form>

                                <span className="min-w-10 text-center text-sm font-bold">
                                  {item.quantity}
                                </span>

                                <form
                                  action={async () => {
                                    "use server";
                                    await UpdateCartItemQtyAction(
                                      item.id,
                                      slug,
                                      "increment",
                                    );
                                  }}
                                >
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-lg"
                                    aria-label="زيادة الكمية"
                                  >
                                    <Plus className="size-4" />
                                  </Button>
                                </form>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <form
                                action={async () => {
                                  "use server";
                                  await RemoveCartItemAction(item.id, slug);
                                }}
                              >
                                <Button
                                  type="submit"
                                  variant="outline"
                                  className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="size-4" />
                                  حذف المنتج
                                </Button>
                              </form>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Summary */}
            <div className="xl:sticky xl:top-24 xl:self-start">
              <Card className="overflow-hidden rounded-[30px] border bg-background/95 backdrop-blur">
                <div className="bg-[linear-gradient(135deg,hsl(var(--primary)/0.14),transparent_55%)]">
                  <CardHeader className="pb-4">
                    <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium">
                      <Sparkles className="size-3.5 text-primary" />
                      ملخص الطلب
                    </div>

                    <CardTitle className="text-2xl font-extrabold">
                      جاهز لإتمام الشراء؟
                    </CardTitle>
                    <CardDescription className="leading-6">
                      راجع المجموع والكوبون ومعلومات الطلب قبل المتابعة
                    </CardDescription>
                  </CardHeader>
                </div>

                <CardContent className="space-y-5 p-5">
                  {/* Coupon ticket */}
                  <div className="relative overflow-hidden rounded-3xl border border-dashed bg-muted/35 p-4">
                    <div className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-background" />
                    <div className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-background" />

                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                        <TicketPercent className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">كوبون الخصم</p>
                        <p className="text-xs text-muted-foreground">
                          شكل فقط حاليًا بدون logic
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        placeholder="مثال: MARO10"
                        className="h-12 rounded-xl bg-background"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-12 rounded-xl px-6"
                      >
                        <BadgePercent className="size-4" />
                        تطبيق
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        المجموع الفرعي
                      </span>
                      <span className="font-semibold">
                        {formatPrice(subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">الشحن</span>
                      <span className="font-semibold">
                        {shipping === 0 ? "مجاني" : formatPrice(shipping)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">الخصم</span>
                      <span className="font-semibold text-emerald-600">
                        {discount > 0 ? `- ${formatPrice(discount)}` : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold">الإجمالي</span>
                      <span className="text-3xl font-extrabold tracking-tight text-primary">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  <Button asChild size="lg" className="h-12 w-full rounded-xl">
                    <Link href={`/store/${slug}/checkout`}>
                      المتابعة لإتمام الشراء
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-12 w-full rounded-xl"
                  >
                    <Link href={`/store/${slug}`}>إضافة منتجات أخرى</Link>
                  </Button>

                  <div className="rounded-xl border bg-muted/25 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" />
                      <p className="font-semibold">معلومة مهمة</p>
                    </div>

                    <p className="text-xs leading-6 text-muted-foreground">
                      بعد إرسال الطلب، التاجر هيتواصل معاك لتأكيد البيانات
                      والتوصيل وطريقة الدفع بشكل نهائي.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
