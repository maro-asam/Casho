"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { DeleteCategoryAction } from "@/actions/admin/categories.actions";
import { Button } from "@/components/ui/button";

export default function DeleteCategoryButton({
  categoryId,
  storeId,
}: {
  categoryId: string;
  storeId: string;
}) {
  const [state, formAction, pending] = useActionState(
    DeleteCategoryAction.bind(null, categoryId, storeId),
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <Button
        type="submit"
        variant="destructive"
        className="rounded-lg"
        disabled={pending}
      >
        <Trash2 className="me-2 size-4" />
        {pending ? "جارى الحذف..." : "حذف"}
      </Button>
    </form>
  );
}
