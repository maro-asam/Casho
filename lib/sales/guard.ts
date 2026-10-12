import { redirect } from "next/navigation";
import { SalesRepStatus, UserRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type SalesRepContext = {
  userId: string;
  salesRepId: string;
  name: string | null;
  email: string;
  referralCode: string;
};

/**
 * Resolves the signed-in sales rep, or null when the account isn't an active
 * rep. No session → /login. The rep id always comes from the session — never
 * from the browser — and role + status are re-read on every request, so
 * disabling a rep locks them out immediately.
 */
export async function getSalesRepContext(): Promise<SalesRepContext | null> {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      referralCode: true,
      salesRep: { select: { id: true, status: true } },
    },
  });
  if (!user) redirect("/login");

  if (user.role !== UserRole.SALES || !user.salesRep || user.salesRep.status !== SalesRepStatus.ACTIVE || !user.referralCode) {
    return null;
  }
  return { userId: user.id, salesRepId: user.salesRep.id, name: user.name, email: user.email, referralCode: user.referralCode };
}

/** Every Sales page calls this; throws for anyone who isn't an active rep. */
export async function requireSalesRep(): Promise<SalesRepContext> {
  const rep = await getSalesRepContext();
  if (!rep) throw new Error("Unauthorized");
  return rep;
}
