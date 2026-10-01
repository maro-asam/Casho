import { redirect } from "next/navigation";

// Adding happens in a dialog on the list page; keep old links working.
export default function NewBannerPage() {
  redirect("/banners?new=1");
}
