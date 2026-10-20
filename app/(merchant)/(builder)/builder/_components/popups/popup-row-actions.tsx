"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpToLine, Copy, Ellipsis, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeletePopupAction, DuplicatePopupAction, ReorderPopupsAction, SetPopupActiveAction } from "@/actions/store/popups.actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { appleButton, appleMenu } from "@/components/saas-page";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

/** Inline on/off — optimistic, rolls back on failure. */
export function PopupActiveSwitch({ popupId, storeId, name, isActive }: { popupId: string; storeId: string; name: string; isActive: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(isActive);
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={checked}
      disabled={pending}
      aria-label={tr("تشغيل \"{0}\"", name)}
      className="relative z-10"
      onCheckedChange={(next) => {
        setChecked(next);
        startTransition(async () => {
          const result = await SetPopupActiveAction(popupId, storeId, next);
          if (!result.ok) {
            setChecked(!next);
            toast.error(trv(result.message));
            return;
          }
          toast.success(next ? tr("\"{0}\" شغّالة في المتجر", name) : tr("\"{0}\" اتوقفت", name));
          router.refresh();
        });
      }}
    />
  );
}

export function PopupRowActions({
  popupId,
  storeId,
  name,
  editHref,
  topOrder,
}: {
  popupId: string;
  storeId: string;
  name: string;
  editHref: string;
  /** All ids with this one first — null when it's already on top. */
  topOrder: string[] | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function duplicate() {
    startTransition(async () => {
      const result = await DuplicatePopupAction(popupId, storeId);
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      toast.success(tr("اتعملت نسخة (متوقفة)"));
      router.refresh();
    });
  }

  function moveToTop() {
    if (!topOrder) return;
    startTransition(async () => {
      const result = await ReorderPopupsAction(storeId, topOrder);
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      toast.success(tr("\"{0}\" بقت الأولوية", name));
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await DeletePopupAction(popupId, storeId);
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      setConfirm(false);
      toast.success(tr("اتمسحت \"{0}\"", name));
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu dir={tdir()} modal={false}>
        <DropdownMenuTrigger asChild>
          <button type="button" disabled={pending} aria-label={tr("إجراءات {0}", name)} className={appleButton.more}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Ellipsis className="size-[18px]" strokeWidth={2.2} />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={appleMenu}>
          <DropdownMenuItem asChild>
            <Link href={editHref} scroll={false}>
              <Pencil />
              {tr("تعديل")}
            </Link>
          </DropdownMenuItem>
          {topOrder && (
            <DropdownMenuItem onSelect={moveToTop}>
              <ArrowUpToLine />
              {tr("خليها الأولوية")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={duplicate}>
            <Copy />
            {tr("نسخة منها")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
            <Trash2 />
            {tr("حذف")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm} onOpenChange={(open) => !pending && setConfirm(open)}>
        <AlertDialogContent dir={tdir()} className="rounded-[22px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("تمسح \"{0}\"؟", name)}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("النافذة وإحصائياتها هيتمسحوا نهائي. الأرقام اللي اتجمعت منها هتفضل في عملائك.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="rounded-full">{tr("رجوع")}</AlertDialogCancel>
            <button type="button" onClick={remove} disabled={pending} className={appleButton.destructiveFilled}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {tr("حذف نهائي")}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
