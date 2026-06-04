"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Monitor, Smartphone, Globe, Trash2, LogOut, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevokeSessionAction, RevokeAllOtherSessionsAction, type SessionDTO } from "@/actions/auth/sessions.actions";

function parseDevice(userAgent: string | null): { label: string; icon: typeof Monitor } {
  if (!userAgent) return { label: "جهاز غير معروف", icon: Globe };
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone"))
    return { label: "موبايل", icon: Smartphone };
  if (ua.includes("ipad") || ua.includes("tablet"))
    return { label: "تابلت", icon: Monitor };
  return { label: "كمبيوتر", icon: Monitor };
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
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${days} يوم`;
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
        toast.success("تم إنهاء الجلسة");
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleRevokeAll() {
    startTransition(async () => {
      const res = await RevokeAllOtherSessionsAction();
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        toast.success(res.message);
      } else {
        toast.error("حدث خطأ");
      }
    });
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">الجلسات النشطة</CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                أجهزة سجّلت دخولها على حسابك
              </CardDescription>
            </div>
          </div>
          {otherSessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs"
              onClick={handleRevokeAll}
              disabled={isPending}
            >
              <LogOut className="size-3.5" />
              تسجيل خروج من الكل
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {sessions.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            لا توجد جلسات نشطة
          </p>
        )}

        {sessions.map((session) => {
          const { label, icon: Icon } = parseDevice(session.userAgent);
          const browser = parseBrowser(session.userAgent);

          return (
            <div
              key={session.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-background border border-border/60 text-muted-foreground">
                <Icon className="size-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {label}{browser ? ` · ${browser}` : ""}
                  </span>
                  {session.isCurrent && (
                    <Badge className="rounded-full bg-emerald-500/15 text-emerald-600 border-emerald-200 text-[10px] px-1.5 py-0 hover:bg-emerald-500/15">
                      الجهاز الحالي
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {session.ipAddress && <span className="font-mono">{session.ipAddress} · </span>}
                  {formatDate(session.lastUsedAt)}
                </p>
              </div>

              {!session.isCurrent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                  onClick={() => handleRevoke(session.id)}
                  disabled={isPending}
                  title="إنهاء هذه الجلسة"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
