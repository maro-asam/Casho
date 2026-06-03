import { Metadata } from "next";
import { QrCode, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QrCodeGenerator from "./_components/QrCodeGenerator";

export const metadata: Metadata = {
  title: "QR Code المتجر",
  description: "أنشئ QR code لمتجرك بأشكال وألوان مختلفة",
};

export default async function QrCodePage() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { name: true, slug: true },
  });

  if (!store) {
    return (
      <div dir="rtl">
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex min-h-55 flex-col items-center justify-center gap-3 text-center">
            <Store className="size-12 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">لا يوجد متجر</h2>
              <p className="text-sm text-muted-foreground">
                يجب إنشاء متجر أولًا قبل توليد QR code.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const storeUrl = buildStoreUrl(store.slug);

  return (
    <div dir="rtl" className="space-y-6">
      <DashboardSectionHeader
        icon={QrCode}
        title="QR Code المتجر"
        description={
          <>
            اصنع QR code لمتجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>{" "}
            بتصميمك المفضل وحمّله بصيغة PNG أو SVG
          </>
        }
      />

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary font-semibold">
            تخصيص الـ QR Code
          </CardTitle>
          <CardDescription>
            اختار شكل النقاط والزوايا والألوان، ثم حمّل الملف جاهزًا للطباعة أو النشر.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QrCodeGenerator storeUrl={storeUrl} storeName={store.name} />
        </CardContent>
      </Card>
    </div>
  );
}
