"use server";

import { requireUserId } from "@/actions/auth/require-user-id.actions";

const ADMIN_EMAILS = ["marolinkedin@gmail.com", "cashostore0@gmail.com"];

export async function requireAdmin() {
  const userId = await requireUserId();

  // هات اليوزر بالإيميل من الداتابيز
  const { prisma } = await import("@/lib/prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    throw new Error("Unauthorized");
  }

  return user;
}