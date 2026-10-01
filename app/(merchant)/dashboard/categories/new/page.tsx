import { redirect } from "next/navigation";

// Adding happens in a dialog on the list page; keep old links working.
export default function NewCategoryPage() {
  redirect("/categories?new=1");
}
