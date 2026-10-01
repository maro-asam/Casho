"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Link2, Loader2, MoreHorizontal, Pause, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteCouponAction, DuplicateCouponAction, SetCouponActiveAction } from "@/actions/coupons/coupons.actions";
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
import { Switch } from "@/components/ui/switch";

/** Inline on/off — optimistic, rolls back on failure. */
export function CouponActiveSwitch({ couponId, code, isActive }: { couponId: string; code: string; isActive: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(isActive);
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={checked}
      disabled={pending}
      aria-label={`تشغيل ${code}`}
      className="relative z-10"
      onCheckedChange={(next) => {
        setChecked(next);
        startTransition(async () => {
          const result = await SetCouponActiveAction(couponId, next);
          if (!result.ok) {
            setChecked(!next);
            toast.error(result.message);
            return;
          }
          toast.success(next ? `${code} شغّال` : `${code} اتوقف`);
          router.refresh();
        });
      }}
    />
  );
}

type Props = {
  coupon: { id: string; code: string; usedCount: number; isActive: boolean; popupNames: string[] };
  editHref: string;
  shareUrl: string;
};

export function CouponRowActions({ coupon, editHref, shareUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const used = coupon.usedCount > 0;

  function copy(text: string, message: string) {
    navigator.clipboard?.writeText(text).then(() => toast.success(message)).catch(() => toast.error("مقدرناش ننسخ"));
  }

  function duplicate() {
    startTransition(async () => {
      const result = await DuplicateCouponAction(coupon.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("اتعملت نسخة (متوقفة) — عدّلها وشغّلها");
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = used ? await SetCouponActiveAction(coupon.id, false) : await DeleteCouponAction(coupon.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setConfirm(false);
      toast.success(used ? `${coupon.code} اتوقف` : `اتمسح ${coupon.code}`);
      router.refresh();
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
            aria-label={`إجراءات ${coupon.code}`}
            className="relative z-10 size-8 text-muted-foreground hover:text-foreground"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link href={editHref} scroll={false}>
              <Pencil />
              تعديل
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => copy(shareUrl, "اتنسخ اللينك — الكود هيتطبق لوحده في السلة")}>
            <Link2 />
            نسخ لينك بالكود
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => copy(coupon.code, `اتنسخ ${coupon.code}`)}>
            <Copy />
            نسخ الكود
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={duplicate}>
            <Copy />
            نسخة منه
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {used ? (
            coupon.isActive && (
              <DropdownMenuItem onSelect={() => setConfirm(true)}>
                <Pause />
                إيقاف
              </DropdownMenuItem>
            )
          ) : (
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
              <Trash2 />
              حذف
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm} onOpenChange={(open) => !pending && setConfirm(open)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{used ? `توقف ${coupon.code}؟` : `تمسح ${coupon.code}؟`}</AlertDialogTitle>
            <AlertDialogDescription>
              {used
                ? "الكود اتستخدم في طلبات، فهنحتفظ بيه عشان التقارير — بس محدش هيقدر يستخدمه تاني لحد ما تشغّله."
                : "الكود هيتمسح نهائي، ولو حد حاططه في السلة هيتشال."}
              {coupon.popupNames.length > 0 &&
                ` النافذة المنبثقة "${coupon.popupNames.join("، ")}" بتستخدمه وهتقف عن الظهور.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>رجوع</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={pending} className="gap-1.5">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {used ? "إيقاف" : "حذف نهائي"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
