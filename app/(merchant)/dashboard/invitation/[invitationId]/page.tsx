import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Crown, Users } from "lucide-react";
import { getCurrentSession } from "@/lib/auth/session";
import { GetInvitationDetailsAction } from "@/actions/store/members.actions";
import { ROLE_LABELS } from "@/lib/store/permissions";
import AcceptInvitationClient from "./_components/AcceptInvitationClient";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("دعوة للانضمام إلى متجر") };
}

type Props = { params: Promise<{ invitationId: string }> };

export default async function InvitationPage({ params }: Props) {
  await loadDashboardLocale();
  const { invitationId } = await params;
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect(`/login?redirect=/dashboard/invitation/${invitationId}`);
  }

  const invitation = await GetInvitationDetailsAction(invitationId);

  if (!invitation) {
    return (
      <div dir={tdir()} className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-destructive/10">
            <XCircle className="size-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">{tr("الدعوة غير صالحة")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr("ربما انتهت صلاحية هذه الدعوة أو تم استخدامها مسبقًا.")}
          </p>
        </div>
      </div>
    );
  }

  const emailMismatch =
    invitation.email.toLowerCase() !== session.user.email.toLowerCase();

  if (emailMismatch) {
    return (
      <div dir={tdir()} className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-amber-100">
            <XCircle className="size-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold">{tr("بريد إلكتروني مختلف")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr("هذه الدعوة موجهة إلى")}{" "}
            <strong className="text-foreground">{invitation.email}</strong>{tr("، بينما أنت مسجّل دخولك بـ")}{" "}
            <strong className="text-foreground">{session.user.email}</strong>.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("سجّل دخولك بالحساب المناسب لقبول الدعوة.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir={tdir()} className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-primary/10">
          <Users className="size-8 text-primary" />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">{tr("دعوة للانضمام إلى متجر")}</h1>
          <p className="text-sm text-muted-foreground">
            {tr("دعاك")}{" "}<strong className="text-foreground">{invitation.invitedByName}</strong>{" "}{tr("للانضمام إلى متجر")}
          </p>
        </div>

        <div className="my-6 rounded-xl border bg-muted/30 p-4 text-center">
          <p className="text-lg font-semibold">{invitation.storeName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("دورك:")}{" "}
            <span className="font-medium text-foreground">
              {ROLE_LABELS[invitation.role]}
            </span>
          </p>
        </div>

        <AcceptInvitationClient invitationId={invitationId} />
      </div>
    </div>
  );
}
