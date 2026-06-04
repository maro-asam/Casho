"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { LoginState } from "./auth.types";
import { loginSchema } from "@/validations/auth.schema";
import { getFieldErrors } from "@/lib/zod";
import { createUserSession } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { checkLoginRateLimit, recordLoginAttempt, formatRetryAfter } from "@/lib/auth/rate-limit";
import { logSecurityEvent } from "@/lib/auth/security-log";

async function getIp(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}

export async function LoginAction(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const rawData = {
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  };

  const parsed = loginSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: "يرجى مراجعة البيانات",
      fieldErrors: getFieldErrors(parsed.error),
    };
  }

  const { email, password } = parsed.data;
  const ipAddress = await getIp();
  const GENERIC_ERROR = "البريد الإلكتروني أو كلمة المرور غير صحيحة";

  // ── Rate limit check ───────────────────────────────────────────────────────
  const rateCheck = await checkLoginRateLimit(email, ipAddress);
  if (!rateCheck.allowed) {
    logSecurityEvent({ event: "LOGIN_BLOCKED", ipAddress, metadata: { email, reason: rateCheck.reason } });
    return {
      error: `الحساب محظور مؤقتاً بسبب المحاولات المتكررة. حاول بعد ${formatRetryAfter(rateCheck.retryAfter)}.`,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, passwordAlgo: true },
    });

    // Constant-time-ish path when user doesn't exist: run a dummy verify
    // to prevent timing oracle attacks
    if (!user) {
      await hashPassword("dummy-timing-protection");
      await recordLoginAttempt({ email, ipAddress, success: false });
      logSecurityEvent({ event: "LOGIN_FAILURE", ipAddress, metadata: { email, reason: "user_not_found" } });
      return { error: GENERIC_ERROR };
    }

    if (!user.password) {
      // Google-only account — don't reveal this is a Google account
      await recordLoginAttempt({ email, ipAddress, success: false, userId: user.id });
      logSecurityEvent({ event: "LOGIN_FAILURE", ipAddress, metadata: { email, reason: "no_password" } });
      return { error: GENERIC_ERROR };
    }

    const { valid, needsRehash } = await verifyPassword(user.password, password);

    if (!valid) {
      await recordLoginAttempt({ email, ipAddress, success: false, userId: user.id });
      logSecurityEvent({ event: "LOGIN_FAILURE", userId: user.id, ipAddress, metadata: { email } });
      return { error: GENERIC_ERROR };
    }

    // Transparent bcrypt → argon2id migration on successful login
    if (needsRehash) {
      const newHash = await hashPassword(password);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash, passwordAlgo: "argon2id" },
      });
    }

    await recordLoginAttempt({ email, ipAddress, success: true, userId: user.id });
    await createUserSession(user.id);
    logSecurityEvent({ event: "LOGIN_SUCCESS", userId: user.id, ipAddress, metadata: { email } });

    return {
      success: true,
      message: "تم تسجيل الدخول بنجاح جاري التحويل...",
    };
  } catch (error) {
    console.error("LoginAction error:", error);
    return { error: "حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى" };
  }
}
