"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Save } from "lucide-react";

type StoreColorsProps = {
  store: {
    id: string;
    settings: {
      primaryColor: string | null;
      secondaryColor: string | null;
      navbarVariant: string;
    } | null;
  };
};

const StoreColorsSection = ({ store }: StoreColorsProps) => {
  return (
    <Card className="">
      <CardContent className="space-y-5">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          <h3 className="text-base font-semibold">ألوان المتجر</h3>
        </div>

        <form
          action="/api/store/colors"
          method="POST"
          className="grid gap-5 md:grid-cols-2"
        >
          <input type="hidden" name="storeId" value={store.id} />

          <div className="space-y-2">
            <Label htmlFor="primaryColor">اللون الأساسي</Label>

            <div className="flex items-center gap-3">
              <Input
                id="primaryColor"
                name="primaryColor"
                placeholder="#000000"
                defaultValue={store.settings?.primaryColor ?? ""}
                dir="ltr"
                className="text-left"
              />

              <input
                type="color"
                defaultValue={store.settings?.primaryColor ?? "#000000"}
                onChange={(e) => {
                  const input = document.getElementById(
                    "primaryColor",
                  ) as HTMLInputElement | null;

                  if (input) input.value = e.target.value;
                }}
                className="h-10 w-14 cursor-pointer rounded-sm border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">اللون الثانوي</Label>

            <div className="flex items-center gap-3">
              <Input
                id="secondaryColor"
                name="secondaryColor"
                placeholder="#ffffff"
                defaultValue={store.settings?.secondaryColor ?? ""}
                dir="ltr"
                className="text-left"
              />

              <input
                type="color"
                defaultValue={store.settings?.secondaryColor ?? "#ffffff"}
                onChange={(e) => {
                  const input = document.getElementById(
                    "secondaryColor",
                  ) as HTMLInputElement | null;

                  if (input) input.value = e.target.value;
                }}
                className="h-10 w-14 cursor-pointer rounded-sm border"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <Button type="submit">
              حفظ الألوان
              <Save />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StoreColorsSection;
