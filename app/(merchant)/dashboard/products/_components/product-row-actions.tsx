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
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

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
        toast.success(trv(success));
        router.refresh();
      } else {
        toast.error(trv(result.message));
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await DeleteProductAction(product.id);
      if (result.ok) {
        setConfirmDelete(false);
        toast.success(tr("اتمسح \"{0}\"", product.name));
        router.refresh();
      } else if (result.code === "HAS_ORDERS") {
        setBlockedByOrders(true);
      } else {
        toast.error(trv(result.message));
      }
    });
  }

  return (
    <>
      <DropdownMenu dir={tdir()} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={pending}
            aria-label={tr("إجراءات {0}", product.name)}
            className="relative z-10 size-8 text-muted-foreground hover:text-foreground"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/products/${product.id}/edit`}>
              <Pencil />
              {tr("تعديل")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={storefrontUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
              {tr("عرض في المتجر")}
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              setFlags({ isActive: !product.isActive }, product.isActive ? tr("المنتج اتخفى من المتجر") : tr("المنتج بقى ظاهر في المتجر"))
            }
          >
            {product.isActive ? <EyeOff /> : <Eye />}
            {product.isActive ? tr("إخفاء من المتجر") : tr("إظهار في المتجر")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              setFlags({ isFeatured: !product.isFeatured }, product.isFeatured ? tr("اتشال من المميزة") : tr("بقى من المنتجات المميزة"))
            }
          >
            {product.isFeatured ? <StarOff /> : <Star />}
            {product.isFeatured ? tr("إلغاء التمييز") : tr("تمييز المنتج")}
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
            {tr("حذف")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent dir={tdir()}>
          {blockedByOrders ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{tr("مينفعش نمسح المنتج ده")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tr("\"{0}\" موجود في طلبات قديمة، ولازم يفضل عشان سجل الطلبات والتقارير. تقدر تخفيه من المتجر فمحدش يقدر يطلبه تاني.", product.name)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tr("رجوع")}</AlertDialogCancel>
                {product.isActive && (
                  <AlertDialogAction
                    onClick={() => setFlags({ isActive: false }, tr("المنتج اتخفى من المتجر"))}
                    disabled={pending}
                  >
                    {tr("إخفاء من المتجر")}
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{tr("تمسح \"{0}\"؟", product.name)}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tr("المنتج هيتمسح نهائي من المتجر ومن سلات العملاء، ومش هتقدر ترجّعه.")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>{tr("رجوع")}</AlertDialogCancel>
                <Button variant="destructive" onClick={remove} disabled={pending} className="gap-1.5">
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  {tr("حذف نهائي")}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
