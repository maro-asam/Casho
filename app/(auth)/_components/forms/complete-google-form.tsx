"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { RegisterGoogleAction } from "@/actions/auth/register-google.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "./form-field";

const COUNTRIES = [
  "مصر",
  "السعودية",
  "الإمارات",
  "الكويت",
  "قطر",
  "البحرين",
  "عُمان",
  "الأردن",
  "المغرب",
  "تونس",
  "الجزائر",
  "ليبيا",
  "السودان",
  "العراق",
  "لبنان",
  "سوريا",
  "فلسطين",
  "اليمن",
  "أخرى",
];

const BUSINESS_TYPES = [
  "ملابس وأزياء",
  "إلكترونيات وتقنية",
  "أغذية ومشروبات",
  "صحة وجمال",
  "منزل وديكور",
  "رياضة ولياقة",
  "كتب وتعليم",
  "مجوهرات وإكسسوارات",
  "حرف يدوية",
  "خدمات رقمية",
  "أطفال وألعاب",
  "سيارات وقطع غيار",
  "أخرى",
];

type Props = {
  email: string;
  name: string;
};

export function CompleteGoogleForm({ email, name }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    RegisterGoogleAction,
    null,
  );
  const [country, setCountry] = useState("");
  const [businessType, setBusinessType] = useState("");

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success("تم إنشاء الحساب بنجاح 🎉");
      router.push("/change-plan");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      {/* Read-only Google info */}
      <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
        <p className="text-muted-foreground">سجّلت بواسطة Google</p>
        <p className="mt-0.5 font-medium text-foreground">{name || email}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>

      <FormField
        htmlFor="storeName"
        label="اسم المتجر"
        error={state?.fieldErrors?.storeName}
      >
        <Input
          id="storeName"
          name="storeName"
          placeholder="مثال: Maro Store"
          className="h-11"
          required
        />
      </FormField>

      <FormField
        htmlFor="country"
        label="البلد"
        error={state?.fieldErrors?.country}
      >
        <Select
          name="country"
          value={country}
          onValueChange={setCountry}
          required
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="اختر البلد" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="country" value={country} />
      </FormField>

      <FormField
        htmlFor="businessType"
        label="نوع النشاط"
        error={state?.fieldErrors?.businessType}
      >
        <Select
          name="businessType"
          value={businessType}
          onValueChange={setBusinessType}
          required
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="اختر نوع نشاطك" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="businessType" value={businessType} />
      </FormField>

      <Button
        type="submit"
        disabled={isPending || !country || !businessType}
        className="h-11 w-full font-medium"
      >
        {isPending ? (
          <>
            <Loader2 className="me-2 size-4 animate-spin" />
            جاري الإنشاء...
          </>
        ) : (
          "ابدأ متجرك"
        )}
      </Button>
    </form>
  );
}
