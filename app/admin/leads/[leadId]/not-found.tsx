import Link from "next/link";
import { SearchX } from "lucide-react";
import { Unavailable, appleButton } from "@/components/saas-page";

export default function LeadNotFound() {
  return (
    <div className="apple-card">
      <Unavailable
        icon={SearchX}
        title="الليد ده مش موجود"
        action={
          <Link href="/admin/leads/list" className={appleButton.tinted}>
            كل الليدز
          </Link>
        }
      />
    </div>
  );
}
