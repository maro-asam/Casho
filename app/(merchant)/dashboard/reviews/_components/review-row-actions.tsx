"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteReviewAction } from "@/actions/products/reviews.actions";
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
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

type Props = { reviewId: string; customerName: string; editHref: string; productUrl: string };

export function ReviewRowActions({ reviewId, customerName, editHref, productUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function remove() {
    startTransition(async () => {
      const result = await DeleteReviewAction(reviewId);
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      setConfirm(false);
      toast.success(tr("اتمسحت المراجعة"));
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu dir={tdir()} modal={false}>
        <DropdownMenuTrigger asChild>
          <button type="button" disabled={pending} aria-label={tr("إجراءات مراجعة {0}", customerName)} className={cn(appleButton.more, "size-8 bg-card")}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={appleMenu}>
          <DropdownMenuItem asChild>
            <Link href={editHref} scroll={false}>
              <Pencil />
              {tr("تعديل")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={productUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
              {tr("شوفها في المتجر")}
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
            <Trash2 />
            {tr("حذف")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm} onOpenChange={(open) => !pending && setConfirm(open)}>
        <AlertDialogContent dir={tdir()} className="max-w-[20rem] gap-0 p-0 text-center">
          <AlertDialogHeader className="items-center gap-1 px-5 pt-6 pb-5 text-center sm:text-center">
            <AlertDialogTitle className="text-[17px] font-semibold">{tr("تمسح مراجعة {0}؟", customerName)}</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-[18px]">
              {tr("المراجعة هتختفي من صفحة المنتج نهائي، ومتوسط التقييم هيتحسب من غيرها.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-0 border-t border-border/60 sm:space-x-0">
            <AlertDialogCancel
              disabled={pending}
              className="m-0 h-11 rounded-none border-0 bg-transparent text-[17px] text-primary shadow-none hover:bg-(--fill-3)/60"
            >
              {tr("رجوع")}
            </AlertDialogCancel>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex h-11 items-center justify-center gap-1.5 border-s border-border/60 text-[17px] font-semibold text-(--sys-red) hover:bg-(--fill-3)/60 disabled:opacity-50"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {tr("حذف نهائي")}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
