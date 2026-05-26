"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { DeleteCategoryAction } from "@/actions/admin/categories.actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DeleteCategoryButton({
  categoryId,
  storeId,
  categoryName,
  productCount,
}: {
  categoryId: string;
  storeId: string;
  categoryName: string;
  productCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await DeleteCategoryAction(categoryId, storeId);
      if (result?.success) {
        toast.success(
          typeof result.message === "string"
            ? result.message
            : "تم حذف التصنيف بنجاح",
        );
      } else if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:text-destructive"
          disabled={isPending}
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </div>
          <AlertDialogTitle>حذف تصنيف «{categoryName}»؟</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {productCount > 0 ? (
              <>
                هذا التصنيف يحتوي على{" "}
                <span className="font-semibold text-foreground">
                  {productCount} منتج
                </span>
                . سيتم حذف جميع المنتجات المرتبطة به نهائيًا ولا يمكن التراجع
                عن هذا الإجراء.
              </>
            ) : (
              "سيتم حذف التصنيف نهائيًا ولا يمكن التراجع عن هذا الإجراء."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "جاري الحذف..." : "نعم، احذف"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
