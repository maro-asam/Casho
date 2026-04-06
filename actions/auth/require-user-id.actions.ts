"use server";

import { requireAuth } from "./require.actions";

export async function requireUserId() {
  const user = await requireAuth();
  return user.id;
}
