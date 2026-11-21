import Link from "next/link";
import { SearchX } from "lucide-react";
import { Unavailable, appleButton } from "@/components/saas-page";

/** Missing, archived, or assigned to someone else — all look the same to a rep. */
export default function LeadNotFound() {
  return (
    <div className="apple-card">
      <Unavailable
        icon={SearchX}
        title="الليد ده مش متاح لك"
        description="ممكن يكون اتنقل لمندوب تاني أو اتأرشف. ليداتك كلها في القايمة."
        action={
          <Link href="/sales/leads" className={appleButton.tinted}>
            ليداتي
          </Link>
        }
      />
    </div>
  );
}
