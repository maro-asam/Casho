"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ExternalLink, Loader2, MoreHorizontal, Pencil, Star, StarOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteProductAction, SetProductFlagsAction } from "@/actions/products/products.actions";
import {
  AlertDialog,
  AlertDialogAction,
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

type Props = {
  product: { id: string; name: string; isActive: boolean; isFeatured: boolean };
  storefrontUrl: string;
};

export function ProductRowActions({ product, storefrontUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [blockedByOrders, setBlockedByOrders] = useState(false);

  function setFlags(flags: { isActive?: boolean; isFeatured?: boolean }, success: string) {
    startTransition(async () => {
      const result = await SetProductFlagsAction(product.id, flags);
      if (result.ok) {
        toast.success(success);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await DeleteProductAction(product.id);
      if (result.ok) {
        setConfirmDelete(false);
        toast.success(`اتمسح "${product.name}"`);
        router.refresh();
      } else if (result.code === "HAS_ORDERS") {
        setBlockedByOrders(true);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <DropdownMenu dir="rtl" modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={pending}
            aria-label={`إجراءات ${product.name}`}
            className="relative z-10 size-8 text-muted-foreground hover:text-foreground"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/products/${product.id}/edit`}>
              <Pencil />
              تعديل
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={storefrontUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
              عرض في المتجر
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              setFlags({ isActive: !product.isActive }, product.isActive ? "المنتج اتخفى من المتجر" : "المنتج بقى ظاهر في المتجر")
            }
          >
            {product.isActive ? <EyeOff /> : <Eye />}
            {product.isActive ? "إخفاء من المتجر" : "إظهار في المتجر"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              setFlags({ isFeatured: !product.isFeatured }, product.isFeatured ? "اتشال من المميزة" : "بقى من المنتجات المميزة")
            }
          >
            {product.isFeatured ? <StarOff /> : <Star />}
            {product.isFeatured ? "إلغاء التمييز" : "تمييز المنتج"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              setBlockedByOrders(false);
              setConfirmDelete(true);
            }}
          >
            <Trash2 />
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent dir="rtl">
          {blockedByOrders ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>مينفعش نمسح المنتج ده</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{product.name}&quot; موجود في طلبات قديمة، ولازم يفضل عشان سجل الطلبات والتقارير. تقدر تخفيه من
                  المتجر فمحدش يقدر يطلبه تاني.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>رجوع</AlertDialogCancel>
                {product.isActive && (
                  <AlertDialogAction
                    onClick={() => setFlags({ isActive: false }, "المنتج اتخفى من المتجر")}
                    disabled={pending}
                  >
                    إخفاء من المتجر
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>تمسح &quot;{product.name}&quot;؟</AlertDialogTitle>
                <AlertDialogDescription>
                  المنتج هيتمسح نهائي من المتجر ومن سلات العملاء، ومش هتقدر ترجّعه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>رجوع</AlertDialogCancel>
                <Button variant="destructive" onClick={remove} disabled={pending} className="gap-1.5">
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  حذف نهائي
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
