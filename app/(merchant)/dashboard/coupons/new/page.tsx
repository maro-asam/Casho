import { redirect } from "next/navigation";

// Creating happens in a dialog on the list page; keep old links working.
export default function NewCouponPage() {
  redirect("/coupons?new=1");
}
