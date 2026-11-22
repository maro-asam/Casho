"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Store } from "lucide-react";
import { toast } from "sonner";

import { CreateFamilyStoreAction, SwitchFamilyStoreAction } from "@/actions/store/store-family.actions";
import { appleButton } from "@/components/saas-page";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { displayHost } from "@/helpers/BuildStoreURL";
import type { StoreFamilyEntry } from "@/lib/store-family/rules";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { cn } from "@/lib/utils";

const NAME_MAX = 60;

/** A full load, so every server component and poll picks up the other account's store. */
function openDashboard() {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- the session changed: start the dashboard fresh
  window.location.assign("/dashboard");
}

/** "متاجرك" in the account menu — only for allow-listed sandbox accounts (lib/store-family). */
export function StoreFamilyItems({
  stores,
  onCreate,
  separator = true,
}: {
  stores: StoreFamilyEntry[];
  /** Shows "متجر جديد" (left out where a new store can't be started, e.g. mid-onboarding). */
  onCreate?: () => void;
  separator?: boolean;
}) {
  const [switching, startSwitch] = useTransition();

  return (
    <>
      {separator && <DropdownMenuSeparator />}
      <DropdownMenuLabel className="pb-1 text-xs font-normal text-muted-foreground">{tr("متاجرك")}</DropdownMenuLabel>
      <div className="max-h-64 overflow-y-auto">
        {stores.map((store) => (
          <DropdownMenuItem
            key={store.userId}
            disabled={switching}
            onSelect={(e) => {
              if (store.current) return;
              e.preventDefault();
              startSwitch(async () => {
                const res = await SwitchFamilyStoreAction(store.userId);
                if ("error" in res) toast.error(tr(res.error));
                else openDashboard();
              });
            }}
          >
            <Check className={cn(!store.current && "invisible")} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{store.storeName}</span>
              <span className="block truncate text-[11px] font-normal text-muted-foreground" dir="ltr">
                {displayHost(store.url)}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </div>
      {onCreate && (
        <DropdownMenuItem disabled={switching} onSelect={onCreate}>
          <Plus />
          {tr("متجر جديد")}
        </DropdownMenuItem>
      )}
    </>
  );
}

/** Onboarding has no account menu: this gets a sandbox account back to its other stores. */
export function StoreFamilySwitch({ stores }: { stores: StoreFamilyEntry[] }) {
  return (
    <DropdownMenu dir={tdir()} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="apple-press flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-card px-3 text-[13px] font-medium text-foreground/80"
        >
          <Store className="size-4" />
          {tr("متاجرك")}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-2xl p-1.5">
        <StoreFamilyItems stores={stores} separator={false} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NewFamilyStoreDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startCreate] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(tr("اسم المتجر قصير جدًا"));
      return;
    }
    startCreate(async () => {
      const res = await CreateFamilyStoreAction(trimmed);
      if ("error" in res) {
        setError(tr(res.error));
        return;
      }
      toast.success(tr("اتعمل المتجر، يلا نجهّزه"));
      openDashboard();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
        if (!next) {
          setName("");
          setError(null);
        }
      }}
    >
      <DialogContent dir={tdir()} className="gap-0 rounded-[22px] p-5 sm:max-w-md">
        <form onSubmit={submit} className="apple-form min-w-0 space-y-5">
          <DialogHeader className="space-y-1 text-start sm:text-start">
            <DialogTitle className="text-[20px] leading-[25px] font-semibold">{tr("متجر جديد")}</DialogTitle>
            <DialogDescription className="text-[15px] leading-[21px]">
              {tr("متجر جديد بتجربة مجانية 3 أيام، وهتبدأ إعداده من الأول. متاجرك القديمة بتفضل زي ما هي وتقدر ترجعلها من القائمة دي.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label htmlFor="family-store-name" className="text-[13px] font-medium text-foreground/80">
                {tr("اسم المتجر")}
              </label>
              <span className="text-[12px] text-muted-foreground tabular-nums">
                {name.trim().length}/{NAME_MAX}
              </span>
            </div>
            <Input
              id="family-store-name"
              autoFocus
              value={name}
              maxLength={NAME_MAX}
              disabled={busy}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={tr("مثال: متجر الأناقة")}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "family-store-error" : undefined}
            />
            {error && (
              <p id="family-store-error" role="alert" className="px-1 text-[12px] font-medium text-(--sys-red)">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2 pt-1 sm:justify-between">
            <button type="button" className={cn(appleButton.plain, "mx-0 h-11 px-3")} onClick={() => onOpenChange(false)} disabled={busy}>
              {tr("إلغاء")}
            </button>
            <button type="submit" disabled={busy} className={appleButton.filled}>
              {busy ? tr("جارٍ الإنشاء…") : tr("إنشاء المتجر")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
