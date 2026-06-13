"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { StoreRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/actions/auth/require.actions";
import { ASSIGNABLE_ROLES, hasPermission } from "@/lib/store/permissions";
import { logSecurityEvent } from "@/lib/auth/security-log";
import { createNotification } from "@/lib/notifications/in-app";

// ─── helpers ────────────────────────────────────────────────────────────────

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function getOwnedStore(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true, userId: true },
  });
  return store;
}

async function assertOwner(userId: string, storeId: string) {
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId },
    select: { id: true, name: true },
  });
  if (!store) throw new Error("غير مصرح");
  return store;
}

// ─── types ──────────────────────────────────────────────────────────────────

export type MemberDTO = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: StoreRole;
  joinedAt: Date;
  isCurrentUser: boolean;
};

export type InvitationDTO = {
  id: string;
  email: string;
  role: StoreRole;
  expiresAt: Date;
  createdAt: Date;
  acceptInvitationUrl: string;
};

// ─── GetStoreMembersAction ───────────────────────────────────────────────────

export async function GetStoreMembersAction(): Promise<{
  members: MemberDTO[];
  pendingInvitations: InvitationDTO[];
}> {
  const user = await requireAuth();
  const store = await getOwnedStore(user.id);
  if (!store) return { members: [], pendingInvitations: [] };

  const [dbMembers, dbInvitations] = await Promise.all([
    prisma.storeMember.findMany({
      where: { storeId: store.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.storeInvitation.findMany({
      where: {
        storeId: store.id,
        acceptedAt: null,
        declinedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const members: MemberDTO[] = dbMembers.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    joinedAt: m.joinedAt,
    isCurrentUser: m.userId === user.id,
  }));

  // Include the owner as a member entry (virtual)
  const ownerAlreadyInMembers = members.some((m) => m.userId === store.userId);
  if (!ownerAlreadyInMembers) {
    const owner = await prisma.user.findUnique({
      where: { id: store.userId },
      select: { id: true, name: true, email: true },
    });
    if (owner) {
      members.unshift({
        id: `owner-${owner.id}`,
        userId: owner.id,
        name: owner.name,
        email: owner.email,
        role: "STORE_OWNER",
        joinedAt: new Date(0),
        isCurrentUser: owner.id === user.id,
      });
    }
  }

  const pendingInvitations: InvitationDTO[] = dbInvitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
    acceptInvitationUrl: `${appUrl}/dashboard/invitation/${inv.id}`,
  }));

  return { members, pendingInvitations };
}

// ─── InviteMemberAction ──────────────────────────────────────────────────────

const InviteSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  role: z.enum(["STORE_MANAGER", "STORE_STAFF"]),
});

export async function InviteMemberAction(
  formData: FormData,
): Promise<{ success: boolean; message: string; invitationUrl?: string }> {
  const user = await requireAuth();
  const store = await getOwnedStore(user.id);
  if (!store) return { success: false, message: "لا يوجد متجر" };

  // Plan limit: check member count
  const fullStore = await prisma.store.findUnique({ where: { id: store.id }, select: { planName: true } });
  if (fullStore) {
    const { getPlanLimits } = await import("@/lib/subscriptions");
    const planLimits = getPlanLimits(fullStore.planName);
    if (planLimits.members !== null) {
      const memberCount = await prisma.storeMember.count({ where: { storeId: store.id } });
      if (memberCount >= planLimits.members) {
        return {
          success: false,
          message: `باقتك الحالية تسمح بحد أقصى ${planLimits.members} عضو. يرجى الترقية لإضافة المزيد.`,
        };
      }
    }
  }

  const parsed = InviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { email, role } = parsed.data;

  // Check that the inviter can assign this role
  if (!ASSIGNABLE_ROLES["STORE_OWNER"].includes(role as StoreRole)) {
    return { success: false, message: "لا يمكنك تعيين هذا الدور" };
  }

  // Check if user already a member
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    const existing = await prisma.storeMember.findUnique({
      where: { userId_storeId: { userId: existingUser.id, storeId: store.id } },
    });
    if (existing) return { success: false, message: "هذا المستخدم عضو بالفعل في المتجر" };
    if (existingUser.id === store.userId) {
      return { success: false, message: "هذا المستخدم هو مالك المتجر بالفعل" };
    }
  }

  // Cancel any existing pending invitation for same email+store
  await prisma.storeInvitation.updateMany({
    where: { storeId: store.id, email, acceptedAt: null, declinedAt: null },
    data: { declinedAt: new Date() },
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.storeInvitation.create({
    data: {
      email,
      storeId: store.id,
      role: role as StoreRole,
      tokenHash,
      expiresAt,
      invitedByUserId: user.id,
    },
  });

  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const invitationUrl = `${appUrl}/dashboard/invitation/${invitation.id}`;

  // Notify invited user if they already have an account
  if (existingUser) {
    createNotification({
      userId: existingUser.id,
      type: "STORE_INVITATION",
      title: "دعوة للانضمام إلى متجر",
      message: `تمت دعوتك للانضمام إلى متجر ${store.name}`,
      href: invitationUrl,
    });
  }

  revalidatePath("/dashboard/settings");
  return { success: true, message: "تم إنشاء رابط الدعوة", invitationUrl };
}

// ─── RemoveMemberAction ──────────────────────────────────────────────────────

export async function RemoveMemberAction(
  memberId: string,
): Promise<{ success: boolean; message: string }> {
  const user = await requireAuth();
  const store = await getOwnedStore(user.id);
  if (!store) return { success: false, message: "غير مصرح" };

  const member = await prisma.storeMember.findFirst({
    where: { id: memberId, storeId: store.id },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!member) return { success: false, message: "العضو غير موجود" };

  await prisma.storeMember.delete({ where: { id: memberId } });

  createNotification({
    userId: member.userId,
    type: "MEMBER_REMOVED",
    title: "تمت إزالتك من المتجر",
    message: `تمت إزالتك من متجر ${store.name}`,
    href: "/dashboard",
  });

  logSecurityEvent({
    event: "SESSION_REVOKED",
    userId: user.id,
    metadata: { action: "remove_member", removedUserId: member.userId, storeId: store.id },
  });

  revalidatePath("/dashboard/settings");
  return { success: true, message: "تم إزالة العضو" };
}

// ─── UpdateMemberRoleAction ──────────────────────────────────────────────────

export async function UpdateMemberRoleAction(
  memberId: string,
  newRole: StoreRole,
): Promise<{ success: boolean; message: string }> {
  const user = await requireAuth();
  const store = await getOwnedStore(user.id);
  if (!store) return { success: false, message: "غير مصرح" };

  if (!ASSIGNABLE_ROLES["STORE_OWNER"].includes(newRole)) {
    return { success: false, message: "لا يمكن تعيين هذا الدور" };
  }

  const member = await prisma.storeMember.findFirst({
    where: { id: memberId, storeId: store.id },
  });

  if (!member) return { success: false, message: "العضو غير موجود" };

  await prisma.storeMember.update({
    where: { id: memberId },
    data: { role: newRole },
  });

  revalidatePath("/dashboard/settings");
  return { success: true, message: "تم تحديث الدور" };
}

// ─── CancelInvitationAction ──────────────────────────────────────────────────

export async function CancelInvitationAction(
  invitationId: string,
): Promise<{ success: boolean; message: string }> {
  const user = await requireAuth();
  const store = await getOwnedStore(user.id);
  if (!store) return { success: false, message: "غير مصرح" };

  const inv = await prisma.storeInvitation.findFirst({
    where: { id: invitationId, storeId: store.id },
  });
  if (!inv) return { success: false, message: "الدعوة غير موجودة" };

  await prisma.storeInvitation.update({
    where: { id: invitationId },
    data: { declinedAt: new Date() },
  });

  revalidatePath("/dashboard/settings");
  return { success: true, message: "تم إلغاء الدعوة" };
}

// ─── TransferOwnershipAction ─────────────────────────────────────────────────

export async function TransferOwnershipAction(
  targetMemberId: string,
): Promise<{ success: boolean; message: string }> {
  const user = await requireAuth();
  const store = await assertOwner(user.id, (await getOwnedStore(user.id))?.id ?? "").catch(
    () => null,
  );
  if (!store) return { success: false, message: "غير مصرح" };

  const target = await prisma.storeMember.findFirst({
    where: { id: targetMemberId, storeId: store.id },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!target) return { success: false, message: "العضو غير موجود" };
  if (target.userId === user.id) return { success: false, message: "لا يمكنك نقل الملكية لنفسك" };

  await prisma.$transaction(async (tx) => {
    // Update Store.userId to new owner
    await tx.store.update({
      where: { id: store.id },
      data: { userId: target.userId },
    });

    // Remove the new owner from StoreMember (they are now the primary owner)
    await tx.storeMember.delete({ where: { id: target.id } });

    // Add the old owner as a STORE_MANAGER member
    await tx.storeMember.upsert({
      where: { userId_storeId: { userId: user.id, storeId: store.id } },
      create: { userId: user.id, storeId: store.id, role: "STORE_MANAGER" },
      update: { role: "STORE_MANAGER" },
    });
  });

  createNotification({
    userId: target.userId,
    type: "OWNERSHIP_TRANSFERRED",
    title: "تم نقل ملكية المتجر إليك",
    message: `أصبحت الآن مالك متجر ${store.name}`,
    href: "/dashboard",
  });

  logSecurityEvent({
    event: "ROLE_CHANGED",
    userId: user.id,
    metadata: {
      action: "transfer_ownership",
      toUserId: target.userId,
      storeId: store.id,
    },
  });

  revalidatePath("/dashboard/settings");
  return { success: true, message: "تم نقل الملكية بنجاح" };
}

// ─── AcceptInvitationAction ──────────────────────────────────────────────────

export async function AcceptInvitationAction(
  invitationId: string,
): Promise<{ success: boolean; message: string; storeId?: string }> {
  const user = await requireAuth();

  const invitation = await prisma.storeInvitation.findUnique({
    where: { id: invitationId },
    include: { store: { select: { id: true, name: true } } },
  });

  if (!invitation) return { success: false, message: "الدعوة غير موجودة أو انتهت صلاحيتها" };
  if (invitation.acceptedAt) return { success: false, message: "تم قبول هذه الدعوة مسبقاً" };
  if (invitation.declinedAt) return { success: false, message: "تم رفض هذه الدعوة" };
  if (invitation.expiresAt < new Date()) return { success: false, message: "انتهت صلاحية الدعوة" };

  // Verify email matches (case-insensitive)
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return { success: false, message: "هذه الدعوة لبريد إلكتروني مختلف" };
  }

  // Check not already a member
  const existing = await prisma.storeMember.findUnique({
    where: { userId_storeId: { userId: user.id, storeId: invitation.storeId } },
  });
  if (existing) {
    await prisma.storeInvitation.update({
      where: { id: invitationId },
      data: { acceptedAt: new Date() },
    });
    return { success: true, message: "أنت عضو بالفعل في هذا المتجر", storeId: invitation.storeId };
  }

  await prisma.$transaction([
    prisma.storeMember.create({
      data: { userId: user.id, storeId: invitation.storeId, role: invitation.role },
    }),
    prisma.storeInvitation.update({
      where: { id: invitationId },
      data: { acceptedAt: new Date() },
    }),
  ]);

  // Notify the store owner
  createNotification({
    storeId: invitation.storeId,
    type: "MEMBER_JOINED",
    title: "انضم عضو جديد",
    message: `${user.name ?? user.email} انضم إلى متجر ${invitation.store.name}`,
    href: "/dashboard/settings",
  });

  revalidatePath("/dashboard");
  return { success: true, message: "تم قبول الدعوة بنجاح", storeId: invitation.storeId };
}

// ─── DeclineInvitationAction ─────────────────────────────────────────────────

export async function DeclineInvitationAction(
  invitationId: string,
): Promise<{ success: boolean; message: string }> {
  const user = await requireAuth();

  const invitation = await prisma.storeInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) return { success: false, message: "الدعوة غير موجودة" };
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return { success: false, message: "هذه الدعوة لبريد إلكتروني مختلف" };
  }

  await prisma.storeInvitation.update({
    where: { id: invitationId },
    data: { declinedAt: new Date() },
  });

  return { success: true, message: "تم رفض الدعوة" };
}

// ─── GetInvitationDetailsAction ──────────────────────────────────────────────

export async function GetInvitationDetailsAction(invitationId: string) {
  const invitation = await prisma.storeInvitation.findUnique({
    where: { id: invitationId },
    include: {
      store: { select: { name: true, slug: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (!invitation) return null;
  if (invitation.acceptedAt || invitation.declinedAt || invitation.expiresAt < new Date()) {
    return null;
  }

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    storeName: invitation.store.name,
    invitedByName: invitation.invitedBy.name ?? invitation.invitedBy.email,
    expiresAt: invitation.expiresAt,
  };
}
