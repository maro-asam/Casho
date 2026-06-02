import Link from "next/link";
import { CheckCircle2, Clock3, ExternalLink, ImageIcon, XCircle, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TopupMethod, TopupRequestStatus } from "@prisma/client";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { approveTopupRequestAction, rejectTopupRequestAction } from "@/actions/admin/admin-topup.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function fmt(v: number) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(v / 100);
}
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

const STATUS_CONFIG: Record<TopupRequestStatus, { label: string; cls: string }> = {
  PENDING:  { label: "معلق",          cls: "bg-amber-500/10  text-amber-700  border-amber-500/20"  },
  APPROVED: { label: "تمت الموافقة",  cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  REJECTED: { label: "مرفوض",        cls: "bg-rose-500/10   text-rose-700   border-rose-500/20"   },
};

const METHOD_LABELS: Record<TopupMethod, string> = {
  VODAFONE_CASH: "فودافون كاش",
  INSTAPAY:      "إنستا باي",
  BANK_TRANSFER: "تحويل بنكي",
  KASHIER:       "Kashier",
};

export default async function AdminTopupRequestsPage() {
  await requireAdmin();

  const requests = await prisma.topupRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, amount: true, method: true, status: true,
      note: true, transferRef: true, receiptImage: true, createdAt: true,
      store: { select: { id: true, name: true, slug: true, balance: true, user: { select: { email: true } } } },
    },
  });

  const pending  = requests.filter((r) => r.status === "PENDING").length;
  const approved = requests.filter((r) => r.status === "APPROVED").length;
  const rejected = requests.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">طلبات الشحن</h1>
        <p className="mt-1 text-sm text-muted-foreground">راجع واعتمد أو ارفض طلبات شحن التجار</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "معلقة",         value: pending,  icon: Clock3,       cls: "text-amber-600   bg-amber-500/10"   },
          { label: "موافق عليها",   value: approved, icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-500/10" },
          { label: "مرفوضة",        value: rejected, icon: XCircle,      cls: "text-rose-600    bg-rose-500/10"    },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold">{s.value}</p>
              </div>
              <div className={cn("flex size-10 items-center justify-center rounded-lg", s.cls)}>
                <s.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Requests */}
      <div className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">كل الطلبات</h2>
          <p className="text-sm text-muted-foreground">{requests.length} طلب إجمالاً</p>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 text-center">
            <Wallet className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">لا توجد طلبات شحن بعد</p>
          </div>
        ) : (
          <div className="divide-y">
            {requests.map((req) => {
              const cfg = STATUS_CONFIG[req.status];
              const isPending = req.status === "PENDING";

              return (
                <div key={req.id} className="p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn("rounded-full border text-xs", cfg.cls)}>
                          {cfg.label}
                        </Badge>
                        <Badge variant="outline" className="rounded-full text-xs">
                          {METHOD_LABELS[req.method] ?? req.method}
                        </Badge>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                          {fmt(req.amount)}
                        </span>
                      </div>

                      <div>
                        <p className="font-medium">{req.store.name}</p>
                        <p className="text-sm text-muted-foreground">{req.store.user.email}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          رصيد حالي: {fmt(req.store.balance)} · {fmtDate(req.createdAt)}
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg bg-muted/50 px-3 py-2">
                          <p className="text-[10px] text-muted-foreground">رقم التحويل</p>
                          <p className="mt-0.5 text-sm font-medium">{req.transferRef || "—"}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 px-3 py-2">
                          <p className="text-[10px] text-muted-foreground">ملاحظة</p>
                          <p className="mt-0.5 text-sm font-medium">{req.note || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 lg:flex-col lg:w-44">
                      <Button asChild variant="outline" size="sm" className="rounded-lg">
                        <Link href={`/admin/stores/${req.store.slug}`}>
                          <ExternalLink className="me-1.5 size-3.5" />
                          المتجر
                        </Link>
                      </Button>

                      {req.receiptImage && (
                        <Button asChild variant="outline" size="sm" className="rounded-lg">
                          <a href={req.receiptImage} target="_blank" rel="noreferrer">
                            <ImageIcon className="me-1.5 size-3.5" />
                            الإيصال
                          </a>
                        </Button>
                      )}

                      {isPending && (
                        <>
                          <form action={async () => { "use server"; await approveTopupRequestAction(req.id); }}>
                            <Button size="sm" className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                              <CheckCircle2 className="me-1.5 size-3.5" />
                              اعتماد
                            </Button>
                          </form>
                          <form action={async () => { "use server"; await rejectTopupRequestAction(req.id); }}>
                            <Button size="sm" variant="destructive" className="w-full rounded-lg">
                              <XCircle className="me-1.5 size-3.5" />
                              رفض
                            </Button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
