import type { Metadata } from "next";
import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/saas-page";
import { Panel, PanelEmpty } from "../_components/admin-ui";
import { fmtDateTime, fmtNum } from "../_lib/format";
import { BroadcastForm } from "./_components/broadcast-form";

export const metadata: Metadata = { title: "الإشعارات" };

export default async function AdminNotificationsPage() {
  const broadcastWhere = { type: NotificationType.SYSTEM, data: { path: ["broadcast"], equals: true } };

  // Each send is one INSERT, so rows of one broadcast share title/message/createdAt.
  const history = await prisma.notification.groupBy({
    by: ["title", "message", "href", "createdAt"],
    where: broadcastWhere,
    _count: { _all: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Read rate per send.
  const reads = await Promise.all(
    history.map((h) =>
      prisma.notification.count({ where: { ...broadcastWhere, title: h.title, createdAt: h.createdAt, readAt: { not: null } } }),
    ),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="الإشعارات" description="ابعت إعلان أو تنبيه يظهر في جرس الإشعارات عند التجار." />

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="إشعار جديد" className="lg:col-span-3">
          <BroadcastForm />
        </Panel>

        <Panel title="اللي اتبعت قبل كده" description="آخر ٢٠ إرسال ونسبة القراءة." className="lg:col-span-2" flush>
          {history.length === 0 ? (
            <PanelEmpty>لسه مبعتش إشعارات جماعية.</PanelEmpty>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((h, i) => {
                const sent = h._count._all;
                const pct = sent ? Math.round((reads[i] / sent) * 100) : 0;
                return (
                  <li key={`${h.title}-${h.createdAt.toISOString()}`} className="space-y-1.5 px-4 py-3">
                    <p className="text-sm font-medium">{h.title}</p>
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{h.message}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{fmtDateTime(h.createdAt)}</span>
                      <span>·</span>
                      <span>
                        {fmtNum(sent)} متجر · قرأه {fmtNum(pct)}٪
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted" role="img" aria-label={`نسبة القراءة ${pct}٪`}>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
