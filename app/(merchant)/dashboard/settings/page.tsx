import { Metadata } from "next";
import {
  ImageIcon,
  Megaphone,
  Palette,
  Settings2,
  Store,
  Phone,
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
import StoreSettingsForm from "../../_components/StoreSettingsForm";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

export const metadata: Metadata = {
  title: "إعدادات المتجر",
  description: "تخصيص إعدادات المتجر والهوية البصرية وروابط التواصل",
};

export default async function SettingsRoute() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      settings: true,
    },
  });

  if (!store) {
    return (
      <div dir="rtl" className="p-6">
        <Card className="rounded-md border-dashed">
          <CardContent className="flex min-h-55 flex-col items-center justify-center gap-3 text-center">
            <Store className="size-12 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-bold">لا يوجد متجر</h2>
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
    <div dir="rtl" className="space-y-6 p-6">
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
        <Card className="rounded-md shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl text-primary font-bold">
              تخصيص المتجر
            </CardTitle>
            <CardDescription>
              حدّث الشعار وصورة الغلاف والألوان وروابط التواصل بسهولة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StoreSettingsForm store={store} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-md shadow-sm bg-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Palette className="size-4" />
                الهوية البصرية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-primary">
              <p>اختر ألوان واضحة ومتناسقة مع البراند.</p>
              <p>الأفضل استخدام لون أساسي ولون ثانوي فقط.</p>
            </CardContent>
          </Card>

          <Card className="rounded-md shadow-sm bg-orange-600/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-orange-600">
                <ImageIcon className="size-4" />
                الصور
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm  text-orange-600">
              <p>ضع روابط صور واضحة وعالية الجودة.</p>
              <p>يفضل أن يكون اللوجو بخلفية شفافة إن أمكن.</p>
            </CardContent>
          </Card>

          <Card className="rounded-md shadow-sm text-green-600 bg-green-600/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="size-4" />
                الإعلان العلوي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm ">
              <p>استخدمه في التوصيل المجاني أو العروض أو كود الخصم.</p>
            </CardContent>
          </Card>

          <Card className="rounded-md shadow-sm text-red-600 bg-red-600/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="size-4" />
                التواصل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm ">
              <p>أضف واتساب وصفحات السوشيال لتسهيل الوصول للعميل.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
