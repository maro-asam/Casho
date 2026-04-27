import { Suspense } from "react";
import ResetPasswordClient from "./_components/ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background">
          <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
            <div className="w-full rounded-xl border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold">تغيير كلمة المرور</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  جاري تحميل الصفحة...
                </p>
              </div>
            </div>
          </div>
        </main>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
