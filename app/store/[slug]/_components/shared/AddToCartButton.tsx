"use client";

import { useTransition } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AddToCartAction } from "@/actions/store/cart.actions";

type AddToCartButtonProps = {
  storeSlug: string;
  productId: string;
};

const AddToCartButton = ({ storeSlug, productId }: AddToCartButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = () => {
    startTransition(async () => {
      try {
        const res = await AddToCartAction(storeSlug, productId);

        if (res?.success) {
          toast.success("تم اضافة المنتج الي العربة");
        } else {
          toast.error("حدث خطأ اثناء اضافة المنتج");
        }
      } catch (error) {
        toast.error("حدث خطأ اثناء اضافة المنتج");
        console.error(error);
      }
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleAddToCart}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          جاري الاضافة
        </>
      ) : (
        <>
          <ShoppingCart className="size-4" />
          اضف للعربة
        </>
      )}
    </Button>
  );
};

export default AddToCartButton;
