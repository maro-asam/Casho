import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { verifyPendingGoogleAuth } from "@/lib/auth/pending-google-auth";
import { CompleteGoogleForm } from "../../_components/forms/complete-google-form";

export default async function CompleteGooglePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pendingGoogleAuth")?.value;

  if (!token) redirect("/register");

  const googleData = verifyPendingGoogleAuth(token);
  if (!googleData) redirect("/register");

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Image src="/logo.svg" alt="Casho" width={44} height={44} priority className="rounded-xl" />
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            أكمل بيانات متجرك
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            خطوة أخيرة وهيبدأ متجرك 🚀
          </p>
        </div>

        <CompleteGoogleForm email={googleData.email} name={googleData.name} />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          باستخدامك كاشو، أنت توافق على الشروط وسياسة الخصوصية
        </p>
      </div>
    </div>
  );
}
