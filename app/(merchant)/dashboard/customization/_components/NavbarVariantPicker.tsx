"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Navigation } from "lucide-react";

import { STORE_NAVBAR_VARIANTS, type StoreNavbarVariant } from "@/constants/store-navbar";
import { cn } from "@/lib/utils";
import { UpdateNavbarVariantAction } from "@/actions/settings/theme.actions";
import { Card, CardContent } from "@/components/ui/card";

type NavbarVariantPickerProps = {
  storeId: string;
  currentVariant?: StoreNavbarVariant | null;
};

function NavbarPreview({ variant }: { variant: StoreNavbarVariant }) {
  if (variant === "default") {
    return (
      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <div className="flex h-9 items-center justify-between rounded-lg bg-background px-3 shadow-sm">
          <div className="h-4 w-12 rounded-md bg-primary/25" />
          <div className="flex gap-2">
            <div className="h-1.5 w-9 rounded-full bg-foreground/15" />
            <div className="h-1.5 w-9 rounded-full bg-foreground/15" />
            <div className="h-1.5 w-9 rounded-full bg-foreground/15" />
          </div>
          <div className="h-6 w-8 rounded-md bg-foreground/10" />
        </div>
        <div className="h-2 w-4/5 rounded-full bg-muted-foreground/10" />
      </div>
    );
  }

  if (variant === "centered") {
    return (
      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <div className="flex h-9 items-center rounded-lg bg-background px-3 shadow-sm">
          <div className="flex flex-1 gap-2">
            <div className="h-1.5 w-9 rounded-full bg-foreground/15" />
            <div className="h-1.5 w-9 rounded-full bg-foreground/15" />
          </div>
          <div className="mx-2 h-6 w-6 rounded-full bg-primary/25" />
          <div className="flex flex-1 justify-end">
            <div className="h-6 w-9 rounded-md bg-foreground/10" />
          </div>
        </div>
        <div className="flex justify-center">
          <div className="h-2 w-1/2 rounded-full bg-muted-foreground/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="flex h-8 items-center gap-2 rounded-lg bg-background px-2 shadow-sm">
        <div className="h-5 w-5 rounded-md bg-primary/25" />
        <div className="h-5 flex-1 rounded-md bg-foreground/8" />
        <div className="h-5 w-5 rounded-md bg-foreground/10" />
        <div className="h-5 w-5 rounded-md bg-foreground/10" />
      </div>
    </div>
  );
}

export default function NavbarVariantPicker({
  storeId,
  currentVariant = "default",
}: NavbarVariantPickerProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (variant: StoreNavbarVariant) => {
    startTransition(async () => {
      const result = await UpdateNavbarVariantAction({ storeId, variant });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Card dir="rtl">
      <CardContent className="space-y-5">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Navigation className="size-4" />
          </div>
          <div>
            <h2 className="font-semibold">شكل القائمة العلوية</h2>
            <p className="text-xs text-muted-foreground">اختر تصميم الـ Navbar المناسب لمتجرك</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {STORE_NAVBAR_VARIANTS.map((item) => {
            const isActive = currentVariant === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => !isActive && handleChange(item.value)}
                disabled={isPending}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-4 text-right transition-all duration-200",
                  "disabled:pointer-events-none disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                    : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                )}
              >
                {isActive && (
                  <div className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                    <Check className="h-3 w-3" />
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">{item.label}</h4>
                      {isActive && (
                        <span className="text-[10px] font-medium text-primary">مُفعّل</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <NavbarPreview variant={item.value} />
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
