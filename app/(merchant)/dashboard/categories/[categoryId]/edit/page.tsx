import { redirect } from "next/navigation";

// Editing happens in a dialog on the list page; keep old links working.
export default async function EditCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  redirect(`/categories?edit=${encodeURIComponent(categoryId)}`);
}
