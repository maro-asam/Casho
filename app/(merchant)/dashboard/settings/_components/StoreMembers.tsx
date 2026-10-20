"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, Trash2, Crown, Copy, Check, Ellipsis, X, Mail, ArrowLeftRight, GitBranch } from "lucide-react";
import { StoreRole } from "@prisma/client";
import { appleButton, appleMenu } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { Group } from "./settings-ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InviteMemberAction,
  RemoveMemberAction,
  UpdateMemberRoleAction,
  CancelInvitationAction,
  TransferOwnershipAction,
  type MemberDTO,
  type InvitationDTO,
} from "@/actions/store/members.actions";
import { ROLE_LABELS } from "@/lib/store/permissions";
import { MemberBranchesDialog, type BranchOption, type MemberBranchAccess } from "./MemberBranchesDialog";
import { intlLocale, tdir, tr, trv } from "@/lib/i18n/dashboard";

type Props = {
  members: MemberDTO[];
  pendingInvitations: InvitationDTO[];
  /** Branch assignment — only shown for stores with more than one branch. */
  branches?: BranchOption[];
  branchAccess?: Record<string, MemberBranchAccess>;
};

const AVATAR_TINT: Record<StoreRole, string> = {
  STORE_OWNER: "from-[#ffb340] to-[#ff7a00]",
  STORE_MANAGER: "from-[#5ac8fa] to-[#007aff]",
  STORE_STAFF: "from-[#a1a1a6] to-[#6e6e73]",
};

function Avatar({ label, role }: { label: string; role: StoreRole }) {
  return (
    <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-b text-[17px] font-semibold text-white uppercase", AVATAR_TINT[role])}>
      {label.charAt(0)}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className={cn(appleButton.more, "size-8")} onClick={handleCopy} aria-label={tr("نسخ الرابط")} title={tr("نسخ الرابط")}>
      {copied ? <Check className="size-4 text-(--sys-green)" strokeWidth={2.6} /> : <Copy className="size-4" />}
    </button>
  );
}

export default function StoreMembers({
  members: initialMembers,
  pendingInvitations: initialInvitations,
  branches = [],
  branchAccess: initialBranchAccess = {},
}: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [branchAccess, setBranchAccess] = useState(initialBranchAccess);
  const [branchesMemberId, setBranchesMemberId] = useState<string | null>(null);
  const multiBranch = branches.length > 1;
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  const branchesMember = members.find((m) => m.id === branchesMemberId);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [isPending, startTransition] = useTransition();

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"STORE_MANAGER" | "STORE_STAFF">("STORE_MANAGER");
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);

  // Transfer ownership dialog
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [transferConfirmText, setTransferConfirmText] = useState("");

  const transferTarget = members.find((m) => m.id === transferTargetId);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);

    startTransition(async () => {
      const res = await InviteMemberAction(fd);
      if (res.success) {
        setNewInviteUrl(res.invitationUrl ?? null);
        if (res.invitationUrl) {
          setInvitations((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              email: inviteEmail,
              role: inviteRole as StoreRole,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              createdAt: new Date(),
              acceptInvitationUrl: res.invitationUrl!,
            },
          ]);
        }
        toast.success(tr("تم إنشاء رابط الدعوة"));
        setInviteEmail("");
        setInviteRole("STORE_MANAGER");
      } else {
        toast.error(trv(res.message));
      }
    });
  }

  function handleRemove(memberId: string) {
    startTransition(async () => {
      const res = await RemoveMemberAction(memberId);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast.success(trv(res.message));
      } else {
        toast.error(trv(res.message));
      }
    });
  }

  function handleRoleChange(memberId: string, newRole: StoreRole) {
    startTransition(async () => {
      const res = await UpdateMemberRoleAction(memberId, newRole);
      if (res.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
        );
        toast.success(trv(res.message));
      } else {
        toast.error(trv(res.message));
      }
    });
  }

  function handleCancelInvitation(invId: string) {
    startTransition(async () => {
      const res = await CancelInvitationAction(invId);
      if (res.success) {
        setInvitations((prev) => prev.filter((i) => i.id !== invId));
        toast.success(trv(res.message));
      } else {
        toast.error(trv(res.message));
      }
    });
  }

  function handleTransferConfirm() {
    if (!transferTargetId) return;
    startTransition(async () => {
      const res = await TransferOwnershipAction(transferTargetId);
      if (res.success) {
        toast.success(trv(res.message));
        setTransferOpen(false);
        setTransferTargetId(null);
        setTransferConfirmText("");
        // Reload page to reflect new ownership
        window.location.reload();
      } else {
        toast.error(trv(res.message));
      }
    });
  }

  return (
    <>
      <Group
        id="team"
        inset={68}
        title={tr("أعضاء المتجر")}
        footer={tr("أدِر الفريق الذي يعمل على متجرك")}
        action={
          <button type="button" onClick={() => setInviteOpen(true)} className={cn(appleButton.plain, "mx-0 h-8 text-[15px]")}>
            <UserPlus className="size-4" />
            {tr("دعوة عضو")}
          </button>
        }
      >
        {members.map((member) => {
          const display = member.name ?? member.email;
          const access = branchAccess[member.id];
          return (
            <div key={member.id} className="flex min-h-16 items-center gap-3 px-4 py-2.5">
              <Avatar label={display} role={member.role} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-[15px] font-medium">
                  <span className="truncate">{display}</span>
                  {member.isCurrentUser && <span className="shrink-0 text-[13px] font-normal text-muted-foreground">({tr("أنت")})</span>}
                </p>
                <p className="truncate text-[13px] text-muted-foreground">
                  {ROLE_LABELS[member.role]}
                  {member.name && ` · ${member.email}`}
                  {multiBranch && member.role !== "STORE_OWNER" && access && (
                    <>
                      {" · "}
                      {access.allBranches
                        ? tr("كل الفروع")
                        : access.branchIds.map((id) => branchName.get(id)).filter(Boolean).join(tr("، "))}
                    </>
                  )}
                </p>
              </div>

              {member.role === "STORE_OWNER" && <Crown className="size-[18px] shrink-0 text-(--sys-orange)" aria-label={ROLE_LABELS.STORE_OWNER} />}

              {/* Actions — only for non-owner, non-current members */}
              {member.role !== "STORE_OWNER" && !member.isCurrentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={appleButton.more} disabled={isPending} aria-label={tr("خيارات {0}", display)}>
                      <Ellipsis className="size-[18px]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={appleMenu}>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(member.id, member.role === "STORE_MANAGER" ? "STORE_STAFF" : "STORE_MANAGER")}
                    >
                      <ArrowLeftRight className="size-4" />
                      {tr("تغيير إلى")} {member.role === "STORE_MANAGER" ? tr("موظف") : tr("مدير")}
                    </DropdownMenuItem>
                    {multiBranch && (
                      <DropdownMenuItem onClick={() => setBranchesMemberId(member.id)}>
                        <GitBranch className="size-4" />
                        {tr("الفروع المسموحة")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setTransferTargetId(member.id);
                        setTransferOpen(true);
                      }}
                    >
                      <Crown className="size-4" />
                      {tr("نقل الملكية إليه")}
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => handleRemove(member.id)}>
                      <Trash2 className="size-4" />
                      {tr("إزالة من المتجر")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}

        {members.length === 0 && <p className="px-4 py-6 text-center text-[15px] text-muted-foreground">{tr("لا يوجد أعضاء بعد")}</p>}
      </Group>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Group title={tr("دعوات معلّقة ({0})", invitations.length)} inset={68} className="mt-6">
          {invitations.map((inv) => (
            <div key={inv.id} className="flex min-h-16 items-center gap-3 px-4 py-2.5">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-(--fill-3) text-muted-foreground">
                <Mail className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{inv.email}</p>
                <p className="text-[13px] text-muted-foreground">
                  {ROLE_LABELS[inv.role]} ·{" "}
                  {tr("تنتهي {0}", new Intl.DateTimeFormat(intlLocale(), { day: "numeric", month: "short" }).format(inv.expiresAt))}
                </p>
              </div>
              <CopyButton text={inv.acceptInvitationUrl} />
              <button
                type="button"
                className={cn(appleButton.more, "size-8 text-(--sys-red)")}
                onClick={() => handleCancelInvitation(inv.id)}
                disabled={isPending}
                aria-label={tr("إلغاء الدعوة")}
                title={tr("إلغاء الدعوة")}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </Group>
      )}

      {branchesMember && branchAccess[branchesMember.id] && (
        <MemberBranchesDialog
          key={branchesMember.id}
          open
          onOpenChange={(open) => !open && setBranchesMemberId(null)}
          memberId={branchesMember.id}
          memberName={branchesMember.name ?? branchesMember.email}
          branches={branches}
          access={branchAccess[branchesMember.id]}
          onSaved={(access) => setBranchAccess((prev) => ({ ...prev, [branchesMember.id]: access }))}
        />
      )}

      {/* Invite dialog */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(o) => {
          setInviteOpen(o);
          if (!o) setNewInviteUrl(null);
        }}
      >
        <DialogContent dir={tdir()} className="gap-0 p-0 sm:max-w-md">
          <DialogHeader className="items-center gap-1.5 px-6 pt-8 pb-5 text-center sm:text-center">
            <span className="mb-2 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
              {newInviteUrl ? <Check className="size-7" strokeWidth={3} /> : <UserPlus className="size-7" />}
            </span>
            <DialogTitle className="text-[22px] font-bold">{newInviteUrl ? tr("تم إنشاء رابط الدعوة") : tr("دعوة عضو جديد")}</DialogTitle>
            <DialogDescription className="text-[15px] leading-6">
              {newInviteUrl ? tr("تم إنشاء رابط الدعوة. شاركه مع العضو الجديد.") : tr("أرسل رابط دعوة للمستخدم عبر البريد الإلكتروني أو أي وسيلة أخرى.")}
            </DialogDescription>
          </DialogHeader>

          {newInviteUrl ? (
            <div className="space-y-3 px-5 pb-5">
              <div className="flex items-center gap-2 rounded-[12px] bg-(--fill-3) py-1.5 ps-3.5 pe-1.5">
                <span dir="ltr" className="flex-1 truncate font-mono text-[13px]">
                  {newInviteUrl}
                </span>
                <CopyButton text={newInviteUrl} />
              </div>
              <button
                type="button"
                className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}
                onClick={() => {
                  setNewInviteUrl(null);
                  setInviteOpen(false);
                }}
              >
                {tr("تم")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-5 px-5 pb-5">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email" className="px-1 text-[13px] font-normal text-muted-foreground">
                  {tr("البريد الإلكتروني")}
                </Label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  dir="ltr"
                  placeholder="example@email.com"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <fieldset className="space-y-1.5">
                <legend className="mb-1.5 px-1 text-[13px] text-muted-foreground">{tr("الدور")}</legend>
                <input type="hidden" name="role" value={inviteRole} />
                <div role="radiogroup" aria-label={tr("الدور")} className="apple-rows overflow-hidden rounded-[14px] bg-(--fill-3) [--row-inset:16px]">
                  {(
                    [
                      ["STORE_MANAGER", tr("مدير"), tr("إدارة المنتجات والطلبات والعملاء")],
                      ["STORE_STAFF", tr("موظف"), tr("عرض وتحديث الطلبات فقط")],
                    ] as const
                  ).map(([value, label, hint]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={inviteRole === value}
                      onClick={() => setInviteRole(value)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <span>
                        <span className="block text-[15px]">{label}</span>
                        <span className="block text-[13px] text-muted-foreground">{hint}</span>
                      </span>
                      {inviteRole === value && <Check className="size-5 shrink-0 text-primary" strokeWidth={2.6} />}
                    </button>
                  ))}
                </div>
              </fieldset>

              <DialogFooter>
                <button type="submit" className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")} disabled={isPending}>
                  {isPending ? tr("جاري الإنشاء...") : tr("إنشاء رابط الدعوة")}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer ownership dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent dir={tdir()} className="gap-0 p-0 sm:max-w-md">
          <DialogHeader className="items-center gap-1.5 px-6 pt-8 pb-5 text-center sm:text-center">
            <span className="mb-2 grid size-14 place-items-center rounded-full bg-(--sys-orange) text-white">
              <Crown className="size-7" />
            </span>
            <DialogTitle className="text-[22px] font-bold">{tr("نقل ملكية المتجر")}</DialogTitle>
            <DialogDescription className="text-[15px] leading-6">
              {tr("هذا إجراء لا يمكن التراجع عنه. سيصبح")} <strong className="text-foreground">{transferTarget?.name ?? transferTarget?.email}</strong>{" "}
              {tr("المالك الجديد للمتجر، وستصبح أنت مديراً.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 px-5 pb-5">
            <Label htmlFor="transfer-confirm" className="px-1 text-[13px] font-normal text-muted-foreground">
              {tr("اكتب")} <strong className="text-foreground">{tr("نقل الملكية")}</strong> {tr("للتأكيد")}
            </Label>
            <Input id="transfer-confirm" placeholder={tr("نقل الملكية")} value={transferConfirmText} onChange={(e) => setTransferConfirmText(e.target.value)} />
          </div>

          <DialogFooter className="flex-col gap-2 px-5 pb-5 sm:flex-col">
            <button
              type="button"
              className={cn(appleButton.destructiveFilled, "h-[50px] w-full text-[17px]")}
              disabled={transferConfirmText !== "نقل الملكية" || isPending}
              onClick={handleTransferConfirm}
            >
              {isPending ? tr("جاري النقل...") : tr("تأكيد النقل")}
            </button>
            <button
              type="button"
              className={cn(appleButton.plain, "mx-0 h-11 w-full")}
              onClick={() => {
                setTransferOpen(false);
                setTransferConfirmText("");
              }}
            >
              {tr("إلغاء")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
