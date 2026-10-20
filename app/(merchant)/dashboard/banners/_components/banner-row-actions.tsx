"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Ellipsis, ExternalLink, Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteBannerAction, DuplicateBannerAction, SetBannerActiveAction } from "@/actions/admin/banner.actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appleButton, appleMenu } from "@/components/saas-page";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

type Props = {
  storeId: string;
  banner: { id: string; title: string; isActive: boolean };
  editHref: string;
  storefrontUrl: string;
};

export function BannerRowActions({ storeId, banner, editHref, storefrontUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggleActive() {
    startTransition(async () => {
      const result = await SetBannerActiveAction(banner.id, storeId, !banner.isActive);
      if (result.ok) {
        toast.success(banner.isActive ? tr("البانر اتخفى من المتجر") : tr("البانر بقى ظاهر في المتجر"));
        router.refresh();
      } else {
        toast.error(trv(result.message));
      }
    });
  }

  function duplicate() {
    startTransition(async () => {
      const result = await DuplicateBannerAction(banner.id, storeId);
      if (result.ok) {
        toast.success(tr("اتعملت نسخة مخفية — عدّلها واظهرها"));
        router.refresh();
      } else {
        toast.error(trv(result.message));
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await DeleteBannerAction(banner.id, storeId);
      if (result.ok) {
        setConfirmDelete(false);
        toast.success(tr("اتمسح \"{0}\"", banner.title));
        router.refresh();
      } else {
        toast.error(trv(result.message));
      }
    });
  }

  return (
    <>
      <DropdownMenu dir={tdir()} modal={false}>
        <DropdownMenuTrigger asChild>
          <button type="button" disabled={pending} aria-label={tr("إجراءات {0}", banner.title)} className={appleButton.more}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Ellipsis className="size-[18px]" strokeWidth={2.2} />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={appleMenu}>
          <DropdownMenuItem asChild>
            <Link href={editHref}>
              <Pencil />
              {tr("تعديل")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={duplicate}>
            <Copy />
            {tr("عمل نسخة")}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={storefrontUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
              {tr("عرض في المتجر")}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleActive}>
            {banner.isActive ? <EyeOff /> : <Eye />}
            {banner.isActive ? tr("إخفاء من المتجر") : tr("إظهار في المتجر")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
            <Trash2 />
            {tr("حذف")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={(open) => !pending && setConfirmDelete(open)}>
        <AlertDialogContent dir={tdir()} className="rounded-[22px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("تمسح \"{0}\"؟", banner.title)}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("البانر هيتمسح نهائي من متجرك.")}
              {banner.isActive && tr(" لو عايز توقفه مؤقتًا، اخفيه بدل ما تمسحه.")}
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
