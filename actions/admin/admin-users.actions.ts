"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/actions/admin/admin-guard.actions";
import { logSecurityEvent } from "@/lib/auth/security-log";

type ActionResult = { success: boolean; message: string };

/** Roles assignable here. SALES is managed from the sales team page (it needs a SalesRep row). */
const ASSIGNABLE_ROLES: UserRole[] = [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN];

/** Signs a user out everywhere (e.g. a stolen device or a compromised account). */
export async function revokeUserSessionsAction(userId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (admin.id === userId) {
      return { success: false, message: "لإنهاء جلساتك إنت استخدم صفحة الأمان في إعدادات حسابك" };
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!target) return { success: false, message: "المستخدم مش موجود" };
    if (target.role === UserRole.SUPER_ADMIN && admin.role !== UserRole.SUPER_ADMIN) {
      return { success: false, message: "مينفعش تنهي جلسات سوبر أدمن" };
    }

    const { count } = await prisma.session.deleteMany({ where: { userId } });
    logSecurityEvent({ event: "ALL_SESSIONS_REVOKED", userId, metadata: { byAdminId: admin.id, count } });

    revalidatePath(`/admin/users/${userId}`);
    return { success: true, message: count ? `اتقفلت ${count} جلسة` : "مكانش فيه جلسات مفتوحة" };
  } catch (error) {
    console.error("revokeUserSessionsAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء إنهاء الجلسات" };
  }
}

/** Super-admin only. Can't change your own role or touch sales reps from here. */
export async function setUserRoleAction(userId: string, role: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireSuperAdmin();
  } catch {
    return { success: false, message: "تغيير الصلاحيات للسوبر أدمن بس" };
  }

  try {
    if (!(ASSIGNABLE_ROLES as string[]).includes(role)) {
      return { success: false, message: "الصلاحية دي مش متاحة من هنا" };
    }
    if (admin.id === userId) {
      return { success: false, message: "مينفعش تغيّر صلاحيتك إنت" };
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!target) return { success: false, message: "المستخدم مش موجود" };
    if (target.role === UserRole.SALES) {
      return { success: false, message: "صلاحية المندوب بتتدار من صفحة فريق المبيعات" };
    }
    if (target.role === role) return { success: true, message: "الصلاحية زي ما هي" };

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { role: role as UserRole } }),
      // Elevated or reduced rights take effect on a fresh sign-in.
      prisma.session.deleteMany({ where: { userId } }),
    ]);
    logSecurityEvent({ event: "ROLE_CHANGED", userId, metadata: { byAdminId: admin.id, from: target.role, to: role } });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, message: "اتغيرت الصلاحية، والمستخدم هيحتاج يسجّل دخول تاني" };
  } catch (error) {
    console.error("setUserRoleAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء تغيير الصلاحية" };
  }
}

/** Marks an email as verified when the owner confirmed it through support. */
export async function markUserEmailVerifiedAction(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, message: "البريد بقى متأكد" };
  } catch (error) {
    console.error("markUserEmailVerifiedAction Error:", error);
    return { success: false, message: "حصل خطأ" };
  }
}
