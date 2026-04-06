"use server";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";

import {
  GUEST_SESSION_COOKIE_NAME,
  GUEST_SESSION_MAX_AGE,
} from "@/lib/auth/constants";

export async function GetGuestSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function EnsureGuestSessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_SESSION_COOKIE_NAME)?.value;

  if (existing) return existing;

  const id = randomUUID();

  cookieStore.set(GUEST_SESSION_COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  return id;
}
