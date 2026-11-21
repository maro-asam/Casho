import { prisma } from "@/lib/prisma";
import { canReusePhone, phoneHeldByMultiAccountInbox } from "./multi-account";

/**
 * A new account's phone is taken when another account already has it — unless
 * the allow-list lets this signup reuse it (lib/auth/multi-account). Shared by
 * both signups: email/password and "complete your Google signup".
 */
export async function isSignupPhoneTaken(email: string, phone: string): Promise<boolean> {
  if (canReusePhone(email, phone)) return false;
  // A taken phone is still fine when it's on an allow-listed person's account.
  const holders = await prisma.user.findMany({
    where: { phone_number: phone },
    select: { email: true },
    take: 50,
  });
  return holders.length > 0 && !phoneHeldByMultiAccountInbox(holders.map((holder) => holder.email));
}
