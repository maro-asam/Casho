import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { notFound, redirect } from "next/navigation";
import SEOSettingsForm from "./_components/SEOSettingsForm";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { Rocket } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "إعدادات SEO",
  description: "إدارة إعدادات ال SEO الخاصة بمتجرك",
};

const SEOSettingsRoute = async () => {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      settings: {
        select: {
          seoTitle: true,
          seoDescription: true,
          seoKeywords: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true,
          isIndexed: true,
        },
      },
    },
  });

  if (!store) {
    return notFound();
  }

  if (!store.slug) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        title="اعدادات ال SEO"
        description="بيانات ال SEO بتساعد متجرك يظهر بشكل أفضل في جوجل ولما الناس تشارك منتجاتك على السوشيال ميديا."
        icon={Rocket}
      />

      <SEOSettingsForm
        storeId={store.id}
        storeName={store.name}
        storeSlug={store.slug}
        defaultValues={{
          seoTitle: store.settings?.seoTitle ?? "",
          seoDescription: store.settings?.seoDescription ?? "",
          seoKeywords: store.settings?.seoKeywords?.join(", ") ?? "",
          ogTitle: store.settings?.ogTitle ?? "",
          ogDescription: store.settings?.ogDescription ?? "",
          ogImage: store.settings?.ogImage ?? "",
          isIndexed: store.settings?.isIndexed ?? true,
        }}
      />
    </div>
  );
};

export default SEOSettingsRoute;
