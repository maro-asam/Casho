"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteBannerAction } from "@/actions/admin/banner.actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DeleteBannerButton({
  bannerId,
  storeId,
  bannerTitle,
}: {
  bannerId: string;
  storeId: string;
  bannerTitle: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await DeleteBannerAction(bannerId, storeId);
        toast.success("تم حذف البانر بنجاح");
      } catch {
        toast.error("حدث خطأ أثناء حذف البانر");
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full  text-destructive hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
          disabled={isPending}
        >
          <Trash2 className="me-1.5 size-3.5" />
          {isPending ? "جاري الحذف..." : "حذف البانر"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent dir="rtl" size="default">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>حذف البانر؟</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من حذف بانر{" "}
            <span className="font-semibold text-foreground">
              «{bannerTitle}»
            </span>
            ؟ لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="">إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            variant="destructive"
            className=""
          >
            {isPending ? "جاري الحذف..." : "نعم، احذف"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
