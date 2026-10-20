"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ellipsis, ExternalLink, Loader2, Package, Pencil, Trash2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appleButton, appleMenu } from "@/components/saas-page";
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
          <button type="button" disabled={pending} aria-label={tr("إجراءات {0}", category.name)} className={appleButton.more}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Ellipsis className="size-[18px]" strokeWidth={2.2} />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={appleMenu}>
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
        <AlertDialogContent dir={tdir()} className="rounded-[22px]">
          {blocked ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{tr("مينفعش نمسح التصنيف ده دلوقتي")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tr("\"{0}\" فيه {1} منتج، وكل منتج لازم يبقى في تصنيف. ضيف تصنيف تاني الأول عشان ننقل له المنتجات.", category.name, nf.format(category.productCount))}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">{tr("رجوع")}</AlertDialogCancel>
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
                <div className="apple-form space-y-1.5">
                  <label htmlFor={`move-${category.id}`} className="px-1 text-[13px] font-medium text-foreground/80">
                    {tr("انقل المنتجات لـ")}
                  </label>
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
                <AlertDialogCancel disabled={pending} className="rounded-full">{tr("رجوع")}</AlertDialogCancel>
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending || (hasProducts && !moveTo)}
                  className={appleButton.destructiveFilled}
                >
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  {hasProducts ? tr("انقل وامسح") : tr("حذف نهائي")}
                </button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
