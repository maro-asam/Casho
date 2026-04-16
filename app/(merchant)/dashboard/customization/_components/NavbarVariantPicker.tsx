"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";

import {
  STORE_NAVBAR_VARIANTS,
  type StoreNavbarVariant,
} from "@/constants/store-navbar";
import { cn } from "@/lib/utils";
import { UpdateNavbarVariantAction } from "@/actions/settings/update-navbar-variant.actions";
import { Card, CardContent } from "@/components/ui/card";

type NavbarVariantPickerProps = {
  storeId: string;
  currentVariant?: StoreNavbarVariant | null;
};

export default function NavbarVariantPicker({
  storeId,
  currentVariant = "default",
}: NavbarVariantPickerProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (variant: StoreNavbarVariant) => {
    startTransition(async () => {
      const result = await UpdateNavbarVariantAction({ storeId, variant });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  };

  return (
    <Card dir="rtl">
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-bold">اختار شكل الـ Navbar</h3>
          <p className="text-sm text-muted-foreground">
            التاجر يقدر يبدّل بين 3 أشكال مختلفة للنافبار
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STORE_NAVBAR_VARIANTS.map((item) => {
            const isActive = currentVariant === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleChange(item.value)}
                disabled={isPending}
                className={cn(
                  "relative overflow-hidden rounded-xl border bg-background p-4 text-right transition",
                  isActive && "border-primary ring-2 ring-primary/20",
                )}
              >
                {isActive && (
                  <div className="absolute left-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold">{item.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-3">
                    {item.value === "default" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="h-8 w-16 rounded-xl bg-primary/20" />
                          <div className="flex gap-2">
                            <div className="h-3 w-12 rounded bg-foreground/10" />
                            <div className="h-3 w-12 rounded bg-foreground/10" />
                            <div className="h-3 w-12 rounded bg-foreground/10" />
                          </div>
                          <div className="h-8 w-10 rounded-xl bg-foreground/10" />
                        </div>
                        <div className="h-8 rounded-xl bg-foreground/5" />
                      </div>
                    )}

                    {item.value === "centered" && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 items-center gap-2">
                          <div className="flex gap-2">
                            <div className="h-3 w-10 rounded bg-foreground/10" />
                            <div className="h-3 w-10 rounded bg-foreground/10" />
                          </div>
                          <div className="mx-auto h-8 w-8 rounded-full bg-primary/20" />
                          <div className="mr-auto h-8 w-16 rounded-xl bg-foreground/10" />
                        </div>
                        <div className="h-8 rounded-xl bg-foreground/5" />
                      </div>
                    )}

                    {item.value === "compact" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl bg-foreground/10" />
                          <div className="h-8 w-8 rounded-xl bg-primary/20" />
                          <div className="h-8 flex-1 rounded-xl bg-foreground/5" />
                          <div className="h-8 w-14 rounded-xl bg-foreground/10" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
