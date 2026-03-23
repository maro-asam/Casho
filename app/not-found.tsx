import Link from "next/link";
import { Home, ArrowLeft, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-2xl">
        <Card className="overflow-hidden border-border/60 bg-background shadow-xl">
          <CardContent className="relative p-0">
            <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-primary/5" />

            <div className="relative flex flex-col items-center px-6 py-14 text-center sm:px-10">
              <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
                <SearchX className="size-10 text-primary" />
              </div>

              <div className="mb-3 inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-4 py-1 text-sm font-medium text-muted-foreground">
                Error 404
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                الصفحة غير موجودة
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                واضح إن الصفحة اللي بتحاول توصل لها مش موجودة، أو يمكن اتمسحت،
                أو الرابط نفسه مش صحيح.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                <Button asChild size="lg" className=" px-6">
                  <Link href="/">
                    <Home className="me-2 size-4" />
                    الرجوع للرئيسية
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
                <div className=" border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm font-semibold">الرابط غلط</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    تأكد من كتابة الرابط بشكل صحيح
                  </p>
                </div>

                <div className=" border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm font-semibold">الصفحة اتحذفت</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ممكن المحتوى ما بقاش متاح دلوقتي
                  </p>
                </div>

                <div className=" border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm font-semibold">تم نقلها</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    أحيانًا الصفحات بيتغير مسارها
                  </p>
                </div>
              </div>

              <div className="pointer-events-none absolute -left-16 top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
