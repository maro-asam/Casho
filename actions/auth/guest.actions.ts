"use server";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function GetGuestSessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get("guestSessionId")?.value;

  if (existing) return existing;

  const id = randomUUID();
  cookieStore.set("guestSessionId", id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return id;
}
