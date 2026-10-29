import { Check, X } from "lucide-react";
import { toast, type ExternalToast } from "sonner";

// Toasts render outside the store root; these pass the theme's styling.

const base: ExternalToast = { unstyled: true, className: "rx-toast" };

export const rxToast = {
  success(title: string, opts: ExternalToast = {}) {
    toast.success(title, { ...base, icon: <Check className="size-4" />, ...opts });
  },
  error(title: string, opts: ExternalToast = {}) {
    toast.error(title, { ...base, className: "rx-toast rx-toast--error", icon: <X className="size-4" />, ...opts });
  },
};
