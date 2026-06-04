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
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetActiveSessionsAction } from "@/actions/auth/sessions.actions";
import { GetStoreMembersAction } from "@/actions/store/members.actions";

export const metadata: Metadata = {
  title: "إعدادات المتجر",
  description: "تخصيص إعدادات المتجر والهوية البصرية وروابط التواصل",
};

export default async function SettingsRoute() {
  const userId = await requireUserId();
  const [sessions, { members, pendingInvitations }] = await Promise.all([
    GetActiveSessionsAction(),
    GetStoreMembersAction(),
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
      <div dir="rtl" >
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex min-h-55 flex-col items-center justify-center gap-3 text-center">
            <Store className="size-12 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">لا يوجد متجر</h2>
              <p className="text-sm text-muted-foreground">
                يجب إنشاء متجر أولًا قبل تعديل الإعدادات.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      <DashboardSectionHeader
        icon={Settings2}
        title="إعدادات المتجر"
        description={
          <>
            خصص مظهر وروابط متجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
      />

      <div className="">
        <Card className="rounded-xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl text-primary font-semibold">
              إعدادات المتجر
            </CardTitle>
            <CardDescription>
              حدّث اسم المتجر وسعر الشحن وروابط التواصل الاجتماعي.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StoreSettingsForm store={store} />
          </CardContent>
        </Card>


      </div>

      {/* ── Store Members ── */}
      <div className="">
        <StoreMembers members={members} pendingInvitations={pendingInvitations} />
      </div>

      {/* ── Active Sessions ── */}
      <div className="">
        <ActiveSessions sessions={sessions} />
      </div>
    </div>
  );
}
