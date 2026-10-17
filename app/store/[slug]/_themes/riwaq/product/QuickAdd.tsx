"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, Loader2, Plus } from "lucide-react";

import { AddToCartAction } from "@/actions/store/cart.actions";
import { cn } from "@/lib/utils";
import { notifyCartUpdated } from "../../shared/cart-events";
import { storeHref } from "../../shared/store-path";
import { rqToast } from "../toast";

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
  "relative z-[2] grid size-11 shrink-0 place-items-center border border-(--rq-rule-strong) text-(--rq-ink) " +
  "transition-[background-color,color,border-color] duration-(--rq-dur) hover:border-(--rq-ink) hover:bg-(--rq-ink) hover:text-(--rq-paper) " +
  "active:translate-y-px disabled:pointer-events-none [&_svg]:size-[1.125rem]";

export default function QuickAdd({ storeSlug, productId, productName, productHref, hasOptions, className }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);

  if (hasOptions) {
    return (
      <Link href={productHref} aria-label={`اختار المقاس أو اللون لـ ${productName}`} className={cn(BASE, className)}>
        <Plus />
      </Link>
    );
  }

  const add = () =>
    start(async () => {
      try {
        const res = await AddToCartAction(storeSlug, productId);
        if (res?.success) {
          notifyCartUpdated(res && "added" in res ? res.added : undefined);
          setDone(true);
          rqToast.success("اتضاف للسلة", {
            description: productName,
            action: { label: "السلة", onClick: () => router.push(storeHref(storeSlug, "/cart")) },
          });
        } else {
          rqToast.error(res && "message" in res && res.message ? res.message : "حصلت مشكلة، حاول تاني");
        }
      } catch {
        rqToast.error("حصلت مشكلة، حاول تاني");
      }
    });

  return (
    <button
      type="button"
      onClick={add}
      disabled={pending}
      aria-label={`أضف ${productName} للسلة`}
      className={cn(BASE, done && "border-(--rq-accent) bg-(--rq-accent) text-(--rq-accent-ink)", className)}
    >
      {pending ? <Loader2 className="animate-spin" /> : done ? <Check /> : <Plus />}
    </button>
  );
}
