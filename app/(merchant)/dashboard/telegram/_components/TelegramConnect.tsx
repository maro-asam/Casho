"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Send,
  CheckCircle2,
  Link2Off,
  RefreshCw,
  Copy,
  ExternalLink,
  ShoppingCart,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GenerateLinkTokenAction, UnlinkTelegramAction } from "@/actions/store/telegram.actions";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "cashomarobot";

type Props = {
  linked: boolean;
  chatId: string | null;
  linkToken: string | null;
};

export default function TelegramConnect({ linked, chatId, linkToken }: Props) {
  const [isPending, startTransition] = useTransition();
  const [currentToken, setCurrentToken] = useState(linkToken);
  const [isLinked, setIsLinked] = useState(linked);

  function handleGenerate() {
    startTransition(async () => {
      const res = await GenerateLinkTokenAction();
      if (res.success && res.token) {
        setCurrentToken(res.token);
        toast.success("تم توليد رمز ربط جديد");
      }
    });
  }

  function handleUnlink() {
    startTransition(async () => {
      const res = await UnlinkTelegramAction();
      if (res.success) {
        setIsLinked(false);
        setCurrentToken(null);
        toast.success(res.message);
      }
    });
  }

  function copyToken() {
    if (!currentToken) return;
    navigator.clipboard.writeText(currentToken);
    toast.success("تم نسخ الرمز");
  }

  const botLink = `https://t.me/${BOT_USERNAME}?start=${currentToken ?? ""}`;

  return (
    <div className="space-y-5">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#229ED9]/20 bg-[#229ED9]/5 px-6 py-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#229ED9]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-[#229ED9]/8 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#229ED9]/15 text-[#229ED9]">
              <Send className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight">ربط تيليجرام</h2>
                {isLinked ? (
                  <Badge className="gap-1.5 rounded-full bg-emerald-500/15 text-emerald-600 border-emerald-200 hover:bg-emerald-500/15">
                    <CheckCircle2 className="size-3" />
                    مرتبط
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full text-muted-foreground">
                    غير مرتبط
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isLinked
                  ? "بيجيلك إشعار فوري على تيليجرام عند كل طلب جديد"
                  : "اربط حساب تيليجرام وخليك أول ما تعرف بأي طلب جديد"}
              </p>
            </div>
          </div>

          {isLinked && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={handleUnlink}
              disabled={isPending}
            >
              <Link2Off className="size-3.5" />
              إلغاء الربط
            </Button>
          )}
        </div>

        {isLinked && chatId && (
          <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-3">
            <div className="grid size-7 place-items-center rounded-lg bg-[#229ED9]/10 text-[#229ED9]">
              <Bell className="size-3.5" />
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Chat ID: </span>
              <span className="font-mono font-medium">{chatId}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Steps — 2 cols */}
        {!isLinked ? (
          <Card className="border-border/60 shadow-sm lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Send className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">خطوات الربط</CardTitle>
                  <CardDescription>اتبع الخطوات دي وهتبقى مرتبط في أقل من دقيقة</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-0 divide-y divide-border/50">
              {/* Step 1 */}
              <div className="flex gap-4 py-4">
                <StepNumber num={1} done={!!currentToken} />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-semibold">ولّد رمز الربط</p>
                    <p className="text-xs text-muted-foreground mt-0.5">رمز مؤقت بيربط حسابك بالمتجر</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl gap-1.5 h-9"
                    onClick={handleGenerate}
                    disabled={isPending}
                  >
                    <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
                    {currentToken ? "توليد رمز جديد" : "توليد رمز"}
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className={cn("flex gap-4 py-4 transition-opacity", !currentToken && "opacity-40")}>
                <StepNumber num={2} done={false} />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-semibold">انسخ الرمز</p>
                    <p className="text-xs text-muted-foreground mt-0.5">هتحتاجه في المحادثة مع البوت</p>
                  </div>
                  {currentToken && (
                    <div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-4 py-2.5">
                      <span className="flex-1 font-mono text-base tracking-[0.2em] font-semibold select-all">
                        {currentToken}
                      </span>
                      <Button type="button" size="icon" variant="ghost" className="size-7 shrink-0" onClick={copyToken}>
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className={cn("flex gap-4 py-4 transition-opacity", !currentToken && "opacity-40")}>
                <StepNumber num={3} done={false} />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-semibold">افتح البوت وابدأ المحادثة</p>
                    <p className="text-xs text-muted-foreground mt-0.5">اضغط الزرار وأرسل الرمز للبوت</p>
                  </div>
                  {currentToken && (
                    <div className="space-y-2">
                      <Button asChild size="sm" className="rounded-xl gap-1.5 h-9 bg-[#229ED9] hover:bg-[#1a8bbf]">
                        <a href={botLink} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-3.5" />
                          افتح @{BOT_USERNAME}
                        </a>
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        أو ابعت{" "}
                        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
                          /start {currentToken}
                        </code>
                        {" "}للبوت مباشرة
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Linked state — full 2 cols */
          <Card className="border-border/60 shadow-sm lg:col-span-2">
            <CardContent className="flex min-h-52 flex-col items-center justify-center gap-4 text-center p-8">
              <div className="grid size-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold">حسابك مرتبط بنجاح!</p>
                <p className="text-sm text-muted-foreground">
                  هتوصلك رسالة على تيليجرام فور وصول أي طلب جديد
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sidebar — 1 col */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Bell className="size-4" />
                </div>
                <CardTitle className="text-base">إشعارات فورية</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ShoppingCart className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">طلب جديد</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    الاسم · الهاتف · العنوان · المبلغ · الدفع
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#229ED9]/20 bg-[#229ED9]/5 shadow-sm">
            <CardContent className="pt-5 space-y-2">
              <p className="text-sm font-semibold text-[#229ED9]">💡 نصيحة</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                تأكد إن البوت{" "}
                <span className="font-medium text-foreground">@{BOT_USERNAME}</span>{" "}
                مش محظور في حسابك عشان تصلك الرسائل.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

function StepNumber({ num, done }: { num: number; done: boolean }) {
  return (
    <div
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5",
        done
          ? "bg-emerald-500 text-white"
          : "bg-primary/10 text-primary",
      )}
    >
      {done ? <CheckCircle2 className="size-4" /> : num}
    </div>
  );
}
