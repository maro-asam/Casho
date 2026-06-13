"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Gift,
  Users,
  Wallet,
  Link as LinkIcon,
  Share2,
  Trophy,
  Star,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";
import type { ReferralLevel } from "@/lib/referral";

type Referral = {
  id: string;
  createdAt: Date;
  amount: number;
};

type Props = {
  referralCode: string;
  referralLink: string;
  totalEarnedPiasters: number;
  successfulReferrals: number;
  referrals: Referral[];
  referralSuccessfulPayments: number;
  freeMonthsEarned: number;
  referralLevel: ReferralLevel;
  nextLevelThreshold: number | null;
  currentLevelThreshold: number;
  freeMonthProgress: number;
};

const LEVEL_CONFIG: Record<
  ReferralLevel,
  { label: string; icon: string; badgeClass: string; ringClass: string }
> = {
  BRONZE: {
    label: "برونزي",
    icon: "🥉",
    badgeClass:
      "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    ringClass: "ring-amber-400",
  },
  SILVER: {
    label: "فضي",
    icon: "🥈",
    badgeClass:
      "bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
    ringClass: "ring-slate-400",
  },
  GOLD: {
    label: "ذهبي",
    icon: "🥇",
    badgeClass:
      "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
    ringClass: "ring-yellow-400",
  },
  DIAMOND: {
    label: "ماسي",
    icon: "💎",
    badgeClass:
      "bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700",
    ringClass: "ring-cyan-400",
  },
};

export function ReferralPageClient({
  referralCode,
  referralLink,
  totalEarnedPiasters,
  successfulReferrals,
  referrals,
  referralSuccessfulPayments,
  freeMonthsEarned,
  referralLevel,
  nextLevelThreshold,
  currentLevelThreshold,
  freeMonthProgress,
}: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const level = LEVEL_CONFIG[referralLevel];

  async function copyLink() {
    await navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("تم نسخ رابط الإحالة");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success("تم نسخ الكود");
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "انضم إلى كاشو",
          text: "أنشئ متجرك الإلكتروني الآن واحصل على تجربة مجانية! استخدم رابط الدعوة الخاص بي:",
          url: referralLink,
        });
      } catch {
        await copyLink();
      }
    } else {
      await copyLink();
    }
  }

  // Level progress calculation
  const levelProgressPct =
    nextLevelThreshold !== null
      ? Math.round(
          ((referralSuccessfulPayments - currentLevelThreshold) /
            (nextLevelThreshold - currentLevelThreshold)) *
            100,
        )
      : 100;

  // Free month progress (0-3)
  const freeMonthPct = Math.round((freeMonthProgress / 3) * 100);
  const paymentsUntilFreeMonth = 3 - freeMonthProgress;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">نظام المكافأت</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ادعُ تجاراً جدداً واحصل على مكافآت تتصاعد كلما ارتقيت في المستويات
        </p>
      </div>

      {/* ── Level Badge Card ─────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Big level badge */}
            <div
              className={`flex size-20 shrink-0 items-center justify-center rounded-full bg-muted text-4xl ring-4 ${level.ringClass}`}
            >
              {level.icon}
            </div>

            <div className="flex-1 text-center sm:text-right">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="text-xl font-bold text-foreground">
                  المستوى الحالي
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-bold ${level.badgeClass}`}
                >
                  {level.icon} {level.label}
                </span>
              </div>

              {nextLevelThreshold !== null ? (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {referralSuccessfulPayments} /{" "}
                      {nextLevelThreshold} دفعة
                    </span>
                    <span>
                      {nextLevelThreshold - referralSuccessfulPayments} متبقية للمستوى التالي
                    </span>
                  </div>
                  <Progress value={levelProgressPct} className="h-2" />
                </div>
              ) : (
                <p className="mt-2 text-sm font-medium text-cyan-600 dark:text-cyan-400">
                  وصلت للمستوى الأعلى 💎 — أنت في قمة نظام الإحالة!
                </p>
              )}
            </div>
          </div>

          {/* Level ladder */}
          <div className="mt-5 grid grid-cols-4 gap-2">
            {(["BRONZE", "SILVER", "GOLD", "DIAMOND"] as ReferralLevel[]).map(
              (lvl) => {
                const cfg = LEVEL_CONFIG[lvl];
                const isActive = lvl === referralLevel;
                const isUnlocked =
                  ["BRONZE", "SILVER", "GOLD", "DIAMOND"].indexOf(lvl) <=
                  ["BRONZE", "SILVER", "GOLD", "DIAMOND"].indexOf(referralLevel);
                return (
                  <div
                    key={lvl}
                    className={`flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors ${
                      isActive
                        ? "bg-primary/10 ring-2 ring-primary"
                        : isUnlocked
                          ? "bg-muted/60"
                          : "opacity-40"
                    }`}
                  >
                    <span className="text-xl">{cfg.icon}</span>
                    <span className="text-[10px] font-semibold">{cfg.label}</span>
                    {isActive && (
                      <span className="text-[9px] font-bold text-primary">
                        أنت هنا
                      </span>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Stats Row ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الأرباح
            </CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatMoneyFromPiasters(totalEarnedPiasters)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              رصيد مضاف لمتجرك
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الدفعات الناجحة
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralSuccessfulPayments}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              دفعات اشتراك مُحالة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              أشهر مجانية كُسبت
            </CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {freeMonthsEarned}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              شهر مجاني بالاشتراك
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Free Month Progress ───────────────────────────────── */}
      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <Gift className="size-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  شهر مجاني كل 3 دفعات
                </p>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {freeMonthProgress} / 3
                </span>
              </div>
              <Progress
                value={freeMonthPct}
                className="mt-2 h-2.5 bg-emerald-100 dark:bg-emerald-900/40 [&>div]:bg-emerald-500"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {freeMonthProgress === 0
                  ? "ابدأ الإحالة وسيُضاف شهر مجاني كل 3 دفعات ناجحة"
                  : `${paymentsUntilFreeMonth} دفع${paymentsUntilFreeMonth === 1 ? "ة" : "ات"} متبقية للشهر المجاني القادم`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              <Star className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                ادعُ المزيد وارتقِ في المستويات — احصل على مكافآت أكبر!
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                    ١
                  </span>
                  شارك رابطك — يسجل التاجر ويبدأ تجربته
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                    ٢
                  </span>
                  عند دفع الاشتراك — تحصل على 5 جنيه رصيد فوراً
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                    ٣
                  </span>
                  كل 3 دفعات — شهر مجاني يُضاف لاشتراكك تلقائياً
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                    ٤
                  </span>
                  كلما زادت إحالاتك ارتقيت من برونزي ← ماسي
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Referral code & link ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LinkIcon className="size-4" />
            رابط الإحالة الخاص بك
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code */}
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">كود الإحالة</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm font-bold tracking-widest">
                {referralCode}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="shrink-0 gap-1.5"
              >
                {copiedCode ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                نسخ
              </Button>
            </div>
          </div>

          {/* Full link */}
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">رابط التسجيل</p>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 overflow-hidden rounded-md border bg-muted px-3 py-2 text-sm"
                dir="ltr"
              >
                <span className="block truncate text-muted-foreground">
                  {referralLink}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="shrink-0 gap-1.5"
              >
                {copiedLink ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                نسخ
              </Button>
            </div>
          </div>

          <Button className="w-full gap-2" onClick={shareLink}>
            <Share2 className="size-4" />
            مشاركة رابط الإحالة
          </Button>
        </CardContent>
      </Card>

      {/* ── Referral history ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            سجل الإحالات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Trophy className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">لا توجد إحالات ناجحة بعد</p>
              <p className="text-xs text-muted-foreground">
                شارك رابطك مع التجار وابدأ في كسب الرصيد والمستويات
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((ref, index) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">تاجر جديد</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ref.createdAt).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    +{formatMoneyFromPiasters(ref.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note */}
      <p className="text-center text-xs text-muted-foreground">
        الرصيد يُضاف لمتجرك تلقائياً ويُستخدم فقط في تجديد الاشتراك · الأشهر
        المجانية تُضاف مباشرة لمدة اشتراكك
      </p>
    </div>
  );
}
