"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send, CheckCircle2, Link2Off, RefreshCw, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6 max-w-xl">
      {/* Status Card */}
      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Send className="size-5 text-primary" />
              حالة الربط
            </CardTitle>
            {isLinked ? (
              <Badge className="gap-1.5 rounded-lg bg-emerald-500">
                <CheckCircle2 className="size-3.5" />
                مرتبط
              </Badge>
            ) : (
              <Badge variant="secondary" className="rounded-lg">
                غير مرتبط
              </Badge>
            )}
          </div>
          <CardDescription>
            {isLinked
              ? `حسابك مرتبط بـ Chat ID: ${chatId}`
              : "ربّط حساب تيليجرام لتصلك إشعارات الطلبات فوراً"}
          </CardDescription>
        </CardHeader>

        {isLinked && (
          <CardContent>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={handleUnlink}
              disabled={isPending}
            >
              <Link2Off className="size-4" />
              إلغاء الربط
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Link Steps */}
      {!isLinked && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">خطوات الربط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <div className="space-y-2">
                <p className="text-sm font-medium">ولّد رمز الربط</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl gap-1.5"
                  onClick={handleGenerate}
                  disabled={isPending}
                >
                  <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
                  {currentToken ? "توليد رمز جديد" : "توليد رمز"}
                </Button>
              </div>
            </div>

            {/* Step 2 — show only after token exists */}
            {currentToken && (
              <div className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                <div className="space-y-2 w-full">
                  <p className="text-sm font-medium">انسخ الرمز</p>
                  <div className="flex items-center gap-2 rounded-xl border bg-muted px-3 py-2 font-mono text-sm tracking-widest">
                    <span className="flex-1 select-all">{currentToken}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={copyToken}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — open bot */}
            {currentToken && (
              <div className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                <div className="space-y-2">
                  <p className="text-sm font-medium">افتح البوت وابدأ المحادثة</p>
                  <Button
                    asChild
                    size="sm"
                    className="rounded-xl gap-1.5 bg-[#229ED9] hover:bg-[#1a8bbf]"
                  >
                    <a href={botLink} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-3.5" />
                      افتح @{BOT_USERNAME}
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    البوت سيطلب منك الرمز تلقائياً — أو ابعت{" "}
                    <code className="rounded bg-muted px-1">/start {currentToken}</code>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* What you'll receive */}
      <Card className="rounded-xl bg-muted/40">
        <CardContent className="pt-5 space-y-2">
          <p className="text-sm font-semibold">ستصلك إشعارات فورية عند:</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-base">🛒</span> وصول طلب جديد (الاسم، الهاتف، المبلغ، نوع الدفع)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
