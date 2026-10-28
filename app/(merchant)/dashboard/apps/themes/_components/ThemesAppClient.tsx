"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SelectThemePresetAction } from "@/actions/settings/theme.actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { appleButton } from "@/components/saas-page";
import { STORE_THEMES, THEME_CATEGORY_LIST, type StoreTheme, type StoreThemeId } from "@/constants/store-themes";
import { filterThemesByCategory, type ThemeCategoryFilterValue } from "@/components/common/ThemeCategoryFilter";
import { THEME_PREVIEWS } from "@/app/(merchant)/(builder)/builder/_components/theme-previews";
import { cn } from "@/lib/utils";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

export default function ThemesAppClient({ storeId, activeId }: { storeId: string; activeId: string }) {
  const router = useRouter();
  const [category, setCategory] = useState<ThemeCategoryFilterValue>("all");
  const [confirming, setConfirming] = useState<StoreTheme | null>(null);
  const [pending, startTransition] = useTransition();

  const all = Object.values(STORE_THEMES);
  const categories = THEME_CATEGORY_LIST.filter((c) => filterThemesByCategory(all, c.id).length > 0);
  // The installed theme first.
  const themes = filterThemesByCategory(all, category).sort((a, b) => Number(b.id === activeId) - Number(a.id === activeId));

  function install(theme: StoreTheme) {
    startTransition(async () => {
      const res = await SelectThemePresetAction({ storeId, presetId: theme.id as StoreThemeId });
      if (res.success) {
        toast.success(tr("ثيم {0} اتثبت على متجرك", theme.name));
        setConfirming(null);
        router.refresh();
      } else {
        toast.error(trv(res.message));
      }
    });
  }

  return (
    <div className="space-y-5">
      {categories.length > 1 && (
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
          <div role="tablist" aria-label={tr("نوع المتجر")} className="flex w-max gap-1.5">
            {[{ id: "all" as const, label: tr("الكل") }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "apple-press h-8 rounded-full px-3.5 text-[13px] transition-colors",
                  category === c.id ? "bg-foreground font-semibold text-background" : "bg-card text-foreground/75 hover:text-foreground",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => {
          const Preview = THEME_PREVIEWS[theme.id];
          const installed = theme.id === activeId;
          return (
            <li key={theme.id} className={cn("apple-card flex flex-col overflow-hidden p-2.5", installed && "ring-2 ring-primary")}>
              <div className="pointer-events-none overflow-hidden rounded-[12px] [&>div]:rounded-[12px] [&>div]:border-0">
                <Preview />
              </div>
              <div className="flex flex-1 flex-col gap-3 px-1.5 pt-3 pb-1">
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] leading-[22px] font-semibold">{theme.name}</p>
                  <p className="text-[13px] leading-[18px] text-muted-foreground">{theme.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {installed ? (
                    <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary/10 px-3.5 text-[15px] font-semibold text-primary">
                      <Check className="size-4" strokeWidth={3} />
                      {tr("مثبت على متجرك")}
                    </span>
                  ) : (
                    <button type="button" disabled={pending} onClick={() => setConfirming(theme)} className={cn(appleButton.filled, "h-9 px-4 text-[15px]")}>
                      {tr("تثبيت")}
                    </button>
                  )}
                  <Link href="/builder?panel=theme" className={appleButton.plain}>
                    {tr("معاينة")}
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && !pending && setConfirming(null)}>
        <AlertDialogContent dir={tdir()} className="rounded-[22px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("تثبيت ثيم {0}؟", confirming?.name ?? "")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("الثيم هيتطبق على متجرك فوراً، وألوان وترتيب الثيم الحالي هيرجعوا لشكل الثيم الجديد. اللوجو والمنتجات والكلام اللي كتبته مش بيتغيّروا.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="rounded-full">
              {tr("رجوع")}
            </AlertDialogCancel>
            <button
              type="button"
              disabled={pending}
              onClick={() => confirming && install(confirming)}
              className={cn(appleButton.filled, "h-9 px-4 text-sm")}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {tr("تثبيت على المتجر")}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
