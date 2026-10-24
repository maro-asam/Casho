import { Metadata } from "next";
import Link from "next/link";
import { AtSign, ExternalLink, Languages, Mail, ShieldCheck, Store, Truck, Users, UserX } from "lucide-react";

import { prisma } from "@/lib/prisma";

import { LargeTitle, Unavailable, appleButton } from "@/components/saas-page";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { IconTile } from "./_components/settings-ui";
import StoreSettingsForm from "./_components/StoreSettingsForm";
import ActiveSessions from "./_components/ActiveSessions";
import StoreMembers from "./_components/StoreMembers";
import LanguageSettings from "./_components/LanguageSettings";
import OrderEmailSettings from "./_components/OrderEmailSettings";
import DeleteAccount from "./_components/DeleteAccount";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetActiveSessionsAction } from "@/actions/auth/sessions.actions";
import { GetStoreMembersAction } from "@/actions/store/members.actions";
import { GetMemberBranchAccessAction } from "@/actions/inventory/branches.actions";
import { ACCOUNT_DELETION_TITLE, OPEN_DELETION_STATUSES } from "@/lib/account-deletion";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("إعدادات المتجر"),
  description: tr("تخصيص إعدادات المتجر والهوية البصرية وروابط التواصل"),
};
}

export default async function SettingsRoute() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const [sessions, { members, pendingInvitations }, branchAccess, deletionRequest] = await Promise.all([
    GetActiveSessionsAction(),
    GetStoreMembersAction(),
    GetMemberBranchAccessAction().catch(() => null),
    prisma.supportRequest.findFirst({
      where: { userId, title: ACCOUNT_DELETION_TITLE, status: { in: OPEN_DELETION_STATUSES } },
      select: { createdAt: true },
    }),
  ]);

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      poweredByRemovalEnabled: true,
      user: { select: { email: true } },
      settings: {
        select: {
          id: true,
          storeId: true,
          shippingPrice: true,
          primaryColor: true,
          secondaryColor: true,
          whatsappNumber: true,
          tiktok: true,
          instagram: true,
          facebook: true,
          email: true,
          emailNewOrders: true,
          emailCustomerOrders: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!store) {
    return (
      <div dir={tdir()} className="apple-card">
        <Unavailable icon={Store} title={tr("لا يوجد متجر")} description={tr("يجب إنشاء متجر أولًا قبل تعديل الإعدادات.")} />
      </div>
    );
  }

  const storeUrl = buildStoreUrl(store.slug);
  const nav = [
    { id: "store", label: tr("بيانات المتجر"), icon: Store, tint: "bg-primary" },
    { id: "shipping", label: tr("الشحن"), icon: Truck, tint: "bg-(--sys-orange)" },
    { id: "contact", label: tr("روابط التواصل"), icon: AtSign, tint: "bg-(--sys-green)" },
    { id: "emails", label: tr("إيميلات الطلبات"), icon: Mail, tint: "bg-(--sys-red)" },
    { id: "language", label: tr("لغة لوحة التحكم"), icon: Languages, tint: "bg-(--sys-indigo)" },
    { id: "team", label: tr("أعضاء المتجر"), icon: Users, tint: "bg-(--sys-teal)" },
    { id: "security", label: tr("الجلسات النشطة"), icon: ShieldCheck, tint: "bg-(--sys-gray)" },
    { id: "delete-account", label: tr("حذف الحساب"), icon: UserX, tint: "bg-(--sys-red)" },
  ];

  return (
    <div dir={tdir()} className="space-y-6">
      <LargeTitle title={tr("إعدادات المتجر")} subtitle={tr("تخصيص إعدادات المتجر والهوية البصرية وروابط التواصل")} />

      <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* ── Sidebar: profile + section index (System Settings) ── */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="apple-card flex items-center gap-3 rounded-[14px] p-4">
            <span
              aria-hidden
              className="grid size-14 shrink-0 place-items-center rounded-full bg-linear-to-b from-primary/70 to-primary text-[24px] font-semibold text-primary-foreground uppercase"
            >
              {store.name.trim().charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-semibold">{store.name}</p>
              <a href={storeUrl} target="_blank" rel="noreferrer" dir="ltr" className="flex items-center gap-1 truncate text-[13px] text-primary rtl:justify-end">
                <span className="truncate">{storeUrl.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="size-3 shrink-0" />
              </a>
            </div>
          </div>

          <nav aria-label={tr("أقسام الإعدادات")} className="hidden lg:block">
            <ul className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:52px]">
              {nav.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`#${item.id}`}
                    className="flex min-h-11 items-center gap-3 px-3 py-2 text-[15px] transition-colors hover:bg-(--fill-3)/60"
                  >
                    <IconTile icon={item.icon} tint={item.tint} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link href="/builder" className={`${appleButton.tinted} hidden w-full lg:flex`}>
            {tr("تخصيص شكل المتجر")}
          </Link>
        </aside>

        {/* ── Content ─────────────────────────────────────────── */}
        <div className="min-w-0 max-w-3xl space-y-8">
          <StoreSettingsForm store={store} />
          <OrderEmailSettings
            ownerEmail={store.user.email}
            initial={{
              emailNewOrders: store.settings?.emailNewOrders ?? true,
              emailCustomerOrders: store.settings?.emailCustomerOrders ?? true,
            }}
          />
          <LanguageSettings />
          <div>
            <StoreMembers
              members={members}
              pendingInvitations={pendingInvitations}
              branches={branchAccess?.branches}
              branchAccess={branchAccess?.members}
            />
          </div>
          <ActiveSessions sessions={sessions} />
          <DeleteAccount email={store.user.email} pendingSince={deletionRequest?.createdAt ?? null} />
        </div>
      </div>
    </div>
  );
}
