import { ReactNode } from "react";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import AdminSidebarNav from "./_components/admin-sidebar-nav";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  const links = [
    {
      title: "الرئيسية",
      href: "/admin",
      icon: "dashboard",
    },
    {
      title: "المتاجر",
      href: "/admin/stores",
      icon: "store",
    },
    {
      title: "طلبات الشحن",
      href: "/admin/topup-requests",
      icon: "wallet",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-muted/40" dir="rtl">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-l bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full flex-col p-4">
            <div className="mb-8 px-2">
              <h2 className="text-lg font-bold tracking-tight">CASHO Admin</h2>
              <p className="text-xs text-muted-foreground">إدارة المنصة</p>
            </div>

            <AdminSidebarNav links={links} />

            <div className="mt-auto pt-6">
              <div className="rounded-xl border p-3 text-xs text-muted-foreground">
                إدارة المتاجر والاشتراكات وطلبات الشحن
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col">
          <div className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>

          <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}