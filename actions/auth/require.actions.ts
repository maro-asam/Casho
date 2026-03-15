"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const sessionToken = (await cookies()).get("sessionToken")?.value;

  if (!sessionToken) redirect("/login");

  return sessionToken;
}
