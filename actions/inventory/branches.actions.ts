"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PosShiftStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCanUse, FEATURE_KEYS } from "@/lib/entitlements";
import { logSecurityEvent } from "@/lib/auth/security-log";
import { ALL_BRANCHES } from "@/lib/store/branch-access";
import {
  ACTIVE_BRANCH_COOKIE,
  BranchAccessError,
  getDefaultBranch,
  requireBranchAccess,
  type Surface,
} from "@/lib/store/branch-context";

async function requireBranchAdmin() {
  return requireBranchAccess("manage_branches");
}

function revalidateBranches() {
  revalidatePath("/dashboard/inventory/branches");
  revalidatePath("/pos");
  revalidatePath("/dashboard", "layout");
}

export async function GetBranchesAction() {
  const ctx = await requireBranchAccess("manage_inventory");

  return prisma.branch.findMany({
    where: { storeId: ctx.storeId, ...(ctx.isOwner ? {} : { id: { in: ctx.branches.map((b) => b.id) } }) },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      isDefault: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          inventory: true,
          shifts: { where: { status: PosShiftStatus.OPEN } },
          members: true,
        },
      },
    },
  });
}

export async function GetOrCreateDefaultBranchAction() {
  const ctx = await requireBranchAccess("manage_inventory");
  const branch = await getDefaultBranch(ctx.storeId);
  return { id: branch.id, name: branch.name };
}

/**
 * Remembers which branch the user is looking at. The cookie is only a preference —
 * every action re-checks access — but we still refuse branches the user can't use.
 */
export async function SwitchBranchAction(branchId: string, surface: Surface = "dashboard") {
  const ctx = await requireBranchAccess(surface === "pos" ? "use_pos" : "view_analytics", surface);
  if (branchId !== ALL_BRANCHES && !ctx.branches.some((b) => b.id === branchId)) throw new BranchAccessError();

  (await cookies()).set(ACTIVE_BRANCH_COOKIE, branchId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function CreateBranchAction(data: {
  name: string;
  address?: string;
  phone?: string;
}) {
  const ctx = await requireBranchAdmin();
  await assertCanUse(ctx.storeId, FEATURE_KEYS.INVENTORY);

  if (!data.name?.trim()) throw new Error("اسم الفرع مطلوب");

  // Make sure the main branch exists first so the new one is never the default by accident.
  await getDefaultBranch(ctx.storeId);

  const branch = await prisma.branch.create({
    data: {
      storeId: ctx.storeId,
      name: data.name.trim(),
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
    },
  });

  logSecurityEvent({ event: "BRANCH_CREATED", userId: ctx.userId, metadata: { storeId: ctx.storeId, branchId: branch.id } });
  revalidateBranches();
  return branch;
}

export async function UpdateBranchAction(
  branchId: string,
  data: { name?: string; address?: string; phone?: string; isActive?: boolean },
) {
  const ctx = await requireBranchAdmin();

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, storeId: ctx.storeId },
    select: { isDefault: true, isActive: true },
  });
  if (!branch) throw new Error("الفرع غير موجود");

  if (data.isActive === false && branch.isActive) {
    if (branch.isDefault) throw new Error("لا يمكن إيقاف الفرع الرئيسي — اختار فرع رئيسي تاني الأول");
    const openShifts = await prisma.posShift.count({ where: { branchId, status: PosShiftStatus.OPEN } });
    if (openShifts) throw new Error(`في ${openShifts} وردية مفتوحة في الفرع ده — لازم تتقفل الأول`);
  }

  await prisma.branch.update({
    where: { id: branchId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });

  if (data.isActive !== undefined && data.isActive !== branch.isActive) {
    logSecurityEvent({
      event: data.isActive ? "BRANCH_ACTIVATED" : "BRANCH_DEACTIVATED",
      userId: ctx.userId,
      metadata: { storeId: ctx.storeId, branchId },
    });
  }

  revalidateBranches();
  return { success: true };
}

export async function SetDefaultBranchAction(branchId: string) {
  const ctx = await requireBranchAdmin();

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, storeId: ctx.storeId },
    select: { isActive: true },
  });
  if (!branch) throw new Error("الفرع غير موجود");
  if (!branch.isActive) throw new Error("فعّل الفرع الأول");

  await prisma.$transaction([
    prisma.branch.updateMany({
      where: { storeId: ctx.storeId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.branch.update({
      where: { id: branchId },
      data: { isDefault: true },
    }),
  ]);

  revalidateBranches();
  return { success: true };
}

/**
 * Only a branch with no history and no stock can be deleted; anything else is
 * deactivated instead so sales, shifts and movements keep their branch.
 */
export async function DeleteBranchAction(branchId: string) {
  const ctx = await requireBranchAdmin();

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, storeId: ctx.storeId },
    select: {
      isDefault: true,
      _count: {
        select: { shifts: true, orders: true, posReturns: true, movements: true, purchaseOrders: true, adjustments: true, transfersFrom: true, transfersTo: true },
      },
    },
  });
  if (!branch) throw new Error("الفرع غير موجود");
  if (branch.isDefault) throw new Error("لا يمكن حذف الفرع الافتراضي");

  const hasHistory = Object.values(branch._count).some((n) => n > 0);
  const stocked = await prisma.branchInventory.count({ where: { branchId, quantity: { not: 0 } } });
  if (hasHistory || stocked) {
    throw new Error("الفرع ده عليه حركات أو مخزون — اقفله (إيقاف) بدل الحذف عشان السجل يفضل محفوظ");
  }

  await prisma.branch.delete({ where: { id: branchId } });

  logSecurityEvent({ event: "BRANCH_DELETED", userId: ctx.userId, metadata: { storeId: ctx.storeId, branchId } });
  revalidateBranches();
  return { success: true };
}

// ─── Member branch access ─────────────────────────────────────

export async function GetMemberBranchAccessAction() {
  const ctx = await requireBranchAdmin();
  const [branches, members] = await Promise.all([
    prisma.branch.findMany({
      where: { storeId: ctx.storeId },
      select: { id: true, name: true, isActive: true, isDefault: true },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.storeMember.findMany({
      where: { storeId: ctx.storeId },
      select: { id: true, allBranches: true, branches: { select: { branchId: true } } },
    }),
  ]);
  return {
    branches,
    members: Object.fromEntries(
      members.map((m) => [m.id, { allBranches: m.allBranches, branchIds: m.branches.map((b) => b.branchId) }]),
    ),
  };
}

export async function SetMemberBranchesAction(input: { memberId: string; allBranches: boolean; branchIds: string[] }) {
  const ctx = await requireBranchAdmin();

  const member = await prisma.storeMember.findFirst({
    where: { id: input.memberId, storeId: ctx.storeId },
    select: { id: true, userId: true },
  });
  if (!member) throw new Error("العضو غير موجود");

  const branchIds = [...new Set(input.branchIds)];
  if (!input.allBranches) {
    if (!branchIds.length) throw new Error("اختار فرع واحد على الأقل");
    const valid = await prisma.branch.count({ where: { id: { in: branchIds }, storeId: ctx.storeId } });
    if (valid !== branchIds.length) throw new Error("فرع غير صالح");
  }

  await prisma.$transaction([
    prisma.storeMember.update({ where: { id: member.id }, data: { allBranches: input.allBranches } }),
    prisma.storeMemberBranch.deleteMany({ where: { memberId: member.id } }),
    ...(input.allBranches
      ? []
      : [prisma.storeMemberBranch.createMany({ data: branchIds.map((branchId) => ({ memberId: member.id, branchId })) })]),
  ]);

  logSecurityEvent({
    event: "MEMBER_BRANCHES_CHANGED",
    userId: ctx.userId,
    metadata: { storeId: ctx.storeId, memberUserId: member.userId, allBranches: input.allBranches, branchIds: branchIds.join(",") },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}
