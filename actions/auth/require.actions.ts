"use server";

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";

export async function requireAuth() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}