"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "./require.actions";
import { getCurrentSessionId } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/security-log";

export type SessionDTO = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
};

export async function GetActiveSessionsAction(): Promise<SessionDTO[]> {
  const user = await requireAuth();
  const currentSessionId = await getCurrentSessionId();

  const sessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
    orderBy: { lastUsedAt: "desc" },
  });

  return sessions.map((s) => ({
    ...s,
    isCurrent: s.id === currentSessionId,
  }));
}

export async function RevokeSessionAction(
  sessionId: string,
): Promise<{ success: boolean; message: string }> {
  const user = await requireAuth();

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true },
  });

  if (!session) {
    return { success: false, message: "الجلسة غير موجودة" };
  }

  await prisma.session.delete({ where: { id: sessionId } });

  logSecurityEvent({
    event: "SESSION_REVOKED",
    userId: user.id,
    metadata: { revokedSessionId: sessionId } as Record<string, string>,
  });

  revalidatePath("/dashboard/settings");

  return { success: true, message: "تم إنهاء الجلسة" };
}

export async function RevokeAllOtherSessionsAction(): Promise<{
  success: boolean;
  message: string;
}> {
  const user = await requireAuth();
  const currentSessionId = await getCurrentSessionId();

  await prisma.session.deleteMany({
    where: {
      userId: user.id,
      ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
    },
  });

  logSecurityEvent({
    event: "ALL_SESSIONS_REVOKED",
    userId: user.id,
    metadata: { keptSession: currentSessionId ?? "none" } as Record<string, string>,
  });

  revalidatePath("/dashboard/settings");

  return { success: true, message: "تم تسجيل الخروج من جميع الأجهزة الأخرى" };
}
