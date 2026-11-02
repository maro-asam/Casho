import { Check, X } from "lucide-react";
import { toast, type ExternalToast } from "sonner";

// Toasts render outside the store root; these pass the theme's styling.

const base: ExternalToast = { unstyled: true, richColors: false, className: "sg-toast" };

export const sgToast = {
  success(title: string, opts: ExternalToast = {}) {
    toast.success(title, { ...base, icon: <Check className="size-4" />, ...opts });
  },
  error(title: string, opts: ExternalToast = {}) {
    toast.error(title, { ...base, className: "sg-toast sg-toast--error", icon: <X className="size-4" />, ...opts });
  },
};
