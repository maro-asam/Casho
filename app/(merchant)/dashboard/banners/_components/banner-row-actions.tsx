"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Eye, EyeOff, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
          <Button
            variant="ghost"
            size="icon"
            disabled={pending}
            aria-label={tr("إجراءات {0}", banner.title)}
            className="relative z-10 size-8 text-muted-foreground hover:text-foreground"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={editHref} scroll={false}>
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
        <AlertDialogContent dir={tdir()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("تمسح \"{0}\"؟", banner.title)}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("البانر هيتمسح نهائي من متجرك.")}
              {banner.isActive && tr(" لو عايز توقفه مؤقتًا، اخفيه بدل ما تمسحه.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{tr("رجوع")}</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={pending} className="gap-1.5">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {tr("حذف نهائي")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
