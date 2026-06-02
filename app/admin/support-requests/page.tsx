import { HeadphonesIcon, MessageSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default async function AdminSupportPage() {
  await requireAdmin();

  const requests = await prisma.supportRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { store: { select: { name: true, slug: true } } },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">طلبات الدعم</h1>
        <p className="mt-1 text-sm text-muted-foreground">{requests.length} طلب دعم مسجل</p>
      </div>

      {/* List */}
      <div className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">كل الطلبات</h2>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 text-center">
            <HeadphonesIcon className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">لا توجد طلبات دعم بعد</p>
          </div>
        ) : (
          <div className="divide-y">
            {requests.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageSquare className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{item.title}</p>
                      <span className="text-xs text-muted-foreground">{fmtDate(item.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                    {item.store && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        المتجر: <span className="font-medium text-foreground">{item.store.name}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
