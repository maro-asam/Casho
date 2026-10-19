"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeOff, Loader2, MoreHorizontal, Phone } from "lucide-react";
import { toast } from "sonner";

import { DismissCartAction, MarkCartContactedAction } from "@/actions/store/cart-recovery.actions";
import { WhatsAppIcon } from "@/app/store/[slug]/_components/conversion/WhatsAppButton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RecoveryStatus } from "@/lib/cart-recovery/abandoned";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

type Props = { cartKey: string; phone: string | null; status: RecoveryStatus; openHref: string };

export function CartRowActions({ cartKey, phone, status, openHref }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (status === "recovered") return null;

  function run(fn: () => Promise<unknown>, message: string) {
    startTransition(async () => {
      await fn();
      toast.success(trv(message));
      router.refresh();
    });
  }

  return (
    <div className="relative z-10 flex items-center justify-end gap-1">
      {phone && (
        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 border-[#25D366]/40 text-[#128C7E] hover:bg-[#25D366]/10 dark:text-[#25D366]">
          <Link href={openHref} scroll={false}>
            <WhatsAppIcon className="size-3.5" />
            {tr("استرجع")}
          </Link>
        </Button>
      )}
      <DropdownMenu dir={tdir()} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={pending} aria-label={tr("إجراءات السلة")} className="size-8 text-muted-foreground">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={openHref} scroll={false}>
              <WhatsAppIcon className="size-4" />
              {tr("رسالة الاسترجاع")}
            </Link>
          </DropdownMenuItem>
          {phone && (
            <DropdownMenuItem asChild>
              <a href={`tel:${phone}`} onClick={() => MarkCartContactedAction(cartKey).then(() => router.refresh())}>
                <Phone />
                {tr("اتصال")}
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => run(() => DismissCartAction(cartKey), tr("اتشالت من القائمة"))}>
            <EyeOff />
            {tr("إخفاء")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
