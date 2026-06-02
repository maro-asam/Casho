import { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import AdminSidebarNav from "./_components/admin-sidebar-nav";
import AdminThemeToggle from "./_components/admin-theme-toggle";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <div className="flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="hidden w-60 shrink-0 flex-col border-l bg-background lg:flex">
          {/* Logo */}
          <div className="flex h-14 items-center gap-2.5 border-b px-4">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <ShieldCheck className="size-4 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-semibold">كاشو</p>
              <p className="text-[10px] text-muted-foreground">لوحة الإدارة</p>
            </div>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto p-3">
            <AdminSidebarNav />
          </div>

          {/* Footer */}
          <div className="border-t p-3 space-y-1">
            <AdminThemeToggle />
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5">
              <div className="size-2 rounded-full bg-emerald-500" />
              <p className="text-xs text-muted-foreground">مباشر</p>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header */}
          <div className="flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <ShieldCheck className="size-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">كاشو Admin</span>
          </div>

          <div className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
