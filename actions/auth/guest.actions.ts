"use server";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function GetGuestSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get("guestSessionId")?.value ?? null;
}

export async function EnsureGuestSessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get("guestSessionId")?.value;

  if (existing) return existing;

  const id = randomUUID();

  cookieStore.set("guestSessionId", id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });

  return id;
}