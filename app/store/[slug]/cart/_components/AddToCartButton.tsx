"use client";

import { useTransition } from "react";
import type { CSSProperties } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AddToCartAction } from "@/actions/store/cart.actions";

type AddToCartButtonProps = {
  storeSlug: string;
  productId: string;
  size: "sm" | "default" | "lg";
  variant?:
    | "default"
    | "outline"
    | "link"
    | "secondary"
    | "ghost"
    | "destructive";
  className?: string;
  style?: CSSProperties;
  /** Renders a disabled "نفد المخزون" button instead of add-to-cart. */
  soldOut?: boolean;
};

const AddToCartButton = ({
  storeSlug,
  productId,
  size,
  variant = "default",
  className,
  style,
  soldOut,
}: AddToCartButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = () => {
    startTransition(async () => {
      try {
        const res = await AddToCartAction(storeSlug, productId);

        if (res?.success) {
          toast.success("تم اضافة المنتج الي العربة");
        } else {
          toast.error(res && "message" in res && res.message ? res.message : "حدث خطأ اثناء اضافة المنتج");
        }
      } catch (error) {
        toast.error("حدث خطأ اثناء اضافة المنتج");
        console.error(error);
      }
    });
  };

  if (soldOut) {
    return (
      <Button size={size} variant={variant} disabled className={className} style={style}>
        نفد المخزون
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleAddToCart}
      disabled={isPending}
      className={className}
      style={style}
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
