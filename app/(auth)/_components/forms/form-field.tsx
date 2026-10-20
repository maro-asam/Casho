import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

// Apple-style controls shared by the auth forms. Fields are white (dark: #1c1c1e)
// rounded rects on the grouped background — no outlines, a soft tint ring on focus.
export const FIELD_CLASS =
  "h-12 rounded-[12px] border-transparent bg-card px-4 text-[17px] shadow-none md:text-[17px] placeholder:text-(--label-3) focus-visible:border-transparent focus-visible:ring-[3px] focus-visible:ring-primary/25 aria-invalid:border-transparent aria-invalid:ring-[3px] aria-invalid:ring-(--sys-red)/25 dark:bg-card";

/** The one prominent action per screen: tint-filled capsule. */
export const PRIMARY_BUTTON_CLASS =
  "apple-press h-12 rounded-full text-[17px] font-semibold shadow-none disabled:opacity-40";

/** Secondary action: white capsule, label in the foreground color. */
export const SECONDARY_BUTTON_CLASS =
  "apple-press h-12 rounded-full border-0 bg-card text-[17px] font-normal text-foreground shadow-none hover:bg-card/70 dark:bg-card dark:hover:bg-card/70";

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-[14px] bg-(--sys-red)/10 px-4 py-3 text-[15px] leading-6 text-[#d70015] dark:text-(--sys-red)">
      <AlertCircle className="mt-1 size-4 shrink-0" />
      {children}
    </div>
  );
}

type FormFieldProps = {
  htmlFor: string;
  label: string;
  error?: string;
  children: ReactNode;
  hint?: ReactNode;
  /** Rendered at the end of the label row (e.g. "Forgot password?"). */
  action?: ReactNode;
};

export function FormField({ htmlFor, label, error, children, hint, action }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <Label htmlFor={htmlFor} className="text-[13px] font-semibold text-muted-foreground">
          {label}
        </Label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="flex items-center gap-1.5 px-1 text-[13px] text-[#d70015] dark:text-(--sys-red)">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <div className="px-1 text-[13px] leading-5 text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
