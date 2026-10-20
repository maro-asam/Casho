"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { tr } from "@/lib/i18n/dashboard";

type Attribute = { id: string; key: string; value: string };

type AttributesInputProps = {
  defaultValues?: { key: string; value: string }[];
};

export default function AttributesInput({
  defaultValues = [],
}: AttributesInputProps) {
  const [attributes, setAttributes] = useState<Attribute[]>(() =>
    defaultValues.map((a, i) => ({
      id: `init-${i}`,
      key: a.key,
      value: a.value,
    })),
  );

  const addAttribute = () => {
    setAttributes((prev) => [
      ...prev,
      { id: `new-${prev.length}-${Date.now()}`, key: "", value: "" },
    ]);
  };

  const updateAttribute = (
    id: string,
    field: "key" | "value",
    value: string,
  ) => {
    setAttributes((prev) =>
      prev.map((attr) => (attr.id === id ? { ...attr, [field]: value } : attr)),
    );
  };

  const removeAttribute = (id: string) => {
    setAttributes((prev) => prev.filter((attr) => attr.id !== id));
  };

  const validAttributes = attributes.filter(
    (attr) => attr.key.trim() && attr.value.trim(),
  );

  return (
    <div className="space-y-2">
      {attributes.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl bg-background px-4 py-5 text-center text-[13px] text-muted-foreground">
          {tr("لا توجد خصائص مضافة — اضغط \"إضافة خاصية\" للبدء")}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 ps-9 pe-11 text-[12px] text-muted-foreground">
            <span>{tr("اسم الخاصية")}</span>
            <span>{tr("القيمة")}</span>
          </div>
          {attributes.map((attr, index) => (
            <div key={attr.id} className="flex items-center gap-2">
              <span className="flex w-7 shrink-0 items-center justify-center text-[13px] text-(--label-3) tabular-nums">
                {index + 1}
              </span>
              <Input
                placeholder={tr("مثال: المادة")}
                value={attr.key}
                onChange={(e) =>
                  updateAttribute(attr.id, "key", e.target.value)
                }
              />
              <Input
                placeholder={tr("مثال: قطن 100%")}
                value={attr.value}
                onChange={(e) =>
                  updateAttribute(attr.id, "value", e.target.value)
                }
              />
              <button
                type="button"
                aria-label={tr("حذف")}
                className="apple-press grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-(--sys-red)/10 hover:text-(--sys-red)"
                onClick={() => removeAttribute(attr.id)}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={addAttribute} className={cn(appleButton.plain, "mx-0 -ms-2")}>
        <Plus className="size-4" strokeWidth={2.4} />
        {tr("إضافة خاصية")}
      </button>

      <input
        type="hidden"
        name="attributes"
        value={JSON.stringify(
          validAttributes.map(({ key, value }) => ({ key, value })),
        )}
      />
    </div>
  );
}
