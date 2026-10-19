import { Metadata } from "next";
import {
  Settings2,
  Store,
  Phone,
  Truck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import StoreSettingsForm from "./_components/StoreSettingsForm";
import ActiveSessions from "./_components/ActiveSessions";
import StoreMembers from "./_components/StoreMembers";
import LanguageSettings from "./_components/LanguageSettings";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetActiveSessionsAction } from "@/actions/auth/sessions.actions";
import { GetStoreMembersAction } from "@/actions/store/members.actions";
import { GetMemberBranchAccessAction } from "@/actions/inventory/branches.actions";
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
  const [sessions, { members, pendingInvitations }, branchAccess] = await Promise.all([
    GetActiveSessionsAction(),
    GetStoreMembersAction(),
    GetMemberBranchAccessAction().catch(() => null),
  ]);

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      poweredByRemovalEnabled: true,
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
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!store) {
    return (
      <div dir={tdir()} >
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex min-h-55 flex-col items-center justify-center gap-3 text-center">
            <Store className="size-12 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">{tr("لا يوجد متجر")}</h2>
              <p className="text-sm text-muted-foreground">
                {tr("يجب إنشاء متجر أولًا قبل تعديل الإعدادات.")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir={tdir()} className="space-y-6">
      <DashboardSectionHeader
        icon={Settings2}
        title={tr("إعدادات المتجر")}
        description={
          <>
            {tr("خصص مظهر وروابط متجر")}{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
      />

      <div className="">
        <Card className="rounded-xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl text-primary font-semibold">
              {tr("إعدادات المتجر")}
            </CardTitle>
            <CardDescription>
              {tr("حدّث اسم المتجر وسعر الشحن وروابط التواصل الاجتماعي.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StoreSettingsForm store={store} />
          </CardContent>
        </Card>


      </div>

      {/* ── Dashboard language (per user) ── */}
      <LanguageSettings />

      {/* ── Store Members ── */}
      <div className="">
        <StoreMembers
          members={members}
          pendingInvitations={pendingInvitations}
          branches={branchAccess?.branches}
          branchAccess={branchAccess?.members}
        />
      </div>

      {/* ── Active Sessions ── */}
      <div className="">
        <ActiveSessions sessions={sessions} />
      </div>
    </div>
  );
}
