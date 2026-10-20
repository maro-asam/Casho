"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Monitor, Smartphone, Globe, LogOut, Tablet } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { Group, IconTile } from "./settings-ui";
import { RevokeSessionAction, RevokeAllOtherSessionsAction, type SessionDTO } from "@/actions/auth/sessions.actions";
import { tr, trv } from "@/lib/i18n/dashboard";

function parseDevice(userAgent: string | null): { label: string; icon: typeof Monitor } {
  if (!userAgent) return { label: tr("جهاز غير معروف"), icon: Globe };
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone"))
    return { label: tr("موبايل"), icon: Smartphone };
  if (ua.includes("ipad") || ua.includes("tablet"))
    return { label: tr("تابلت"), icon: Tablet };
  return { label: tr("كمبيوتر"), icon: Monitor };
}

function parseBrowser(userAgent: string | null): string {
  if (!userAgent) return "";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("OPR") || userAgent.includes("Opera")) return "Opera";
  return "";
}

function formatDate(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return tr("الآن");
  if (minutes < 60) return tr("منذ {0} دقيقة", minutes);
  if (hours < 24) return tr("منذ {0} ساعة", hours);
  return tr("منذ {0} يوم", days);
}

type Props = { sessions: SessionDTO[] };

export default function ActiveSessions({ sessions: initial }: Props) {
  const [sessions, setSessions] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function handleRevoke(sessionId: string) {
    startTransition(async () => {
      const res = await RevokeSessionAction(sessionId);
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success(tr("تم إنهاء الجلسة"));
      } else {
        toast.error(trv(res.message));
      }
    });
  }

  function handleRevokeAll() {
    startTransition(async () => {
      const res = await RevokeAllOtherSessionsAction();
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        toast.success(trv(res.message));
      } else {
        toast.error(tr("حدث خطأ"));
      }
    });
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <Group
      id="security"
      inset={57}
      title={tr("الجلسات النشطة")}
      footer={tr("أجهزة سجّلت دخولها على حسابك")}
      action={
        otherSessions.length > 0 && (
          <button type="button" onClick={handleRevokeAll} disabled={isPending} className={cn(appleButton.plain, "mx-0 h-8 text-[13px] text-(--sys-red) hover:bg-(--sys-red)/8")}>
            <LogOut className="size-3.5" />
            {tr("تسجيل خروج من الكل")}
          </button>
        )
      }
    >
      {sessions.length === 0 && <p className="px-4 py-6 text-center text-[15px] text-muted-foreground">{tr("لا توجد جلسات نشطة")}</p>}

      {sessions.map((session) => {
        const { label, icon } = parseDevice(session.userAgent);
        const browser = parseBrowser(session.userAgent);

        return (
          <div key={session.id} className="flex min-h-14 items-center gap-3 px-4 py-2.5">
            <IconTile icon={icon} tint={session.isCurrent ? "bg-(--sys-green)" : "bg-(--sys-gray)"} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px]">
                {label}
                {browser ? ` · ${browser}` : ""}
              </p>
              <p className="truncate text-[13px] text-muted-foreground">
                {session.isCurrent ? (
                  <span className="font-semibold text-(--sys-green)">{tr("الجهاز الحالي")}</span>
                ) : (
                  formatDate(session.lastUsedAt)
                )}
                {session.ipAddress && (
                  <span className="font-mono" dir="ltr">
                    {" · "}
                    {session.ipAddress}
                  </span>
                )}
              </p>
            </div>

            {!session.isCurrent && (
              <button
                type="button"
                onClick={() => handleRevoke(session.id)}
                disabled={isPending}
                className={cn(appleButton.plain, "mx-0 h-8 text-[15px] text-(--sys-red) hover:bg-(--sys-red)/8")}
              >
                {tr("إنهاء")}
              </button>
            )}
          </div>
        );
      })}
    </Group>
  );
}
