"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/actions/auth/require.actions";
import { ACTIVE_STORE_COOKIE, canUseStore } from "@/lib/store/store-guard";
import { ACTIVE_BRANCH_COOKIE } from "@/lib/store/branch-context";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

/** Switch the store the user works in (their own, or one they are a member of). */
export async function SwitchStoreAction(storeId: string) {
  const user = await requireAuth();
  if (!(await canUseStore(user.id, storeId))) throw new Error("غير مصرح");

  const jar = await cookies();
  jar.set(ACTIVE_STORE_COOKIE, storeId, cookieOptions);
  // Branches belong to a store; start from that store's default branch.
  jar.delete(ACTIVE_BRANCH_COOKIE);

  revalidatePath("/", "layout");
  return { success: true };
}
