"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusText } from "@/components/saas-page";
import { DisconnectShopifyAction } from "@/actions/integrations/shopify-import.actions";
import type { ConnectionView } from "@/lib/integrations/import/views";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";
import { ShopifyMark } from "./import-ui";

/** The connected Shopify store, as a Settings group (sidebar). */
export function ShopCard({ connection, busy }: { connection: ConnectionView; busy?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const healthy = connection.status === "ACTIVE";

  function disconnect() {
    startTransition(async () => {
      const result = await DisconnectShopifyAction();
      if (!result.ok) {
        toast.error(trv(result.error));
        return;
      }
      toast.success(tr("تم إلغاء الربط مع Shopify"));
      router.refresh();
    });
  }

  return (
    <section className="space-y-2" aria-label={tr("متجرك على Shopify")}>
      <h2 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("متجرك على Shopify")}</h2>
      <div className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:16px]">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <ShopifyMark />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold">{connection.shopName}</p>
            <StatusText tone={healthy ? "success" : "warning"}>{healthy ? tr("متصل") : tr("محتاج إعادة ربط")}</StatusText>
          </div>
        </div>
        <div className="flex min-h-11 items-center justify-between gap-3 px-4 text-[15px]">
          <span>{tr("الرابط")}</span>
          <span dir="ltr" className="min-w-0 truncate text-muted-foreground">
            {connection.shopDomain}
          </span>
        </div>
        {connection.currencyCode && (
          <div className="flex min-h-11 items-center justify-between gap-3 px-4 text-[15px]">
            <span>{tr("العملة")}</span>
            <span className="text-muted-foreground">{connection.currencyCode}</span>
          </div>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={pending}
              className="flex min-h-11 w-full items-center justify-center gap-2 px-4 text-[15px] text-(--sys-red) hover:bg-(--fill-3)/60 disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Unlink className="size-4" />}
              {tr("إلغاء الربط")}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent dir={tdir()} className="max-w-[20rem] gap-0 p-0 text-center">
            <AlertDialogHeader className="items-center gap-1 px-5 pt-6 pb-5 text-center sm:text-center">
              <AlertDialogTitle className="text-[17px] font-semibold">{tr("إلغاء الربط مع Shopify؟")}</AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] leading-[18px]">
                {busy ? tr("الاستيراد الشغال هيتلغي. ") : ""}
                {tr("البيانات اللي اتنقلت بالفعل هتفضل في متجرك على Kasho. هنمسح مفاتيح الوصول لـ Shopify من عندنا.")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="grid grid-cols-2 gap-0 border-t border-border/60 sm:space-x-0">
              <AlertDialogCancel className="m-0 h-11 rounded-none border-0 bg-transparent text-[17px] text-primary shadow-none hover:bg-(--fill-3)/60">
                {tr("رجوع")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={disconnect}
                className="m-0 h-11 rounded-none border-0 border-s border-border/60 bg-transparent text-[17px] font-semibold text-(--sys-red) shadow-none hover:bg-(--fill-3)/60"
              >
                {tr("إلغاء الربط")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
