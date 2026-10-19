"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, MoreHorizontal, Package, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteCategoryAction } from "@/actions/admin/categories.actions";
import {
  AlertDialog,
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";

const nf = lazyIntl.number();

type Props = {
  storeId: string;
  category: { id: string; name: string; productCount: number };
  editHref: string;
  storefrontUrl: string;
  /** Every other category in the store — targets for moving products before delete. */
  otherCategories: { id: string; name: string }[];
};

export function CategoryRowActions({ storeId, category, editHref, storefrontUrl, otherCategories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moveTo, setMoveTo] = useState("");

  const hasProducts = category.productCount > 0;
  const blocked = hasProducts && otherCategories.length === 0;

  function remove() {
    startTransition(async () => {
      const result = await DeleteCategoryAction(category.id, storeId, hasProducts ? moveTo : undefined);
      if (result.ok) {
        setConfirmDelete(false);
        const target = otherCategories.find((c) => c.id === moveTo)?.name;
        toast.success(hasProducts && target ? tr("اتمسح \"{0}\" والمنتجات اتنقلت لـ \"{1}\"", category.name, target) : tr("اتمسح \"{0}\"", category.name));
        router.refresh();
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
            aria-label={tr("إجراءات {0}", category.name)}
            className="relative z-10 size-8 text-muted-foreground hover:text-foreground"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={editHref} scroll={false}>
              <Pencil />
              {tr("تعديل")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/products?category=${category.id}`}>
              <Package />
              {tr("منتجات التصنيف")}
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
            variant="destructive"
            onSelect={() => {
              setMoveTo("");
              setConfirmDelete(true);
            }}
          >
            <Trash2 />
            {tr("حذف")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={(open) => !pending && setConfirmDelete(open)}>
        <AlertDialogContent dir={tdir()}>
          {blocked ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{tr("مينفعش نمسح التصنيف ده دلوقتي")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tr("\"{0}\" فيه {1} منتج، وكل منتج لازم يبقى في تصنيف. ضيف تصنيف تاني الأول عشان ننقل له المنتجات.", category.name, nf.format(category.productCount))}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tr("رجوع")}</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{tr("تمسح \"{0}\"؟", category.name)}</AlertDialogTitle>
                <AlertDialogDescription>
                  {hasProducts
                    ? tr("التصنيف فيه {0} منتج. اختار تصنيف ننقلهم له، والمنتجات والطلبات القديمة هتفضل زي ما هي.", nf.format(category.productCount))
                    : tr("التصنيف فاضي وهيتمسح نهائي من المتجر.")}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {hasProducts && (
                <div className="space-y-2">
                  <Label htmlFor={`move-${category.id}`}>{tr("انقل المنتجات لـ")}</Label>
                  <Select value={moveTo} onValueChange={setMoveTo} dir={tdir()} disabled={pending}>
                    <SelectTrigger id={`move-${category.id}`} className="w-full">
                      <SelectValue placeholder={tr("اختار تصنيف")} />
                    </SelectTrigger>
                    <SelectContent>
                      {otherCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>{tr("رجوع")}</AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={remove}
                  disabled={pending || (hasProducts && !moveTo)}
                  className="gap-1.5"
                >
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  {hasProducts ? tr("انقل وامسح") : tr("حذف نهائي")}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
