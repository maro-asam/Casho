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

      <div className="grid gap-6 lg:grid-cols-3">
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

        <div className="space-y-4">
          <Card className="rounded-xl shadow-sm text-red-600 bg-red-600/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="size-4" />
                التواصل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>أضف واتساب وصفحات السوشيال لتسهيل الوصول للعميل.</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm text-blue-600 bg-blue-600/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-4" />
                الشحن
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>سعر الشحن بيتضاف تلقائيًا على إجمالي كل طلب.</p>
              <p>ضعه صفر لو بتوفر شحن مجاني.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Store Members ── */}
      <div className="lg:max-w-2xl">
        <StoreMembers members={members} pendingInvitations={pendingInvitations} />
      </div>

      {/* ── Active Sessions ── */}
      <div className="lg:max-w-2xl">
        <ActiveSessions sessions={sessions} />
      </div>
    </div>
  );
}
