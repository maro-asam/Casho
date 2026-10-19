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
import { Button } from "@/components/ui/button";
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
          <Button
            variant="ghost"
            size="icon"
            disabled={pending}
            aria-label={tr("إجراءات مراجعة {0}", customerName)}
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
        <AlertDialogContent dir={tdir()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("تمسح مراجعة {0}؟", customerName)}</AlertDialogTitle>
            <AlertDialogDescription>{tr("المراجعة هتختفي من صفحة المنتج نهائي، ومتوسط التقييم هيتحسب من غيرها.")}</AlertDialogDescription>
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
