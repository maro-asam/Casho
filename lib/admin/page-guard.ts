import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { MEDIA_BUYER_HOME, canOpenAdminPanel, isAdminRole, isMediaBuyer } from "./panel-roles";

export type PanelUser = { id: string; email: string; role: UserRole };

/** The signed-in account (once per request), or null when signed out. */
const loadSignedInUser = cache(async (): Promise<PanelUser | null> => {
  const session = await getCurrentSession();
  if (!session?.user) return null;
  return prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, role: true } });
});

/**
 * Anyone the admin shell is for (admins and media buyers). Signed out → /login;
 * anyone else → null (callers decide: a page shows 404, a route answers 403).
 */
export async function getPanelUser(): Promise<PanelUser | null> {
  const user = await loadSignedInUser();
  if (!user) redirect("/login");
  return canOpenAdminPanel(user.role) ? user : null;
}

/**
 * The first line of every admin page outside the Analytics Center. Admins pass;
 * a media buyer is sent to the Analytics Center; anyone else gets a 404, so the
 * panel's existence isn't revealed.
 */
export async function requireAdminPage(): Promise<PanelUser> {
  const user = await getPanelUser();
  if (user && isAdminRole(user.role)) return user;
  if (user && isMediaBuyer(user.role)) redirect(MEDIA_BUYER_HOME);
  notFound();
}
