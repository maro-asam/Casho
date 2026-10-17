import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, LogOut, MailCheck, Monitor } from "lucide-react";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { markUserEmailVerifiedAction, revokeUserSessionsAction, setUserRoleAction } from "@/actions/admin/admin-users.actions";
import { StatusPill } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { ActionButton } from "../../_components/action-button";
import { BackLink, Fields, Panel, PanelEmpty, th, theadRow } from "../../_components/admin-ui";
import { StatusMenu } from "../../_components/status-menu";
import { DangerDelete } from "../../_components/danger-delete";
import { adminDeleteUserAction } from "@/actions/admin/admin-delete.actions";
import { getUserDeletionCheck } from "@/lib/admin/deletion";
import { ROLE_META, SUBSCRIPTION_META, deviceLabel, fmtDate, fmtDateTime, fmtMoney, fmtRelative, securityEventMeta } from "../../_lib/format";

type PageProps = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  return { title: user ? (user.name ?? user.email) : "مستخدم" };
}

const ROLE_OPTIONS = ([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN] as const).map((value) => ({ value, ...ROLE_META[value] }));

export default async function AdminUserPage({ params }: PageProps) {
  const { userId } = await params;
  const viewer = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone_number: true,
      role: true,
      emailVerified: true,
      googleId: true,
      password: true,
      country: true,
      businessType: true,
      referralCode: true,
      createdAt: true,
      referredBy: { select: { id: true, name: true, email: true } },
      salesRep: { select: { id: true } },
      salesAttribution: { select: { salesRep: { select: { id: true, user: { select: { name: true, email: true } } } } } },
      stores: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, slug: true, subscriptionStatus: true, balance: true, createdAt: true, plan: { select: { name: true } } },
      },
      storeMembers: { select: { role: true, store: { select: { name: true, slug: true } } } },
      sessions: { orderBy: { lastUsedAt: "desc" }, select: { id: true, userAgent: true, ipAddress: true, lastUsedAt: true, createdAt: true, expiresAt: true } },
      securityLogs: { orderBy: { createdAt: "desc" }, take: 15, select: { id: true, event: true, ipAddress: true, createdAt: true } },
    },
  });

  if (!user) notFound();

  const deletion = await getUserDeletionCheck(user.id, viewer.id);

  const now = new Date();
  const activeSessions = user.sessions.filter((s) => s.expiresAt > now);
  const isSelf = viewer.id === user.id;
  const canEditRole = viewer.role === UserRole.SUPER_ADMIN && !isSelf && user.role !== UserRole.SALES;
  const signIn = [user.password && "كلمة مرور", user.googleId && "Google"].filter(Boolean).join(" + ") || "—";
  // Stores they work in as a team member (not owner).
  const memberships = user.storeMembers.filter((m) => !user.stores.some((s) => s.slug === m.store.slug));

  return (
    <div className="space-y-6">
      <BackLink href="/admin/users">كل المستخدمين</BackLink>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{user.name ?? "بدون اسم"}</h1>
            {isSelf && <StatusPill tone="info">ده حسابك</StatusPill>}
          </div>
          <p className="text-sm text-muted-foreground">
            <span dir="ltr">{user.email}</span> · سجّل {fmtDate(user.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEditRole ? (
            <StatusMenu value={user.role} options={ROLE_OPTIONS} action={setUserRoleAction.bind(null, user.id)} label="تغيير الصلاحية" />
          ) : (
            <StatusPill tone={ROLE_META[user.role].tone}>{ROLE_META[user.role].label}</StatusPill>
          )}
          {!isSelf && (
            <ActionButton
              action={revokeUserSessionsAction.bind(null, user.id)}
              variant="destructive"
              disabled={activeSessions.length === 0}
              confirm={{
                title: "تسجيل خروج من كل الأجهزة؟",
                description: `هيتقفل ${activeSessions.length} جلسة مفتوحة، والمستخدم هيحتاج يسجّل دخول تاني. استخدمها لو الحساب ممكن يكون اتسرق.`,
                confirmLabel: "اقفل الجلسات",
                destructive: true,
              }}
            >
              <LogOut className="size-3.5" />
              اقفل كل الجلسات
            </ActionButton>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="المتاجر" description="المتاجر اللي الحساب ده مالكها." flush>
            {user.stores.length === 0 ? (
              <PanelEmpty>الحساب ده معندوش متجر.</PanelEmpty>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className={theadRow}>
                    <th className={cn(th, "ps-4")}>المتجر</th>
                    <th className={th}>الاشتراك</th>
                    <th className={cn(th, "hidden sm:table-cell")}>الباقة</th>
                    <th className={cn(th, "pe-4 text-left")}>الرصيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.stores.map((s) => (
                    <tr key={s.id} className="relative transition-colors hover:bg-muted/40">
                      <td className="py-3 ps-4">
                        <Link href={`/admin/stores/${s.slug}`} className="font-medium after:absolute after:inset-0">
                          {s.name}
                        </Link>
                        <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                          {s.slug}
                        </p>
                      </td>
                      <td className="py-3">
                        <StatusPill tone={SUBSCRIPTION_META[s.subscriptionStatus].tone}>{SUBSCRIPTION_META[s.subscriptionStatus].label}</StatusPill>
                      </td>
                      <td className="hidden py-3 sm:table-cell">{s.plan?.name ?? "—"}</td>
                      <td className="py-3 pe-4 text-left tabular-nums">{fmtMoney(s.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {memberships.length > 0 && (
              <div className="border-t border-border px-4 py-3 text-sm">
                <p className="mb-1 text-xs text-muted-foreground">عضو في فريق:</p>
                <div className="flex flex-wrap gap-2">
                  {memberships.map((m) => (
                    <Link key={m.store.slug} href={`/admin/stores/${m.store.slug}`} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">
                      {m.store.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="الجلسات المفتوحة" description="الأجهزة اللي مسجّلة دخول دلوقتي." flush>
            {activeSessions.length === 0 ? (
              <PanelEmpty>مفيش جلسات مفتوحة.</PanelEmpty>
            ) : (
              <ul className="divide-y divide-border">
                {activeSessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <Monitor className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{deviceLabel(s.userAgent)}</p>
                      <p className="text-xs text-muted-foreground">
                        <span dir="ltr">{s.ipAddress ?? "IP غير معروف"}</span> · بدأت {fmtDate(s.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{fmtRelative(s.lastUsedAt, now)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="سجل الأمان"
            flush
            actions={
              <Link href={`/admin/security?q=${encodeURIComponent(user.email)}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                السجل كامل <ArrowUpRight className="size-3" />
              </Link>
            }
          >
            {user.securityLogs.length === 0 ? (
              <PanelEmpty>مفيش أحداث مسجّلة.</PanelEmpty>
            ) : (
              <ul className="divide-y divide-border">
                {user.securityLogs.map((log) => {
                  const meta = securityEventMeta(log.event);
                  return (
                    <li key={log.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                      <span className="text-xs text-muted-foreground">
                        <span dir="ltr">{log.ipAddress ?? ""}</span> {log.ipAddress && "·"} {fmtDateTime(log.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="بيانات الحساب">
            <Fields
              rows={[
                { label: "البريد", value: user.email, ltr: true },
                {
                  label: "البريد متأكد",
                  value: user.emailVerified ? (
                    "أيوه"
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      لأ
                      <ActionButton action={markUserEmailVerifiedAction.bind(null, user.id)} size="xs" variant="ghost" className="h-6 px-1.5 text-xs">
                        <MailCheck className="size-3" />
                        أكّده
                      </ActionButton>
                    </span>
                  ),
                },
                { label: "الموبايل", value: user.phone_number ?? "—", ltr: !!user.phone_number },
                { label: "طريقة الدخول", value: signIn },
                { label: "الدولة", value: user.country ?? "—" },
                { label: "نوع النشاط", value: user.businessType ?? "—" },
                { label: "كود الإحالة", value: user.referralCode ?? "—", ltr: !!user.referralCode },
              ]}
            />
          </Panel>

          <Panel title="مصدر التسجيل">
            <Fields
              rows={[
                {
                  label: "مندوب المبيعات",
                  value: user.salesAttribution ? (
                    <Link href={`/admin/sales/reps/${user.salesAttribution.salesRep.id}`} className="text-primary hover:underline">
                      {user.salesAttribution.salesRep.user.name ?? user.salesAttribution.salesRep.user.email}
                    </Link>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "دعوة من تاجر",
                  value: user.referredBy ? (
                    <Link href={`/admin/users/${user.referredBy.id}`} className="text-primary hover:underline">
                      {user.referredBy.name ?? user.referredBy.email}
                    </Link>
                  ) : (
                    "—"
                  ),
                },
              ]}
            />
            {user.salesRep && (
              <Link href={`/admin/sales/reps/${user.salesRep.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                ملف المندوب <ArrowUpRight className="size-3" />
              </Link>
            )}
          </Panel>

          <DangerDelete
            noun="الحساب"
            confirmValue={user.email}
            confirmLabel="البريد"
            blockers={deletion.blockers}
            alternative="بدل الحذف: اقفل كل الجلسات، وألغِ اشتراك متاجره من صفحة المتجر."
            consequences={[
              "الحساب وجلساته وإشعاراته",
              deletion.stores.length
                ? `متاجره (${deletion.stores.map((s) => s.name).join("، ")}) بكل بياناتها`
                : "مفيش متاجر مملوكة للحساب",
              "عضويته في فرق المتاجر التانية",
            ]}
            action={adminDeleteUserAction.bind(null, user.id)}
            redirectTo="/admin/users"
          />

          {user.role === UserRole.SALES && (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs leading-5 text-muted-foreground">
              صلاحية المندوب وإيقافه بيتداروا من صفحة فريق المبيعات.
            </p>
          )}
          {viewer.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.SALES && (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs leading-5 text-muted-foreground">تغيير الصلاحيات متاح للسوبر أدمن بس.</p>
          )}
        </div>
      </div>
    </div>
  );
}
