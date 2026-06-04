"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Trash2,
  Crown,
  Copy,
  Check,
  ChevronDown,
  AlertTriangle,
  X,
  Mail,
} from "lucide-react";
import { StoreRole } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InviteMemberAction,
  RemoveMemberAction,
  UpdateMemberRoleAction,
  CancelInvitationAction,
  TransferOwnershipAction,
  type MemberDTO,
  type InvitationDTO,
} from "@/actions/store/members.actions";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/store/permissions";

type Props = {
  members: MemberDTO[];
  pendingInvitations: InvitationDTO[];
};

function RoleBadge({ role }: { role: StoreRole }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-full text-[10px] px-2 py-0 ${ROLE_COLORS[role]}`}
    >
      {ROLE_LABELS[role]}
    </Badge>
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
    <Button
      variant="ghost"
      size="icon"
      className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
      title="نسخ الرابط"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

export default function StoreMembers({ members: initialMembers, pendingInvitations: initialInvitations }: Props) {
  const [members, setMembers] = useState(initialMembers);
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
  const nonOwnerMembers = members.filter((m) => m.role !== "STORE_OWNER");

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
        toast.success("تم إنشاء رابط الدعوة");
        setInviteEmail("");
        setInviteRole("STORE_MANAGER");
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleRemove(memberId: string) {
    startTransition(async () => {
      const res = await RemoveMemberAction(memberId);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast.success(res.message);
      } else {
        toast.error(res.message);
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
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleCancelInvitation(invId: string) {
    startTransition(async () => {
      const res = await CancelInvitationAction(invId);
      if (res.success) {
        setInvitations((prev) => prev.filter((i) => i.id !== invId));
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleTransferConfirm() {
    if (!transferTargetId) return;
    startTransition(async () => {
      const res = await TransferOwnershipAction(transferTargetId);
      if (res.success) {
        toast.success(res.message);
        setTransferOpen(false);
        setTransferTargetId(null);
        setTransferConfirmText("");
        // Reload page to reflect new ownership
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">أعضاء المتجر</CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                أدِر الفريق الذي يعمل على متجرك
              </CardDescription>
            </div>
          </div>

          {/* Invite dialog trigger */}
          <Dialog
            open={inviteOpen}
            onOpenChange={(o) => {
              setInviteOpen(o);
              if (!o) setNewInviteUrl(null);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 rounded-xl text-xs">
                <UserPlus className="size-3.5" />
                دعوة عضو
              </Button>
            </DialogTrigger>

            <DialogContent dir="rtl" className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>دعوة عضو جديد</DialogTitle>
                <DialogDescription>
                  أرسل رابط دعوة للمستخدم عبر البريد الإلكتروني أو أي وسيلة أخرى.
                </DialogDescription>
              </DialogHeader>

              {newInviteUrl ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    تم إنشاء رابط الدعوة. شاركه مع العضو الجديد.
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                    <span className="flex-1 truncate font-mono text-xs text-foreground">
                      {newInviteUrl}
                    </span>
                    <CopyButton text={newInviteUrl} />
                  </div>
                  <Button
                    className="w-full rounded-xl"
                    onClick={() => {
                      setNewInviteUrl(null);
                      setInviteOpen(false);
                    }}
                  >
                    تم
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">البريد الإلكتروني</Label>
                    <Input
                      id="invite-email"
                      name="email"
                      type="email"
                      placeholder="example@email.com"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-role">الدور</Label>
                    <Select
                      name="role"
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as "STORE_MANAGER" | "STORE_STAFF")}
                    >
                      <SelectTrigger id="invite-role" className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STORE_MANAGER">
                          <div>
                            <p className="font-medium">مدير</p>
                            <p className="text-xs text-muted-foreground">
                              إدارة المنتجات والطلبات والعملاء
                            </p>
                          </div>
                        </SelectItem>
                        <SelectItem value="STORE_STAFF">
                          <div>
                            <p className="font-medium">موظف</p>
                            <p className="text-xs text-muted-foreground">
                              عرض وتحديث الطلبات فقط
                            </p>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button
                      type="submit"
                      className="w-full rounded-xl"
                      disabled={isPending}
                    >
                      {isPending ? "جاري الإنشاء..." : "إنشاء رابط الدعوة"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {/* Member list */}
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground text-sm font-semibold uppercase">
              {(member.name ?? member.email).charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium truncate">
                  {member.name ?? member.email}
                </span>
                <RoleBadge role={member.role} />
                {member.isCurrentUser && (
                  <Badge
                    variant="outline"
                    className="rounded-full text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 border-slate-200"
                  >
                    أنت
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{member.email}</p>
            </div>

            {/* Actions — only for non-owner, non-current members */}
            {member.role !== "STORE_OWNER" && !member.isCurrentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground"
                    disabled={isPending}
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      handleRoleChange(
                        member.id,
                        member.role === "STORE_MANAGER" ? "STORE_STAFF" : "STORE_MANAGER",
                      )
                    }
                  >
                    تغيير إلى{" "}
                    {member.role === "STORE_MANAGER" ? "موظف" : "مدير"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-amber-600"
                    onClick={() => {
                      setTransferTargetId(member.id);
                      setTransferOpen(true);
                    }}
                  >
                    <Crown className="size-3.5 me-2" />
                    نقل الملكية إليه
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-rose-600"
                    onClick={() => handleRemove(member.id)}
                  >
                    <Trash2 className="size-3.5 me-2" />
                    إزالة من المتجر
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            لا يوجد أعضاء بعد
          </p>
        )}

        {/* Pending invitations */}
        {invitations.length > 0 && (
          <>
            <p className="pt-2 text-xs font-medium text-muted-foreground">
              دعوات معلّقة ({invitations.length})
            </p>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/10 p-3"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
                  <Mail className="size-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{inv.email}</span>
                    <RoleBadge role={inv.role} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    تنتهي{" "}
                    {new Intl.DateTimeFormat("ar-EG", {
                      day: "numeric",
                      month: "short",
                    }).format(inv.expiresAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <CopyButton text={inv.acceptInvitationUrl} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => handleCancelInvitation(inv.id)}
                    disabled={isPending}
                    title="إلغاء الدعوة"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>

      {/* Transfer ownership dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent dir="rtl" className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="size-5" />
              نقل ملكية المتجر
            </DialogTitle>
            <DialogDescription>
              هذا إجراء لا يمكن التراجع عنه. سيصبح{" "}
              <strong>{transferTarget?.name ?? transferTarget?.email}</strong> المالك الجديد
              للمتجر، وستصبح أنت مديراً.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>
              اكتب <strong>نقل الملكية</strong> للتأكيد
            </Label>
            <Input
              className="rounded-xl"
              placeholder="نقل الملكية"
              value={transferConfirmText}
              onChange={(e) => setTransferConfirmText(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setTransferOpen(false);
                setTransferConfirmText("");
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={transferConfirmText !== "نقل الملكية" || isPending}
              onClick={handleTransferConfirm}
            >
              {isPending ? "جاري النقل..." : "تأكيد النقل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
