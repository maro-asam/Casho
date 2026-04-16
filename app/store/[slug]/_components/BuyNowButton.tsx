"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AddToCartAction } from "@/actions/store/cart.actions";

type BuyNowButtonProps = {
  storeSlug: string;
  productId: string;
};

const BuyNowButton = ({ storeSlug, productId }: BuyNowButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleBuyNow = () => {
    startTransition(async () => {
      try {
        const res = await AddToCartAction(storeSlug, productId);

        if (res?.success) {
          router.push(`/store/${storeSlug}/checkout`);
          router.refresh();
        } else {
          toast.error("حدث خطأ أثناء تنفيذ الطلب");
        }
      } catch (error) {
        console.error(error);
        toast.error("حدث خطأ أثناء تنفيذ الطلب");
      }
    });
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="rounded-xl"
      onClick={handleBuyNow}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="ml-2 size-4 animate-spin" />
          جاري التحويل...
        </>
      ) : (
        <>
          <CreditCard className="ml-2 size-4" />
          شراء الآن
        </>
      )}
    </Button>
  );
};

export default BuyNowButton;