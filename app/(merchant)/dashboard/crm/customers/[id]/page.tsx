import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, UserCircle } from "lucide-react";

import { GetCustomerProfileAction, GetCustomerInsightsAction } from "@/actions/crm/customers.actions";
import { GetTagsAction } from "@/actions/crm/customer-tags.actions";
import { GetCustomerTimelineAction } from "@/actions/crm/customer-timeline.actions";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { CustomerProfileClient } from "./_components/CustomerProfileClient";
import { CustomerStatusBadge } from "../../_components/CustomerHealthBadge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) return { title: "عميل" };
  const customer = await prisma.customer.findFirst({
    where: { id, storeId: store.id },
    select: { name: true, phone: true },
  });
  return { title: customer?.name ?? customer?.phone ?? "ملف العميل" };
}

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [profile, allTags, insights, timelineData] = await Promise.all([
    GetCustomerProfileAction(id),
    GetTagsAction(),
    GetCustomerInsightsAction(id),
    GetCustomerTimelineAction(id),
  ]);

  if (!profile) notFound();

  // Fetch orders with items
  const orders = await prisma.order.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      total: true,
      status: true,
      createdAt: true,
      source: true,
      items: {
        select: {
          quantity: true,
          product: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/crm" className="hover:text-foreground transition-colors">
          CRM
        </Link>
        <ArrowRight className="size-3.5" />
        <Link href="/dashboard/crm/customers" className="hover:text-foreground transition-colors">
          العملاء
        </Link>
        <ArrowRight className="size-3.5" />
        <span className="text-foreground font-medium">
          {profile.name ?? profile.phone}
        </span>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <UserCircle className="size-4.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">
              {profile.name ?? profile.phone}
            </h1>
            <CustomerStatusBadge status={profile.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            عميل منذ {new Date(profile.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <CustomerProfileClient
        customer={profile}
        orders={orders}
        allTags={allTags.map((t) => ({ id: t.id, name: t.name, color: t.color }))}
        insights={insights}
        timelineEvents={timelineData.events.map((e) => ({
          ...e,
          metadata: e.metadata as Record<string, unknown> | null,
        }))}
      />
    </div>
  );
}
