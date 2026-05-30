"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { DeleteReviewAction } from "@/actions/products/reviews.actions";
import { toast } from "sonner";

export default function ReviewDeleteButton({
  reviewId,
  customerName,
}: {
  reviewId: string;
  customerName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await DeleteReviewAction(reviewId);
        toast.success("تم حذف المراجعة بنجاح");
      } catch {
        toast.error("حدث خطأ أثناء حذف المراجعة");
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
          حذف
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>حذف المراجعة</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من حذف مراجعة{" "}
            <span className="font-semibold text-foreground">
              &quot;{customerName}&quot;
            </span>
            ؟ لن تتمكن من التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? (
              <>
                <Loader2 className="me-1.5 size-3.5 animate-spin" />
                جارٍ الحذف...
              </>
            ) : (
              "حذف المراجعة"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
