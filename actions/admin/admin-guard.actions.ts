"use server";

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * Guards admin routes using DB-backed role (ADMIN | SUPER_ADMIN).
 * Replaces the previous hardcoded email list approach.
 *
 * Bootstrap: set the first admin by running once in psql:
 *   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
 */
export async function requireAdmin() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireSuperAdmin() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });

  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Unauthorized");
  }

  return user;
}
