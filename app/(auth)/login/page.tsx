import type { Metadata } from "next";
import { AuthSplit } from "../_components/auth-split";
import { LoginAside } from "../_components/login-aside";
import { LoginForm } from "../_components/forms/login-form";

export const metadata: Metadata = { title: "تسجيل الدخول | كاشو" };

// Errors the Google OAuth callback redirects back with.
const GOOGLE_ERRORS: Record<string, string> = {
  google_cancelled: "لغيت الدخول بـ Google. جرّب تاني أو ادخل بالإيميل.",
  google_failed: "مقدرناش نكمّل الدخول بـ Google. جرّب تاني بعد شوية.",
  google_unverified: "إيميل حساب Google ده مش متأكد منه. أكّده الأول أو ادخل بالإيميل وكلمة المرور.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <AuthSplit aside={<LoginAside />} switchPrompt="معندكش حساب؟" switchLabel="اعمل متجرك" switchHref="/register">
      <LoginForm notice={error ? GOOGLE_ERRORS[error] : undefined} />
    </AuthSplit>
  );
}
