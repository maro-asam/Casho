import { redirect } from "next/navigation";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

// Editing happens in a dialog on the list page; keep old links working.
export default async function EditCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  await loadDashboardLocale();
  const { categoryId } = await params;
  redirect(`/categories?edit=${encodeURIComponent(categoryId)}`);
}
