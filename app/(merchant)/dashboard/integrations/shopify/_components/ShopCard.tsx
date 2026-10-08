"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { StatusPill } from "@/components/saas-page";
import { DisconnectShopifyAction } from "@/actions/integrations/shopify-import.actions";
import type { ConnectionView } from "@/lib/integrations/import/views";

export function ShopCard({ connection, busy }: { connection: ConnectionView; busy?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const healthy = connection.status === "ACTIVE";

  function disconnect() {
    startTransition(async () => {
      const result = await DisconnectShopifyAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("تم إلغاء الربط مع Shopify");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          <ShoppingBag className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{connection.shopName}</p>
            <StatusPill tone={healthy ? "success" : "warning"}>{healthy ? "متصل" : "محتاج إعادة ربط"}</StatusPill>
          </div>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            <span dir="ltr" className="font-mono">{connection.shopDomain}</span>
            {connection.currencyCode && <span>العملة: {connection.currencyCode}</span>}
          </p>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" disabled={pending} className="self-start text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 sm:self-auto">
            <Unlink className="size-4" />
            إلغاء الربط
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء الربط مع Shopify؟</AlertDialogTitle>
            <AlertDialogDescription>
              {busy ? "الاستيراد الشغال هيتلغي. " : ""}
              البيانات اللي اتنقلت بالفعل هتفضل في متجرك على Kasho. هنمسح مفاتيح الوصول لـ Shopify من عندنا.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>رجوع</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={disconnect}>
              إلغاء الربط
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
