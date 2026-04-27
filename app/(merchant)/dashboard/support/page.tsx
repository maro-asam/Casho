import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { Headset, Store } from "lucide-react";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";

import { Card, CardContent } from "@/components/ui/card";
import SupportForm from "./_components/support-form";

export default async function SupportPage() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!store) {
    return <NoStoreFound />;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Headset}
        title="مركز المساعدة"
        description={
          <>
            الدعم الفني الخاص بمتجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
      />

      <SupportForm />
    </div>
  );
}

function NoStoreFound() {
  return (
    <div className="p-6" dir="rtl">
      <Card className="rounded-2xl border-dashed shadow-sm">
        <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Store className="size-6 text-muted-foreground" />
          </div>

          <h2 className="text-xl font-semibold">لم يتم العثور على متجر</h2>

          <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
            يجب إنشاء متجر أولًا حتى تتمكن من الوصول إلى مركز المساعدة وإرسال
            طلبات الدعم الفني.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
