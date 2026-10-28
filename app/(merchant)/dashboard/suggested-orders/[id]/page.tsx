import { redirect } from "next/navigation";

/** Suggested-order detail moved to /instagram/[id]. */
export default async function SuggestedOrderRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/instagram/${encodeURIComponent(id)}`);
}
