import { Metadata } from "next";
import { Tag } from "lucide-react";

import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetTagsAction } from "@/actions/crm/customer-tags.actions";
import { TagsClient } from "./_components/TagsClient";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("علامات العملاء — CRM") };
}

export default async function TagsPage() {
  await loadDashboardLocale();
  const tags = await GetTagsAction();

  return (
    <div className="space-y-6" dir={tdir()}>
      <DashboardSectionHeader
        icon={Tag}
        title={tr("علامات العملاء")}
        description={tr("أنشئ علامات مخصصة لتصنيف عملائك بسهولة")}
        badge={tags.length}
      />
      <TagsClient tags={tags} />
    </div>
  );
}
