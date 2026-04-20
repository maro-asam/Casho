import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Package,
  Megaphone,
  Mail,
  Phone,
  Store,
  Palette,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionStatus } from "@prisma/client";

type AboutStoreRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function AboutStoreRoute({
  params,
}: AboutStoreRouteProps) {
  const { slug } = await params;

  if (!slug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      settings: true,
      _count: {
        select: {
          products: true,
          categories: true,
          orders: true,
          banners: true,
        },
      },
    },
  });

  if (!store) return notFound();

  if (store.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        dir="rtl"
      >
        <Card className="w-full max-w-md rounded-xl border-border/20 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">المتجر غير مفعل</CardTitle>
            <CardDescription>
              لازم صاحب المتجر يفعّل الاشتراك الأول عشان الصفحة تبقى متاحة.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const settings = store.settings;

  const description =
    settings?.description ||
    "المتجر ده بيقدّم منتجات مختارة بعناية مع تجربة شراء سهلة وسريعة، وهدفه الأساسي يوصلك للمنتج المناسب بأفضل شكل ممكن.";

  const socialLinks = [
    {
      label: "واتساب",
      value: settings?.whatsappNumber,
      href: settings?.whatsappNumber
        ? `https://wa.me/${settings.whatsappNumber.replace(/[^\d]/g, "")}`
        : null,
      icon: Phone,
    },
    // {
    //   label: "إنستجرام",
    //   value: settings?.instagram,
    //   href: settings?.instagram || null,
    //   icon: Instagram,
    // },
    // {
    //   label: "فيسبوك",
    //   value: settings?.facebook,
    //   href: settings?.facebook || null,
    //   icon: Facebook,
    // },
    {
      label: "تيك توك",
      value: settings?.tiktok,
      href: settings?.tiktok || null,
      icon: Palette,
    },
    {
      label: "البريد الإلكتروني",
      value: settings?.email,
      href: settings?.email ? `mailto:${settings.email}` : null,
      icon: Mail,
    },
  ].filter((item) => item.value && item.href);

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="wrapper py-8 md:py-10 space-y-8">
        {/* top nav */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">صفحة تعريفية</p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              عن متجر {store.name}
            </h1>
          </div>

          <Button asChild variant="outline" className="rounded-xl">
            <Link
              href={`/store/${store.slug}`}
              className="flex items-center gap-2"
            >
              <ArrowRight className="size-4" />
              الرجوع للمتجر
            </Link>
          </Button>
        </div>

        {/* hero */}
        <section className="relative overflow-hidden rounded-xl border border-border/20 bg-card shadow-sm">
          <div className="absolute inset-0 " />

          {settings?.coverImage ? (
            <div className="relative h-48 md:h-64 w-full">
              <Image
                src={settings.coverImage}
                alt={`غلاف متجر ${store.name}`}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/50" />
            </div>
          ) : (
            <div className="h-48 md:h-64 w-full bg-primary" />
          )}

          <div className="relative px-5 md:px-8 pb-6">
            <div className="-mt-12 md:-mt-14 flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              <div className="relative size-24 md:size-28 overflow-hidden rounded-xl border-4 border-background bg-muted shadow-md">
                {settings?.logo ? (
                  <Image
                    src={settings.logo}
                    alt={`لوجو ${store.name}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Store className="size-10 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl md:text-3xl text-white font-bold">
                    {store.name}
                  </h2>
                  <Badge variant="secondary" className="rounded-xl px-3 py-1">
                    متجر نشط
                  </Badge>
                </div>

                <p className="max-w-3xl text-sm md:text-base leading-7 text-muted-foreground pt-5">
                  {description}
                </p>

                {settings?.announcementText && (
                  <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
                    <Megaphone className="size-4 shrink-0" />
                    <span className="truncate md:whitespace-normal">
                      {settings.announcementText}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-xl border-border/20 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Package className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عدد المنتجات</p>
                <p className="text-2xl font-bold">{store._count.products}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/20 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Store className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عدد الأقسام</p>
                <p className="text-2xl font-bold">{store._count.categories}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/20 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Megaphone className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">البانرات</p>
                <p className="text-2xl font-bold">{store._count.banners}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/20 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Palette className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                <p className="text-lg font-bold">مفعل</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* content grid */}
        <section className="grid gap-6 lg:grid-cols-1">
          {/* <Card className="lg:col-span-2 rounded-xl border-border/20 shadow-sm">
            <CardHeader>
              <CardTitle>نبذة عن المتجر</CardTitle>
              <CardDescription>
                معلومات سريعة تساعد العميل يتعرف على المتجر بشكل أوضح
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-8">
              <p>{description}</p>

              {settings?.primaryColor || settings?.secondaryColor ? (
                <div className="flex flex-wrap gap-3 pt-2">
                  {settings?.primaryColor && (
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                      <span
                        className="size-4 rounded-xl border"
                        style={{ backgroundColor: settings.primaryColor }}
                      />
                      اللون الأساسي: {settings.primaryColor}
                    </div>
                  )}

                  {settings?.secondaryColor && (
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                      <span
                        className="size-4 rounded-xl border"
                        style={{ backgroundColor: settings.secondaryColor }}
                      />
                      اللون الثانوي: {settings.secondaryColor}
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card> */}

          <Card className="rounded-xl border-border/20 shadow-sm">
            <CardHeader>
              <CardTitle>تواصل مع المتجر</CardTitle>
              <CardDescription>
                كل طرق التواصل المتاحة من صاحب المتجر
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {socialLinks.length > 0 ? (
                socialLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href!}
                      target="_blank"
                      className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="size-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{item.label}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {item.value}
                          </p>
                        </div>
                      </div>

                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  لسه مفيش بيانات تواصل مضافة للمتجر.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
