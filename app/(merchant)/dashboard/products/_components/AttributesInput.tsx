"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <div className="flex items-center justify-center rounded-xl border border-dashed py-5 text-sm text-muted-foreground">
          لا توجد خصائص مضافة — اضغط &quot;إضافة خاصية&quot; للبدء
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 px-1 text-xs text-muted-foreground">
            <span>اسم الخاصية</span>
            <span>القيمة</span>
          </div>
          {attributes.map((attr, index) => (
            <div key={attr.id} className="flex items-center gap-2">
              <span className="flex h-7 w-6 shrink-0 items-center justify-center text-xs text-muted-foreground">
                {index + 1}
              </span>
              <Input
                placeholder="مثال: المادة"
                value={attr.key}
                onChange={(e) =>
                  updateAttribute(attr.id, "key", e.target.value)
                }
                className="rounded-xl"
              />
              <Input
                placeholder="مثال: قطن 100%"
                value={attr.value}
                onChange={(e) =>
                  updateAttribute(attr.id, "value", e.target.value)
                }
                className="rounded-xl"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:text-destructive"
                onClick={() => removeAttribute(attr.id)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addAttribute}
        className="gap-1.5 rounded-xl"
      >
        <Plus className="size-3.5" />
        إضافة خاصية
      </Button>

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
