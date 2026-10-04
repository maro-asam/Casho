"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Check, Loader2, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { AddToCartAction } from "@/actions/store/cart.actions";
import { cn } from "@/lib/utils";
import { notifyCartUpdated } from "../../shared/cart-events";

type Props = {
  storeSlug: string;
  productId: string;
  productName: string;
  productHref: string;
  /** Product has sizes/colors — send the shopper to choose them first. */
  hasOptions: boolean;
  className?: string;
};

const BASE =
  "relative z-10 grid size-10 place-items-center rounded-full bg-background/95 text-foreground shadow-[0_2px_8px_rgb(0_0_0/0.12)] " +
  "ring-1 ring-black/5 backdrop-blur transition-[transform,background-color,color] duration-(--c-motion) " +
  "hover:bg-primary hover:text-primary-foreground active:scale-95 disabled:pointer-events-none [&_svg]:size-[1.125rem]";

export default function QuickAddButton({
  storeSlug,
  productId,
  productName,
  productHref,
  hasOptions,
  className,
}: Props) {
  const [pending, start] = useTransition();

  if (hasOptions) {
    return (
      <Link href={productHref} aria-label={`اختر المقاس أو اللون لـ ${productName}`} className={cn(BASE, className)}>
        <Plus />
      </Link>
    );
  }

  const add = () =>
    start(async () => {
      try {
        const res = await AddToCartAction(storeSlug, productId);
        if (res?.success) {
          notifyCartUpdated();
          toast.success("اتضاف للسلة", {
            description: productName,
            icon: <Check className="size-4" />,
          });
        } else {
          toast.error(res && "message" in res && res.message ? res.message : "حصلت مشكلة، حاول تاني");
        }
      } catch {
        toast.error("حصلت مشكلة، حاول تاني");
      }
    });

  return (
    <button
      type="button"
      onClick={add}
      disabled={pending}
      aria-label={`أضف ${productName} للسلة`}
      className={cn(BASE, className)}
    >
      {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
    </button>
  );
}
