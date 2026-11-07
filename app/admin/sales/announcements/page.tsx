import { Megaphone } from "lucide-react";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { Unavailable } from "@/components/saas-page";
import { AnnouncementCard } from "@/components/sales/announcement-card";
import { campaignDaysFromWindow } from "@/lib/sales/campaign";
import { listAllAnnouncements } from "@/lib/sales/campaign-queries";
import { AnnouncementDialog, DeleteAnnouncement } from "../_components/campaign-dialogs";

export default async function AdminSalesAnnouncementsPage() {
  await requireAdmin();
  const items = await listAllAnnouncements();
  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-muted-foreground">رسايل بتظهر في أول الصفحة الرئيسية عند كل المندوبين، بنفس الشكل اللي تحت.</p>
        <AnnouncementDialog />
      </div>

      {items.length === 0 ? (
        <div className="apple-card">
          <Unavailable icon={Megaphone} title="مفيش إعلانات" description="ابعت أول رسالة للفريق — عرض، تنبيه، أو معلومة." />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              now={now}
              actions={
                <>
                  <AnnouncementDialog
                    announcement={{
                      id: a.id,
                      title: a.title,
                      body: a.body,
                      tone: a.tone,
                      pinned: a.pinned,
                      expiresOn: a.expiresAt ? campaignDaysFromWindow({ startsAt: a.expiresAt, endsAt: a.expiresAt }).lastDay : "",
                    }}
                  />
                  <DeleteAnnouncement id={a.id} title={a.title} />
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
