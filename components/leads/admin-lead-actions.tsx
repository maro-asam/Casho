"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadPriority } from "@prisma/client";
import { Archive, ArchiveRestore, Flag, Link2, Loader2, MoreHorizontal, Pencil, RotateCcw, Search, Trash2, Unlink, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appleButton, appleMenu } from "@/components/saas-page";
import {
  archiveLeadAction,
  assignLeadsAction,
  changeLeadPriorityAction,
  deleteLeadAction,
  findLeadAccountsAction,
  linkLeadAccountAction,
  resolveLeadMatchAction,
  restoreLeadAction,
  undeleteLeadAction,
  unlinkLeadAccountAction,
} from "@/actions/leads/admin-leads.actions";
import type { AccountHit } from "@/lib/leads/conversion";
import { PRIORITIES, PRIORITY_META } from "@/lib/leads/constants";
import { cn } from "@/lib/utils";
import { Field, SubmitRow, formValues, useLeadAction } from "./form-kit";

export type RepOption = { id: string; label: string; active: boolean };

const NONE = "__none";

/** Assign / reassign / unassign one or many leads. */
export function AssignLeadsDialog({
  leadIds,
  reps,
  currentRepId,
  trigger = "button",
  open: controlledOpen,
  onOpenChange,
  onDone,
}: {
  leadIds: string[];
  reps: RepOption[];
  currentRepId?: string | null;
  trigger?: "button" | "none";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDone?: () => void;
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const [rep, setRep] = useState<string>(currentRepId ?? "");
  const { submit, pending, errors } = useLeadAction(assignLeadsAction, () => {
    setOpen(false);
    onDone?.();
  });
  const active = reps.filter((r) => r.active);
  const many = leadIds.length > 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger === "button" && (
        <DialogTrigger asChild>
          <button type="button" className={cn(appleButton.tinted, "text-primary")}>
            <UserPlus className="size-4" />
            {currentRepId ? "انقل لمندوب تاني" : "اسند لمندوب"}
          </button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{many ? `إسناد ${leadIds.length} ليد` : currentRepId ? "نقل الليد" : "إسناد الليد"}</DialogTitle>
          <DialogDescription>
            المندوب بيشوف الليدز المسندة له بس، ويوصله تنبيه. المتابعات المفتوحة بتنتقل معاه. الإسناد مش بيغيّر نسبة العميل في العمولات — دي بتمشي برابط الإحالة.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => submit({ ...formValues(e), leadIds, salesRepId: rep === NONE ? "" : rep })}>
          <Field label="المندوب" name="salesRepId" error={errors.salesRepId}>
            <Select value={rep} onValueChange={setRep} dir="rtl">
              <SelectTrigger id="salesRepId" className="h-11 w-full rounded-[10px]">
                <SelectValue placeholder="اختار مندوب" />
              </SelectTrigger>
              <SelectContent>
                {active.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
                <SelectItem value={NONE}>شيله من المندوب (مش متسند)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="السبب (اختياري — بيتسجل في التاريخ)" name="reason" error={errors.reason}>
            <Input id="reason" name="reason" maxLength={300} />
          </Field>
          <SubmitRow pending={pending || !rep} label={rep === NONE ? "شيله" : "اسند"} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  destructive,
  run,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  label: string;
  destructive?: boolean;
  run: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(reason);
          }}
        >
          <Field label="السبب (اختياري)" name="reason">
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
          </Field>
          <SubmitRow pending={false} label={label} destructive={destructive} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** ⋯ menu on the lead page: edit, priority, archive, delete. */
export function LeadAdminMenu({
  lead,
}: {
  lead: { id: string; priority: LeadPriority; priorityLocked: boolean; archivedAt: Date | null; deletedAt: Date | null; convertedAt: Date | null; customerUserId: string | null };
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"archive" | "delete" | "unlink" | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: (input: unknown) => Promise<{ success: boolean; message: string }>, input: Record<string, unknown>, after?: () => void) {
    startTransition(async () => {
      try {
        const res = await action(input);
        if (!res.success) toast.error(res.message);
        else {
          toast.success(res.message);
          setDialog(null);
          after?.();
          router.refresh();
        }
      } catch {
        toast.error("حصلت مشكلة — جرّب تاني");
      }
    });
  }

  return (
    <>
      <DropdownMenu dir="rtl" modal={false}>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="خيارات الليد" disabled={pending} className={appleButton.more}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={appleMenu}>
          {!lead.deletedAt && (
            <DropdownMenuItem asChild>
              <Link href={`/admin/leads/${lead.id}/edit`}>
                <Pencil />
                تعديل البيانات
              </Link>
            </DropdownMenuItem>
          )}
          {!lead.deletedAt && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Flag />
                الأولوية
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className={appleMenu}>
                <DropdownMenuItem onSelect={() => run(changeLeadPriorityAction, { leadId: lead.id, priority: "AUTO" })}>
                  تلقائي (حسب التقييم){!lead.priorityLocked && " ✓"}
                </DropdownMenuItem>
                {PRIORITIES.map((p) => (
                  <DropdownMenuItem key={p} onSelect={() => run(changeLeadPriorityAction, { leadId: lead.id, priority: p })}>
                    {PRIORITY_META[p].label}
                    {lead.priorityLocked && lead.priority === p && " ✓"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {lead.customerUserId && (
            <DropdownMenuItem onSelect={() => setDialog("unlink")}>
              <Unlink />
              فك الربط بحساب كاشو
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {!lead.deletedAt &&
            (lead.archivedAt ? (
              <DropdownMenuItem onSelect={() => run(restoreLeadAction, { leadId: lead.id })}>
                <ArchiveRestore />
                رجّعه من الأرشيف
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setDialog("archive")}>
                <Archive />
                أرشفة
              </DropdownMenuItem>
            ))}
          {lead.deletedAt ? (
            <DropdownMenuItem onSelect={() => run(undeleteLeadAction, { leadId: lead.id })}>
              <RotateCcw />
              رجّع الليد
            </DropdownMenuItem>
          ) : (
            !lead.convertedAt && (
              <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
                <Trash2 />
                امسح الليد
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReasonDialog
        open={dialog === "archive"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="أرشفة الليد؟"
        description="هيختفي من عند المندوب ومن القوائم، وتاريخه كله بيفضل. تقدر ترجعه في أي وقت."
        label="أرشف"
        run={(reason) => run(archiveLeadAction, { leadId: lead.id, reason })}
      />
      <ReasonDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="تمسح الليد ده؟"
        description="ده مسح ناعم: الليد بيختفي من كل مكان ومن التقارير، ومتابعاته بتتلغي — بس بيفضل في «المحذوفة» وتقدر ترجعه. استخدمه للبيانات الغلط أو المكررة."
        label="امسح"
        destructive
        run={(reason) => run(deleteLeadAction, { leadId: lead.id, reason }, () => router.push("/admin/leads/list"))}
      />
      <ReasonDialog
        open={dialog === "unlink"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="فك الربط بحساب كاشو؟"
        description="لو الليد كان متحسوب تحويل، التحويل بيتلغي والحالة بترجع زي ما كانت. العمولات مش بتتأثر — دي ماشية برابط الإحالة."
        label="فك الربط"
        destructive
        run={(reason) => run(unlinkLeadAccountAction, { leadId: lead.id, reason })}
      />
    </>
  );
}

/** Find a merchant account and link the lead to it. */
export function LinkAccountDialog({ leadId, suggestions = [] }: { leadId: string; suggestions?: AccountHit[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AccountHit[]>(suggestions);
  const [message, setMessage] = useState("");
  const [searching, startSearch] = useTransition();
  const link = useLeadAction(linkLeadAccountAction, () => setOpen(false));

  function search(e: React.FormEvent) {
    e.preventDefault();
    startSearch(async () => {
      const res = await findLeadAccountsAction({ query });
      setHits(res.accounts);
      setMessage(res.message);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={cn(appleButton.tinted, "text-primary")}>
          <Link2 className="size-4" />
          اربطه بحساب كاشو
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ربط الليد بحساب تاجر</DialogTitle>
          <DialogDescription>
            مفيش حساب أو متجر جديد بيتعمل — الليد بيترابط بالحساب الموجود. لو الحساب دفع اشتراك، بيتحسب تحويل بتاريخ أول دفع؛ لو لسه، بيتحسب أول ما يدفع.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={search} className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="الإيميل أو الموبايل أو اسم المتجر" className="h-11 flex-1" autoFocus />
          <button type="submit" disabled={searching || query.trim().length < 3} className={cn(appleButton.filled, "h-11 px-4")}>
            {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            ابحث
          </button>
        </form>
        {message && <p className="text-[13px] text-muted-foreground">{message}</p>}
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {hits.map((u) => (
            <li key={u.id} className="flex items-center gap-3 rounded-[12px] bg-(--fill-3) px-3.5 py-3">
              <div className="min-w-0 flex-1 text-[14px]">
                <p className="truncate font-semibold">{u.stores[0]?.name ?? u.name ?? u.email}</p>
                <p dir="ltr" className="truncate text-end text-[12px] text-muted-foreground">
                  {u.email}
                  {u.phone ? ` · ${u.phone}` : ""}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {u.paidAt ? `دافع اشتراك من ${new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(u.paidAt)}` : "لسه مدفعش اشتراك"}
                  {u.linkedLead && ` · مربوط بليد «${u.linkedLead.businessName}»`}
                </p>
              </div>
              <button
                type="button"
                disabled={link.pending || !!u.linkedLead}
                onClick={() => link.submit({ leadId, userId: u.id })}
                className={cn(appleButton.tinted, "text-primary")}
              >
                {link.pending ? <Loader2 className="size-4 animate-spin" /> : "اربط"}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function MatchActions({ matchId }: { matchId: string }) {
  const act = useLeadAction(resolveLeadMatchAction);
  return (
    <div className="flex shrink-0 gap-2">
      <button type="button" disabled={act.pending} onClick={() => act.submit({ matchId, decision: "link" })} className={cn(appleButton.tinted, "text-primary")}>
        اربط
      </button>
      <button type="button" disabled={act.pending} onClick={() => act.submit({ matchId, decision: "dismiss" })} className={appleButton.tinted}>
        مش هو
      </button>
    </div>
  );
}
