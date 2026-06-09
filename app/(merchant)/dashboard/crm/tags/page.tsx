import { Metadata } from "next";
import { Tag } from "lucide-react";

import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetTagsAction } from "@/actions/crm/customer-tags.actions";
import { TagsClient } from "./_components/TagsClient";

export const metadata: Metadata = { title: "علامات العملاء — CRM" };

export default async function TagsPage() {
  const tags = await GetTagsAction();

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Tag}
        title="علامات العملاء"
        description="أنشئ علامات مخصصة لتصنيف عملائك بسهولة"
        badge={tags.length}
      />
      <TagsClient tags={tags} />
    </div>
  );
}
